import AppError from "../../errorHelpers/AppError";
import { IUser } from "./user.interface";
import { User } from "./user.model";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcryptjs";
import { envVars } from "../../config/env";
import { Wallet } from "../wallet/wallet.model";

const createUser = async (payload: Partial<IUser>) => {
  const isExists = await User.findOne({ email: payload.email });

  if (isExists) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "User already exists, please try to login",
    );
  }

  const hashedPassword = await bcrypt.hash(
    payload.password as string,
    Number(envVars.BCRYPT_SALT_ROUND),
  );

  const wallet = await Wallet.create({ balance: 50 });

  const userPayload: Partial<IUser> = {
    ...payload,
    password: hashedPassword,
    wallet: wallet._id,
  };

  const result = await User.create(userPayload);
  const user = await User.findById(result._id).select("-password");
  return user;
};

const getMe = async (userId: string) => {
  const result = await User.findById(userId);
  return result;
};

const updateUser = async (userId: string, payload: Partial<IUser>) => {
  const result = await User.findByIdAndUpdate(userId, payload);
  return result;
};

const deleteUser = async (userId: string) => {
  const result = await User.findByIdAndDelete(userId);
  return result;
};

export const UserService = {
  createUser,
  getMe,
  updateUser,
  deleteUser,
};
