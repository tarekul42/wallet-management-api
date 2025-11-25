import { NextFunction, Request, Response } from "express";
import AppError from "../errorHelpers/AppError";
import { envVars } from "../config/env";
import { verifyToken } from "../utils/jwt";
import { JwtPayload } from "jsonwebtoken";
import { User } from "../modules/user/user.model";
import { IsActive } from "../modules/user/user.interface";
import catchAsync from "../utils/catchAsync";
import httpStatus from "http-status-codes";

const checkAuth = (...authRoles: string[]) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Authorization token missing, please login",
      );
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return next(
        new AppError(httpStatus.UNAUTHORIZED, "Access token not found"),
      );
    }

    const verifiedToken = (await verifyToken(
      token,
      envVars.JWT_ACCESS_SECRET,
    )) as JwtPayload;

    if (!verifiedToken || !verifiedToken.userId) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Invalid or expired token");
    }

    const user = await User.findById(verifiedToken.userId);

    if (!user) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "User not found. Please login again",
      );
    }

    if (user.isDeleted) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "This account has been deleted.",
      );
    }

    if (user.isActive === IsActive.BLOCKED) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "This account has been blocked.",
      );
    }

    if (!user.isVerified) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Your account is not verified.",
      );
    }

    if (authRoles.length > 0 && !authRoles.includes(user.role)) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not authorized to access this route.",
      );
    }

    req.user = verifiedToken;
    next();
  });

export default checkAuth;
