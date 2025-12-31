/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { ApprovalStatus, IUser } from "../user/user.interface";
import { User } from "../user/user.model";
import { createUserAndWallet } from "../user/user.helpers";
import { createNewAccessToken, createUserTokens } from "../../utils/userTokens";
import { envVars } from "../../config/env";
import { verifyToken } from "../../utils/jwt";
import { generateToken, sendMockEmail } from "./auth.utils";
import { notifyRegistration } from "../../utils/notification.utils";

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

  // Set default values for agents
  if (userData.role === "AGENT") {
    userData.approvalStatus = ApprovalStatus.PENDING;
    userData.commissionRate = null; // Rate will be set upon approval
  }

  const session = await mongoose.startSession();
  let result;

  try {
    session.startTransaction();

    const newUser = await createUserAndWallet(userData, session);

    await session.commitTransaction();

    result = {
      ...newUser.toObject(),
    };

    sendMockEmail(
      newUser.email,
      "Verify Your Email",
      `Your verification token is: ${userData.verificationToken}`,
    );

    // Send registration notification
    notifyRegistration({
      userId: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
    });
  } catch (error) {
    await session.abortTransaction();
    const errMsg = error instanceof Error ? error.message : String(error);
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to register user. Please try again later. ${errMsg}`
    );
  } finally {
    session.endSession();
  }

  return result;
};

const credentialsLogin = async (user: any) => {
  const userTokens = createUserTokens(user);

  const userObject = user.toObject();
  const { password, ...sanitizedUser } = userObject;

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
    const userId = decodedToken.id;

    await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });

    return { message: "Logged out successfully." };
  } catch (error) {
    // We swallow the error and return success to prevent token enumeration/leaking state
    // If the token is invalid, the user is effectively logged out anyway
    return { message: "Logged out successfully." };
  }
};

const verifyEmail = async (token: string) => {
  const user = await User.findOne({ verificationToken: token });

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
