import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../config/env.js";
import { IUser } from "../modules/user/user.interface.js";
import { generateToken, verifyToken } from "./jwt.js";
import { User } from "../modules/user/user.model.js";
import { assertUserActive } from "./checkUserStatus.js";
import AppError from "../errorHelpers/AppError.js";
import httpStatus from "http-status-codes";

const createUserTokens = (user: Partial<IUser>) => {
  const jwtPayload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
  };

  const accessToken = generateToken(
    jwtPayload,
    envVars.JWT_ACCESS_SECRET,
    envVars.JWT_ACCESS_EXPIRES,
  );

  const refreshToken = generateToken(
    jwtPayload,
    envVars.JWT_REFRESH_SECRET,
    envVars.JWT_REFRESH_EXPIRES,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const createNewAccessToken = async (refreshToken: string) => {
  // token verification
  let verifiedRefreshToken: JwtPayload;
  try {
    verifiedRefreshToken = await verifyToken(
      refreshToken,
      envVars.JWT_REFRESH_SECRET,
    ) as JwtPayload;
  } catch {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Invalid or expired refresh token",
    );
  }

  if (!verifiedRefreshToken.email) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Refresh token payload invalid",
    );
  }

  // verify user
  const isUserExist = await User.findOne({ email: verifiedRefreshToken.email });

  if (!isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User not found");
  }
  assertUserActive(isUserExist);

  const jwtPayload = {
    userId: isUserExist._id,
    email: isUserExist.email,
    role: isUserExist.role,
    tokenVersion: isUserExist.tokenVersion,
  };
  const accessToken = generateToken(
    jwtPayload,
    envVars.JWT_ACCESS_SECRET,
    envVars.JWT_ACCESS_EXPIRES,
  );
  return accessToken;
};

export { createUserTokens, createNewAccessToken };
