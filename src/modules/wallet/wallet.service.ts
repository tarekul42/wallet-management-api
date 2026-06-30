import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import AppError from "../../errorHelpers/AppError.js";
import { User } from "../user/user.model.js";
import { Wallet } from "./wallet.model.js";
import { IWallet, WalletStatus } from "./wallet.interface.js";
import { notifyWalletBlocked, notifyWalletUnblocked } from "../../utils/notification.utils.js";

const getMyWallet = async (userId: string) => {
  const user = await User.findById(userId).populate<{ wallet: IWallet }>("wallet");
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
  }

  if (!user.wallet) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Wallet not found for this user."
    );
  }
  return user.wallet;
};

const getAllWallets = async (
  query: Record<string, unknown>
): Promise<{ data: IWallet[]; meta: { page: number; limit: number; total: number; totalPage: number } }> => {
  const filter: mongoose.FilterQuery<IWallet> = {};

  const { status, page: pageParam, limit: limitParam } = query as { status?: string; page?: number; limit?: number };

  if (status) {
    if (!Object.values(WalletStatus).includes(status as WalletStatus)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid wallet status.");
    }
    filter.status = status as WalletStatus;
  }

  const page = Math.max(1, Number(pageParam) || 1);
  const limit = Math.min(100, Math.max(1, Number(limitParam) || 20));
  const skip = (page - 1) * limit;

  const [wallets, total] = await Promise.all([
    Wallet.find(filter).skip(skip).limit(limit),
    Wallet.countDocuments(filter),
  ]);

  return { data: wallets, meta: { page, limit, total, totalPage: Math.ceil(total / limit) } };
};

const getSingleWallet = async (walletId: string): Promise<IWallet> => {
  const wallet = await Wallet.findById(walletId);
  if (!wallet) {
    throw new AppError(StatusCodes.NOT_FOUND, "Wallet not found.");
  }
  return wallet;
};

const updateWalletStatus = async (walletId: string, status: WalletStatus) => {
  const wallet = await Wallet.findById(walletId);
  if (!wallet) {
    throw new AppError(StatusCodes.NOT_FOUND, "Wallet not found.");
  }
  wallet.status = status;
  await wallet.save();

  // Send notification
  const user = await User.findById(wallet.owner);
  if (user) {
    if (status === WalletStatus.BLOCKED) {
      notifyWalletBlocked({
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
      });
    } else if (status === WalletStatus.ACTIVE) {
      notifyWalletUnblocked({
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
      });
    }
  }

  return wallet;
};

const blockWallet = async (walletId: string): Promise<IWallet> => {
  return updateWalletStatus(walletId, WalletStatus.BLOCKED);
};

const unblockWallet = async (walletId: string): Promise<IWallet> => {
  return updateWalletStatus(walletId, WalletStatus.ACTIVE);
};

export const WalletServices = {
  getMyWallet,
  getAllWallets,
  getSingleWallet,
  blockWallet,
  unblockWallet,
};
