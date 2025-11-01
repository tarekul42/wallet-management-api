import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status-codes";
import { UserServices } from "./user.service";
import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await UserServices.getMyProfile(user.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile fetched successfully",
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await UserServices.updateMyProfile(user.userId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.getAllUsers();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users fetched successfully",
    data: result,
  });
});

const blockUser = catchAsync(async (req: Request, res: Response) => {
  const currentUser = req.user as JwtPayload;
  const targetUserId = req.params.id;
  const result = await UserServices.blockUser(currentUser.userId, targetUserId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User blocked successfully",
    data: result,
  });
});

const unblockUser = catchAsync(async (req: Request, res: Response) => {
  const targetUserId = req.params.id;
  const result = await UserServices.unblockUser(targetUserId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User unblocked successfully",
    data: result,
  });
});

const agentApprovalByAdmin = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const { approvalStatus } = req.body;
  const result = await UserServices.agentApprovalByAdmin(userId, {
    approvalStatus,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Agent approved successfully",
    data: result,
  });
});

export const UserControllers = {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  blockUser,
  unblockUser,
  agentApprovalByAdmin,
};
