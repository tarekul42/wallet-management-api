import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  blockUser,
  unblockUser,
} from "./user.service";
import { sendResponse } from "../../utils/sendResponse";
import { User } from "./user.model";
import { Role } from "./user.interface";

// User Controller
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.user as JwtPayload).userId;
    const user = await getMyProfile(userId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Profile fetched successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.user as JwtPayload).userId;
    const user = await updateMyProfile(userId, req.body);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await getAllUsers();
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const blockUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentUser = req.user as JwtPayload;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) throw new Error("User not found");

    // Prevent self-block
    if (currentUser.userId === req.params.id) {
      return res
        .status(403)
        .json({ success: false, message: "Admins cannot block themselves." });
    }

    // Only SUPER_ADMIN can block/unblock ADMIN or SUPER_ADMIN
    if (
      (targetUser.role === Role.ADMIN || targetUser.role === Role.SUPER_ADMIN) &&
      currentUser.role !== Role.SUPER_ADMIN
    ) {
      return res.status(403).json({
        success: false,
        message: "Only SUPER_ADMIN can block/unblock ADMIN or SUPER_ADMIN.",
      });
    }

    const user = await blockUser(req.params.id);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User blocked successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const unblockUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentUser = req.user as JwtPayload;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) throw new Error("User not found");

    // Prevent self-unblock
    if (currentUser.userId === req.params.id) {
      return res
        .status(403)
        .json({ success: false, message: "Admins cannot unblock themselves." });
    }

    // Only SUPER_ADMIN can unblock ADMIN or SUPER_ADMIN
    if (
      (targetUser.role === Role.ADMIN || targetUser.role === Role.SUPER_ADMIN) &&
      currentUser.role !== Role.SUPER_ADMIN
    ) {
      return res.status(403).json({
        success: false,
        message: "Only SUPER_ADMIN can block/unblock ADMIN or SUPER_ADMIN.",
      });
    }

    const user = await unblockUser(req.params.id);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User unblocked successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
