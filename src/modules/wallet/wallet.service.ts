import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { Wallet } from "./wallet.model";
import { IWallet, WalletStatus } from "./wallet.interface";

const getMyWallet = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
  }

  const wallet = await Wallet.findById(user.wallet);
  if (!wallet) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Wallet not found for this user."
    );
  }
  return wallet;
};

const getAllWallets = async (
  query: Record<string, unknown>
): Promise<IWallet[]> => {
  const filter: mongoose.FilterQuery<IWallet> = {};

  if (query.status) {
    const status = query.status as string;

    if (typeof query.status !== "string") {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid wallet status.");
    }

    if (!Object.values(WalletStatus).includes(status as WalletStatus)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid wallet status.");
    }
    filter.status = status;
  }

  const wallets = await Wallet.find(filter);
  return wallets;
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
