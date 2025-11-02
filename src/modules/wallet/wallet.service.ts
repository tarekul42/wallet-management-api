import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { Wallet } from "./wallet.model";
import { IWallet } from "./wallet.interface";

const getMyWallet = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
  }

  const wallet = await Wallet.findById(user.wallet);
  if (!wallet) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Wallet not found for this user.",
    );
  }
  return wallet;
};

const getAllWallets = async (): Promise<IWallet[]> => {
  const wallets = await Wallet.find();
  return wallets;
};

const getSingleWallet = async (walletId: string): Promise<IWallet | null> => {
  const wallet = await Wallet.findById(walletId);
  if (!wallet) {
    throw new AppError(StatusCodes.NOT_FOUND, "Wallet not found.");
  }
  return wallet;
};

const blockWallet = async (walletId: string): Promise<IWallet | null> => {
  const wallet = await Wallet.findById(walletId);
  if (!wallet) {
    throw new AppError(StatusCodes.NOT_FOUND, "Wallet not found.");
  }

  wallet.status = "BLOCKED";
  await wallet.save();
  return wallet;
};

const unblockWallet = async (walletId: string) => {
  const wallet = await Wallet.findById(walletId);
  if (!wallet) {
    throw new AppError(StatusCodes.NOT_FOUND, "Wallet not found.");
  }
  wallet.status = "ACTIVE";
  await wallet.save();
  return wallet;
};

export const WalletServices = {
  getMyWallet,
  getAllWallets,
  getSingleWallet,
  blockWallet,
  unblockWallet,
};
