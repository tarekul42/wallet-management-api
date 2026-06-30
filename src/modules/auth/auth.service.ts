import { StatusCodes } from "http-status-codes";
import { Document } from "mongoose";
import AppError from "../../errorHelpers/AppError.js";
import { ApprovalStatus, IUser } from "../user/user.interface.js";
import { User } from "../user/user.model.js";
import { createUserAndWallet } from "../user/user.helpers.js";
import { createNewAccessToken, createUserTokens } from "../../utils/userTokens.js";
import { envVars } from "../../config/env.js";
import { verifyToken } from "../../utils/jwt.js";
import { generateToken, sendMockEmail } from "./auth.utils.js";
import { notifyRegistration } from "../../utils/notification.utils.js";
import { withTransaction } from "../../utils/withTransaction.js";

const getNewAccessToken = async (refreshToken: string) => {
  const newAccessToken = await createNewAccessToken(refreshToken);

  return { accessToken: newAccessToken };
};

const registerUser = async (payload: IUser) => {
  const email = payload.email;

  if (typeof email !== "string" || email.trim() === "") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "A valid email address must be provided."
    );
  }

  // check if user exists
  const user = await User.findOne({ email });

  if (user) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "User already exists with this email."
    );
  }

  // As per instructions, only 'user' and 'agent' can register through this public service.
  if (payload.role !== "USER" && payload.role !== "AGENT") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Registration is only available for users and agents."
    );
  }

  // Sanitize payload to prevent mass assignment
  const userData: Partial<IUser> = {
    name: payload.name,
    email,
    password: payload.password,
    phone: payload.phone,
    address: payload.address,
    nid: payload.nid,
    role: payload.role,
    verificationToken: generateToken(),
  };

  if (userData.role === "AGENT") {
    userData.approvalStatus = ApprovalStatus.PENDING;
    userData.commissionRate = null;
  }

  const newUser = await withTransaction(async (session) => {
    return createUserAndWallet(userData, session);
  }, "Registration");

  const result = { ...newUser.toObject() };

  sendMockEmail(
    newUser.email,
    "Verify Your Email",
    `Your verification token is: ${userData.verificationToken}`,
  );

  notifyRegistration({
    userId: newUser._id.toString(),
    email: newUser.email,
    name: newUser.name,
  });

  return result;
};

const credentialsLogin = async (user: IUser & Document) => {
  const userTokens = createUserTokens(user);

  const userObject = user.toObject();
  delete userObject.password;
  const sanitizedUser = userObject;

  return {
    user: sanitizedUser,
    ...userTokens,
  };
};

const logoutUser = async (refreshToken: string) => {
  try {
    const decodedToken = await verifyToken(
      refreshToken,
      envVars.JWT_REFRESH_SECRET
    );
    const userId = decodedToken.userId;

    await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });

    return { message: "Logged out successfully." };
  } catch {
    // We swallow the error and return success to prevent token enumeration/leaking state
    // If the token is invalid, the user is effectively logged out anyway
    return { message: "Logged out successfully." };
  }
};

const verifyEmail = async (token: string) => {
  // Ensure token is a primitive string to prevent NoSQL injection
  if (typeof token !== "string") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid verification token");
  }

  const user = await User.findOne({ verificationToken: { $eq: token } });

  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid verification token");
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();

  return { message: "Email verified successfully" };
};

const forgotPassword = async (email: string) => {
  // Ensure email is a primitive string to prevent NoSQL injection
  if (typeof email !== "string") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid email");
  }

  const user = await User.findOne({ email: { $eq: email } });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  const resetToken = generateToken();
  user.resetPasswordToken = resetToken;
  await user.save();

  sendMockEmail(
    user.email,
    "Reset Your Password",
    `Your password reset token is: ${resetToken}`,
  );

  return { message: "Password reset email sent" };
};

const resetPassword = async (token: string, newPassword: string) => {
  const user = await User.findOne({
    resetPasswordToken: { $eq: token },
  }).select("+password");

  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid reset token");
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  await user.save();

  return { message: "Password reset successfully" };
};

export const AuthServices = {
  getNewAccessToken,
  registerUser,
  credentialsLogin,
  logoutUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
