import bcrypt from "bcryptjs";
import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { generateToken } from "../../utils/jwt";
import { IsActive, IUser } from "../user/user.interface";
import { User } from "../user/user.model";
import { Wallet } from "../wallet/wallet.model";
import { createNewAccessTokenWithRefreshToken } from "../../utils/userTokens";
import createVerificationToken from "../../utils/createVerificationToken";
import VerificationToken from "../verificationToken/verificationToken.model";

const credentialsLogin = async (payload: Partial<IUser>) => {
  const user = await User.findOne({ email: payload.email }).select("+password"); // password was default excluded.

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (user.isActive === IsActive.INACTIVE) {
    throw new AppError(StatusCodes.FORBIDDEN, "User is inactive");
  }

  if (user.isActive === IsActive.BLOCKED) {
    throw new AppError(StatusCodes.FORBIDDEN, "User is blocked");
  }

  if (user.isDeleted === true) {
    throw new AppError(StatusCodes.FORBIDDEN, "User is deleted");
  }

  if (user.isVerified === false) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "User is not verified yet. please verify to login.",
    );
  }

  const isPasswordValid = await bcrypt.compare(
    payload.password as string,
    user.password,
  );

  if (!isPasswordValid) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid password");
  }

  const tokenPayload = {
    email: user.email,
    role: user.role,
  };

  const token = generateToken(
    tokenPayload,
    envVars.JWT_ACCESS_SECRET,
    envVars.JWT_ACCESS_EXPIRES,
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userData } = user.toObject();

  return {
    token,
    user: userData,
  };
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

  const session = await mongoose.startSession();
  let result;

  try {
    session.startTransaction();

    // Hash password before saving
    payload.password = await bcrypt.hash(payload.password, 12);

    // Create the new user
    const newUserArr = await User.create([payload], { session });
    const newUser = newUserArr[0];

    if (!newUser) {
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "User creation failed during registration.",
      );
    }

    // Automatically create a wallet for the new user or agent
    // with an initial balance of ৳50 as per requirements.
    await Wallet.create(
      [
        {
          owner: newUser._id,
          balance: 50,
        },
      ],
      { session },
    );

    const verificationToken = await createVerificationToken(newUser._id);

    await session.commitTransaction();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userData } = newUser.toObject();

    result = {
      ...userData,
      verificationToken,
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
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const verificationToken = await VerificationToken.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!verificationToken) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Token is invalid or has expired.",
    );
  }

  const user = await User.findById(verificationToken.userId);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
  }

  if (user.isVerified) {
    await VerificationToken.findByIdAndDelete(verificationToken._id);
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "This account has already been verified.",
    );
  }

  user.isVerified = true;
  await user.save();

  await VerificationToken.findByIdAndDelete(verificationToken._id);

  return { message: "Email verified successfully. You can now log in." };
};

const logoutUser = () => {
  // For a stateless JWT architecture, logout is primarily a client-side responsibility.
  // The client must securely discard the JWT and refresh token.
  // This backend endpoint serves to acknowledge the logout request and instruct the client.
  // The controller handling this request will clear the cookies.
  return { message: "Logged out successfully." };
};

const getNewAccessToken = async (refreshToken: string) => {
  const newAccessToken =
    await createNewAccessTokenWithRefreshToken(refreshToken);

  return { accessToken: newAccessToken };
};

export const AuthServices = {
  credentialsLogin,
  getNewAccessToken,
  registerUser,
  verifyEmail,
  logoutUser,
};
