import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { ApprovalStatus, IUser } from "../user/user.interface";
import { User } from "../user/user.model";
import { createNewAccessTokenWithRefreshToken } from "../../utils/userTokens";
import { createUserAndWallet } from "../user/user.helpers";
import VerificationToken from "../verificationToken/verificationToken.model";

const getNewAccessToken = async (refreshToken: string) => {
  const newAccessToken =
    await createNewAccessTokenWithRefreshToken(refreshToken);

  return { accessToken: newAccessToken };
};

const registerUser = async (payload: IUser) => {
  // check if user exists
  const user = await User.findOne({ email: payload.email });

  if (user) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "User already exists with this email.",
    );
  }

  // As per instructions, only 'user' and 'agent' can register through this public service.
  if (payload.role !== "USER" && payload.role !== "AGENT") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Registration is only available for users and agents.",
    );
  }

  // Sanitize payload to prevent mass assignment
  const userData: Partial<IUser> = {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    phone: payload.phone,
    address: payload.address,
    nid: payload.nid,
    role: payload.role,
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
  } catch (error) {
    await session.abortTransaction();
    const errMsg = error instanceof Error ? error.message : String(error);
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to register user. Please try again later. ${errMsg}`,
    );
  } finally {
    session.endSession();
  }

  return result;
};

const verifyEmail = async (token: string) => {
  const verificationToken = await VerificationToken.findOne({ token });

  if (!verificationToken) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid or expired token.");
  }

  if (verificationToken.expiresAt < new Date()) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Verification token expired.");
  }

  const user = await User.findById(verificationToken.userId);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
  }

  if (user.isVerified) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is already verified.");
  }

  user.isVerified = true;
  await user.save();

  await VerificationToken.deleteOne({ _id: verificationToken._id });

  return { message: "Email verified successfully." };
};

const logoutUser = () => {
  return { message: "Logged out successfully." };
};

export const AuthServices = {
  getNewAccessToken,
  registerUser,
  logoutUser,
  verifyEmail,
};
