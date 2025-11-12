import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status-codes";
import { UserServices } from "./user.service";
import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";
import AppError from "../../errorHelpers/AppError";
import { ApprovalStatus } from "./user.interface";

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
  const result = await UserServices.getAllUsers(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Users retrieved successfully",
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
  const { approvalStatus, commissionRate } = req.body;
  const result = await UserServices.agentApprovalByAdmin(userId, {
    approvalStatus,
    commissionRate,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Agent approved successfully",
    data: result,
  });
});

// Define allowed incoming body for suspendAgent
interface SuspendAgentBody {
  status: "suspended" | "active";
}

const suspendAgent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as SuspendAgentBody;

  // Validate input
  if (!status || (status !== "suspended" && status !== "active")) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid status. Expected 'suspended' or 'active'."
    );
  }

  // Map incoming status to ApprovalStatus used by the service
  const mappedStatus =
    status === "suspended" ? ApprovalStatus.SUSPENDED : ApprovalStatus.APPROVED;

  const result = await UserServices.suspendAgent(id, mappedStatus);

  const messageMap: Record<string, string> = {
    suspended: "Agent has been successfully suspended.",
    active: "Agent has been successfully activated.",
  };

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: messageMap[status] || "Agent status updated successfully.",
    data: result,
  });
});

const updatePassword = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await UserServices.updatePassword(user.userId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password updated successfully",
    data: result,
  });
});

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.createAdmin(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Admin created successfully",
    data: result,
  });
});

export const UserControllers = {
  getMyProfile,
  updateMyProfile,
  createAdmin,
  getAllUsers,
  blockUser,
  unblockUser,
  agentApprovalByAdmin,
  suspendAgent,
  updatePassword,
};
