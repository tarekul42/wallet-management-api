import { StatusCodes } from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import AppError from "../errorHelpers/AppError";
import { envVars } from "../config/env";
import { verifyToken } from "../utils/jwt";
import { JwtPayload } from "jsonwebtoken";
import { User } from "../modules/user/user.model";
import { IsActive } from "../modules/user/user.interface";
import { catchAsync } from "../utils/catchAsync";

const checkAuth = (...authRoles: string[]) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        "Authorization token missing, please login",
      );
    }

    const token = authHeader.split(" ")[1];
    const verifiedToken = verifyToken(
      token,
      envVars.JWT_ACCESS_SECRET,
    ) as JwtPayload;

    if (!verifiedToken) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "You are not authorized to view this route",
      );
    }

    if (!verifiedToken?.userId || !verifiedToken?.role) {
      throw new AppError(StatusCodes.FORBIDDEN, "Invalid token payload");
    }

    if (authRoles.length > 0 && !authRoles.includes(verifiedToken.role)) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "You are not permitted to access this route",
      );
    }

    const user = await User.findById(verifiedToken.userId);

    if (!user) {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        "User does not exist. Please login again",
      );
    }

    if (
      user.isActive !== undefined &&
      [IsActive.BLOCKED, IsActive.INACTIVE].includes(user.isActive)
    ) {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        `User is ${user.isActive.toLowerCase()}`,
      );
    }

    if (user.isDeleted) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "User is deleted");
    }

    if (!user.isVerified) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "User is not verified");
    }

    req.user = verifiedToken;
    next();
  });

export default checkAuth;
