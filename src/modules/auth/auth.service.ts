import { StatusCodes } from "http-status-codes";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { generateToken } from "../../utils/jwt";
import { IsActive, IUser } from "../user/user.interface";
import { User } from "../user/user.model";
import bcrypt from "bcryptjs";
import { createNewAccessTokenWithRefreshToken } from "../../utils/userTokens";

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
      "User is not verified yet. please verify to login."
    );
  }

  const isPasswordValid = await bcrypt.compare(
    payload.password as string,
    user.password
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
    envVars.JWT_ACCESS_EXPIRES
  );

  const userData = user.toObject() as Partial<IUser>;
  delete userData.password;

  return {
    token,
    user: userData,
  };
};

const getNewAccessToken = async (refreshToken: string) => {
  const newAccessToken = await createNewAccessTokenWithRefreshToken(
    refreshToken
  );

  return { accessToken: newAccessToken };
};

export const AuthServices = {
  credentialsLogin,
  getNewAccessToken,
};
