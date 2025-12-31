import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { Wallet } from "../wallet/wallet.model";
import { ApprovalStatus, IsActive, IUser, Role } from "./user.interface";
import { User } from "./user.model";

// Service to get a user's own profile
const getMyProfile = async (userId: string) => {
  const result = await User.findById(userId);
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  return result;
};

const updateMyProfile = async (userId: string, payload: Partial<IUser>) => {
  const updateData: Partial<IUser> = {};
  if (payload.name) {
    updateData.name = payload.name;
  }
  if (payload.phone) {
    updateData.phone = payload.phone;
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "No valid fields to update.");
  }

  const result = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  return result;
};

const getAllUsers = async () => {
  const result = await User.find({});
  return result;
};

const blockUser = async (currentUserId: string, targetUserId: string) => {
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "User to block not found");
  }

  if (currentUserId === targetUserId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "You cannot block yourself.");
  }

  if (targetUser.role === Role.ADMIN) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Admins cannot block other admins.",
    );
  }

  const session = await mongoose.startSession();
  let updatedUser;

  try {
    session.startTransaction();

    targetUser.isActive = IsActive.BLOCKED;
    updatedUser = await targetUser.save({ session });

    if (targetUser.wallet) {
      await Wallet.findByIdAndUpdate(
        targetUser.wallet,
        { status: "BLOCKED" },
        { session },
      );
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    let errorMessage = "Failed to block user and wallet.";
    if (error instanceof Error) {
      errorMessage = `${errorMessage} Error: ${error.message}`;
    }
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, errorMessage);
  } finally {
    session.endSession();
  }

  return updatedUser;
};

const unblockUser = async (targetUserId: string) => {
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "User to unblock not found");
  }

  const session = await mongoose.startSession();
  let updatedUser;

  try {
    session.startTransaction();

    targetUser.isActive = IsActive.ACTIVE;
    updatedUser = await targetUser.save({ session });

    if (targetUser.wallet) {
      await Wallet.findByIdAndUpdate(
        targetUser.wallet,
        { status: "ACTIVE" },
        { session },
      );
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    let errorMessage = "Failed to unblock user and wallet.";
    if (error instanceof Error) {
      errorMessage = `${errorMessage} Error: ${error.message}`;
    }
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, errorMessage);
  } finally {
    session.endSession();
  }

  return updatedUser;
};

const agentApprovalByAdmin = async (
  userId: string,
  payload: { approvalStatus: ApprovalStatus; commissionRate?: number },
) => {
  const agent = await User.findById(userId);

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
  } else {
    agent.approvalStatus = ApprovalStatus.REJECTED;
    agent.commissionRate = null;
  }

  await agent.save();

  return agent;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updatePassword = async (userId: string, payload: any) => {
  const user = await User.findById(userId).select("+password");
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

  const user = await User.findOne({ email: { $eq: payload.email } });

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
      email: payload.email,
      password: payload.password,
      phone: payload.phone,
      role: payload.role,
    };

    const newUserArr = await User.create([adminData], { session });
    const newUser = newUserArr[0];

    if (!newUser) {
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "User creation failed during registration.",
      );
    }

    const newWalletArr = await Wallet.create(
      [
        {
          owner: newUser._id,
          balance: 50,
        },
      ],
      { session },
    );

    if (!newWalletArr.length) {
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Wallet creation failed during registration.",
      );
    }

    newUser.wallet = newWalletArr[0]._id;
    await newUser.save({ session });

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
  updatePassword,
  createAdmin,
};
