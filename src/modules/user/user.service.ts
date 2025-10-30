import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { IsActive, IUser, Role } from "./user.interface";
import { User } from "./user.model";

// Service to get a user's own profile
const getMyProfile = async (userId: string) => {
  const result = await User.findById(userId);
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  return result;
};

// Service to update a user's own profile
const updateMyProfile = async (userId: string, payload: Partial<IUser>) => {
  // Users should not be able to change their role, status, etc.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { role, isActive, isVerified, isDeleted, ...updateData } = payload;
  const result = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  return result;
};

// Service for an admin to get all users
const getAllUsers = async () => {
  const result = await User.find({});
  return result;
};

// Service for an admin to block a user
const blockUser = async (currentUserId: string, targetUserId: string) => {
  // Check if target user exists
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "User to block not found");
  }

  // Prevent an admin from blocking themselves
  if (currentUserId === targetUserId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "You cannot block yourself.");
  }

  // Prevent an admin from blocking another admin
  if (targetUser.role === Role.ADMIN) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Admins cannot block other admins.",
    );
  }

  targetUser.isActive = IsActive.BLOCKED;
  await targetUser.save();
  return targetUser;
};

// Service for an admin to unblock a user
const unblockUser = async (targetUserId: string) => {
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "User to unblock not found");
  }

  targetUser.isActive = IsActive.ACTIVE;
  await targetUser.save();
  return targetUser;
};

export const UserServices = {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  blockUser,
  unblockUser,
};
