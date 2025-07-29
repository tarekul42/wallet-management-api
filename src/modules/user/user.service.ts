
import { User } from "./user.model";

export const getMyProfile = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  return user;
};

export const updateMyProfile = async (
  userId: string,
  updateData: Partial<Omit<typeof User, "password">>
) => {
  // Prevent password update here for security
  if ("password" in updateData) delete updateData.password;
  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
  }).select("-password");
  return user;
};

export const getAllUsers = async () => {
  return User.find().select("-password");
};

export const blockUser = async (userId: string) => {
  return User.findByIdAndUpdate(
    userId,
    { isActive: "BLOCKED" },
    { new: true }
  ).select("-password");
};

export const unblockUser = async (userId: string) => {
  return User.findByIdAndUpdate(
    userId,
    { isActive: "ACTIVE" },
    { new: true }
  ).select("-password");
};
