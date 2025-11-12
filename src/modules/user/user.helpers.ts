import mongoose from "mongoose";
import { IUser } from "./user.interface";
import { User } from "./user.model";
import { Wallet } from "../wallet/wallet.model";
import AppError from "../../errorHelpers/AppError";
import { StatusCodes } from "http-status-codes";

export const createUserAndWallet = async (
  userData: Partial<IUser>,
  session: mongoose.ClientSession
) => {
  // Create the new user
  const newUserArr = await User.create([userData], { session });
  const newUser = newUserArr[0];

  if (!newUser) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "User creation failed during registration."
    );
  }

  // Create a wallet for the new user
  const newWalletArr = await Wallet.create(
    [
      {
        owner: newUser._id,
        balance: userData.role === "USER" || userData.role === "AGENT" ? 50 : 0,
      },
    ],
    { session }
  );

  if (!newWalletArr.length) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Wallet creation failed during registration."
    );
  }

  // Link the wallet to the user
  newUser.wallet = newWalletArr[0]._id;
  await newUser.save({ session });

  return newUser;
};
