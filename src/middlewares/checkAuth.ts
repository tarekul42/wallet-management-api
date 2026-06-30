import { NextFunction, Request, Response } from "express";
import AppError from "../errorHelpers/AppError.js";
import { envVars } from "../config/env.js";
import { verifyToken } from "../utils/jwt.js";
import { JwtPayload } from "jsonwebtoken";
import { User } from "../modules/user/user.model.js";
import catchAsync from "../utils/catchAsync.js";
import httpStatus from "http-status-codes";
import { assertUserActive, assertUserVerified } from "../utils/checkUserStatus.js";

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
      throw new AppError(httpStatus.UNAUTHORIZED, "Access token not found");
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

    assertUserActive(user);
    assertUserVerified(user);

    if (authRoles.length > 0 && !authRoles.includes(user.role)) {
      const roleLabel = user.role === "SUPER_ADMIN" ? "Super Admins" : user.role === "ADMIN" ? "Admins" : user.role === "AGENT" ? "Agents" : user.role;
      const requiredLabel = authRoles.length === 1
        ? authRoles[0] === "USER" ? "users" : authRoles[0].toLowerCase().replace(/_/g, " ")
        : `${authRoles.map(r => r.toLowerCase().replace(/_/g, " ")).join(", ")}`;
      throw new AppError(
        httpStatus.FORBIDDEN,
        `${roleLabel} are not allowed to perform this action. Only ${requiredLabel} can.`,
      );
    }

    req.user = verifiedToken;
    next();
  });

export default checkAuth;
