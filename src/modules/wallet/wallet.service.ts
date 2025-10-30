import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { Wallet } from "./wallet.model";

const getMyWallet = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
  }

  // Find the wallet using the reference on the user document
  const wallet = await Wallet.findById(user.wallet);
  if (!wallet) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Wallet not found for this user.",
    );
  }
  return wallet;
};

export const WalletServices = {
  getMyWallet,
};
