import httpStatus, { StatusCodes } from "http-status-codes";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { IsActive, IUser } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import { generateToken, TokenError, verifyToken } from "./jwt";
import { JwtPayload } from "jsonwebtoken";

const createUserTokens = (user: Partial<IUser>) => {
  const jwtPayload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };
  const accessToken = generateToken(
    jwtPayload,
    envVars.JWT_ACCESS_SECRET,
    envVars.JWT_ACCESS_EXPIRES
  );

  const refreshToken = generateToken(
    jwtPayload,
    envVars.JWT_REFRESH_SECRET,
    envVars.JWT_REFRESH_EXPIRES
  );

  return {
    accessToken,
    refreshToken,
  };
};

const createNewAccessTokenWithRefreshToken = async (refreshToken: string) => {
  let verifiedRefreshToken: JwtPayload;

  try {
    verifiedRefreshToken = verifyToken(
      refreshToken,
      envVars.JWT_REFRESH_SECRET
    ) as JwtPayload;
  } catch (err) {
    if (err instanceof TokenError) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Invalid or expired refresh token"
      );
    }
    throw err;
  }

  if (!verifiedRefreshToken.email) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Refresh token payload invalid"
    );
  }

  const isUserExist = await User.findOne({ email: verifiedRefreshToken.email });

  if (!isUserExist) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User does not exist");
  }
  if (
    isUserExist.isActive === IsActive.BLOCKED ||
    isUserExist.isActive === IsActive.INACTIVE
  ) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      `User is ${isUserExist.isActive}`
    );
  }
  if (isUserExist.isDeleted) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User is deleted");
  }

  const jwtPayload = {
    userId: isUserExist._id.toString(),
    email: isUserExist.email,
    role: isUserExist.role,
  };

  const accessToken = generateToken(
    jwtPayload,
    envVars.JWT_ACCESS_SECRET,
    envVars.JWT_ACCESS_EXPIRES
  );

  return accessToken;
};

export { createUserTokens, createNewAccessTokenWithRefreshToken };
