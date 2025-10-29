import { StatusCodes } from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import AppError from "../errorHelpers/AppError";
import { envVars } from "../config/env";
import { verifyToken } from "../utils/jwt";
import { JwtPayload } from "jsonwebtoken";
import { User } from "../modules/user/user.model";
import { IsActive } from "../modules/user/user.interface";

export const checkAuth =
  (...authRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          "No token recieved, Please login!"
        );
      }

      const token = authHeader.split(" ")[1];

      if (!token) {
        throw new AppError(
          StatusCodes.UNAUTHORIZED,
          "No token provided, Please login!"
        );
      }

      const verifiedToken = verifyToken(
        token,
        envVars.JWT_ACCESS_SECRET
      ) as JwtPayload;

      if (!verifiedToken) {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          "You are not authorized to view this route"
        );
      }

      if (!authRoles.includes(verifiedToken.role)) {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          "You are not permitted to access this route"
        );
      }

      const isUserExists = await User.findById(verifiedToken.userId);

      if (!isUserExists) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "User Does Not Exists. Please login again"
        );
      }

      if (
        isUserExists.isActive === IsActive.BLOCKED ||
        isUserExists.isActive === IsActive.INACTIVE
      ) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          `User is ${isUserExists.isActive}`
        );
      }

      if (isUserExists.isDeleted) {
        throw new AppError(StatusCodes.BAD_REQUEST, "User is deleted");
      }

      if (!isUserExists.isVerified) {
        throw new AppError(StatusCodes.BAD_REQUEST, "User is not verified");
      }

      req.user = verifiedToken;
      next();
    } catch (error) {
      next(error);
    }
  };
