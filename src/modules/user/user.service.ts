import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { User } from "./user.model";
import { ApprovalStatus, IsActive, IUser, Role } from "./user.interface";
import mongoose from "mongoose";
import { Wallet } from "../wallet/wallet.model";
import { WalletStatus } from "../wallet/wallet.interface";
import { createUserAndWallet } from "./user.helpers";
import bcrypt from "bcryptjs";
import { notifyAgentApproved, notifyAgentSuspended } from "../../utils/notification.utils";

// Service to get a user's own profile
const getMyProfile = async (userId: string) => {
  const result = await User.findOne({ _id: { $eq: String(userId) } });
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  return result;
};

const updateMyProfile = async (userId: string, payload: Partial<IUser>) => {
  const updateData: Partial<IUser> = {};
  if (payload.name && typeof payload.name === "string") {
    updateData.name = payload.name.trim();
  }
  if (payload.phone && typeof payload.phone === "string") {
    updateData.phone = payload.phone.trim();
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "No valid fields to update.");
  }

  const result = await User.findOneAndUpdate(
    { _id: { $eq: String(userId) } },
    { $set: updateData },
    {
      new: true,
      runValidators: true,
    });
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  return result;
};

const getAllUsers = async (query: Record<string, unknown>) => {
  const filter: mongoose.FilterQuery<IUser> = {};

  if (query.role) {
    if (typeof query.role !== "string") {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid role filter.");
    }
    if (!Object.values(Role).includes(query.role as Role)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid role value");
    }
    filter.role = { $eq: String(query.role) as Role };
  }

  if (query.approvalStatus) {
    if (typeof query.approvalStatus !== "string") {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Invalid approvalStatus filter.",
      );
    }
    if (
      !Object.values(ApprovalStatus).includes(
        query.approvalStatus as ApprovalStatus,
      )
    ) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Invalid approvalStatus value",
      );
    }
    filter.approvalStatus = { $eq: String(query.approvalStatus) as ApprovalStatus };
  }

  const result = await User.find(filter);
  return result;
};

const updateUserStatus = async (
  targetUserId: string,
  newStatus: IsActive.ACTIVE | IsActive.BLOCKED,
  currentUserId?: string,
) => {
  const targetUser = await User.findOne({ _id: { $eq: String(targetUserId) } });
  if (!targetUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "Target user not found");
  }

  // Only enforce these checks when attempting to BLOCK a user
  if (newStatus === IsActive.BLOCKED) {
    if (!currentUserId) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Current user ID is required for blocking operations.",
      );
    }
    if (currentUserId === targetUserId) {
      throw new AppError(StatusCodes.BAD_REQUEST, "You cannot block yourself.");
    }
    if (targetUser.role === Role.ADMIN || targetUser.role === Role.SUPER_ADMIN) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Admins cannot block other admins.",
      );
    }
  }

  const session = await mongoose.startSession();
  let updatedUser;

  try {
    session.startTransaction();

    targetUser.isActive = newStatus;
    updatedUser = await targetUser.save({ session });

    if (targetUser.wallet) {
      const walletStatus =
        newStatus === IsActive.BLOCKED
          ? WalletStatus.BLOCKED
          : WalletStatus.ACTIVE;

      await Wallet.findOneAndUpdate(
        { _id: { $eq: String(targetUser.wallet) } },
        { $set: { status: walletStatus } },
        { session },
      );
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    let errorMessage = `Failed to ${newStatus.toLowerCase()} user and wallet.`;
    if (error instanceof Error) {
      errorMessage = `${errorMessage} Error: ${error.message}`;
    }
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, errorMessage);
  } finally {
    session.endSession();
  }

  return updatedUser;
};

const blockUser = async (currentUserId: string, targetUserId: string) => {
  return updateUserStatus(targetUserId, IsActive.BLOCKED, currentUserId);
};

const unblockUser = async (targetUserId: string) => {
  return updateUserStatus(targetUserId, IsActive.ACTIVE);
};

const agentApprovalByAdmin = async (
  userId: string,
  payload: { approvalStatus: ApprovalStatus; commissionRate?: number },
) => {
  const agent = await User.findOne({ _id: { $eq: String(userId) } });

  if (!agent) {
    throw new AppError(StatusCodes.NOT_FOUND, "Agent not found");
  }

  if (agent.role !== Role.AGENT) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "This user is not an agent. You can only approve agents.",
    );
  }

  if (agent.approvalStatus !== ApprovalStatus.PENDING) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `This agent has already been reviewed and is currently in '${agent.approvalStatus}' status.`,
    );
  }

  if (payload.approvalStatus === ApprovalStatus.PENDING) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Cannot set agent status back to PENDING.",
    );
  }

  if (payload.approvalStatus === ApprovalStatus.APPROVED) {
    agent.approvalStatus = ApprovalStatus.APPROVED;
    agent.commissionRate = payload.commissionRate || 0.02;

    // Notify agent
    notifyAgentApproved({
      userId: agent._id.toString(),
      email: agent.email,
      name: agent.name,
      commissionRate: agent.commissionRate
    });

  } else {
    agent.approvalStatus = ApprovalStatus.REJECTED;
    agent.commissionRate = null;
  }

  await agent.save();

  return agent;
};

const suspendAgent = async (
  agentId: string,
  newStatus: ApprovalStatus.SUSPENDED | ApprovalStatus.APPROVED,
) => {
  const agent = await User.findOne({ _id: { $eq: String(agentId) } });

  if (!agent) {
    throw new AppError(StatusCodes.NOT_FOUND, "Agent not found");
  }

  if (agent.role !== Role.AGENT) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "This user is not an agent. You can only suspend agents.",
    );
  }

  if (newStatus === ApprovalStatus.SUSPENDED) {
    if (agent.approvalStatus !== ApprovalStatus.APPROVED) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "You can only suspend an agent who is currently approved.",
      );
    }
    agent.approvalStatus = ApprovalStatus.SUSPENDED;

    // Notify agent
    notifyAgentSuspended({
      userId: agent._id.toString(),
      email: agent.email,
      name: agent.name
    });

  } else if (newStatus === ApprovalStatus.APPROVED) {
    if (agent.approvalStatus !== ApprovalStatus.SUSPENDED) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "You can only re-approve an agent who is currently suspended.",
      );
    }
    agent.approvalStatus = ApprovalStatus.APPROVED;

    // Notify agent
    notifyAgentApproved({
      userId: agent._id.toString(),
      email: agent.email,
      name: agent.name,
      commissionRate: agent.commissionRate || 0,
    });
  }

  await agent.save();

  return agent;
};

interface IUpdatePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

const updatePassword = async (
  userId: string,
  payload: IUpdatePasswordPayload,
) => {
  const user = await User.findOne({ _id: { $eq: String(userId) } }).select("+password");
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  const isPasswordValid = await bcrypt.compare(
    payload.oldPassword,
    user.password,
  );
  if (!isPasswordValid) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid old password");
  }

  user.password = payload.newPassword;
  await user.save();

  return user;
};

const createAdmin = async (payload: IUser) => {
  if (typeof payload.email !== "string") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Invalid email format.",
    );
  }

  const normalizedEmail = payload.email.trim().toLowerCase();

  const user = await User.findOne({ email: { $eq: normalizedEmail } });

  if (user) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "User already exists with this email.",
    );
  }

  if (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Registration is only available for admins and super admins.",
    );
  }

  const session = await mongoose.startSession();
  let result;

  try {
    session.startTransaction();

    const adminData: Partial<IUser> = {
      name: payload.name,
      email: normalizedEmail,
      password: payload.password,
      phone: payload.phone,
      role: payload.role,
    };

    const newUser = await createUserAndWallet(adminData, session);

    await session.commitTransaction();

    result = newUser;
  } catch (error) {
    await session.abortTransaction();
    const errMsg = error instanceof Error ? error.message : String(error);
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to register user. Please try again later. ${errMsg}`,
    );
  } finally {
    session.endSession();
  }

  return result;
};

export const UserServices = {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  blockUser,
  unblockUser,
  agentApprovalByAdmin,
  suspendAgent,
  updatePassword,
  createAdmin,
};
