import httpStatus from "http-status-codes";
import mongoose from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { Wallet } from "../wallet/wallet.model";
import { Transaction } from "../transaction/transaction.model";
import { TransactionStatus, TransactionType } from "../transaction/transaction.interface";
import { Role } from "../user/user.interface";

const getSummary = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }
  if (user.role !== Role.AGENT) {
    throw new AppError(httpStatus.FORBIDDEN, "Only agents can access this endpoint");
  }

  const wallet = await Wallet.findById(user.wallet);
  const currentBalance = wallet?.balance ?? 0;

  const commissionResult = await Transaction.aggregate([
    {
      $match: {
        receiver: new mongoose.Types.ObjectId(userId),
        type: TransactionType.COMMISSION,
        status: TransactionStatus.SUCCESSFUL,
      },
    },
    { $group: { _id: null, totalCommission: { $sum: "$amount" } } },
  ]);
  const totalCommission = commissionResult[0]?.totalCommission ?? 0;

  const customerResult = await Transaction.aggregate([
    {
      $match: {
        $or: [
          { sender: new mongoose.Types.ObjectId(userId) },
          { receiver: new mongoose.Types.ObjectId(userId) },
        ],
        status: TransactionStatus.SUCCESSFUL,
      },
    },
    { $group: { _id: null, uniqueSenders: { $addToSet: "$sender" }, uniqueReceivers: { $addToSet: "$receiver" } } },
    {
      $project: {
        uniqueCustomers: {
          $size: {
            $setUnion: ["$uniqueSenders", "$uniqueReceivers"],
          },
        },
      },
    },
  ]);
  const activeCustomers = customerResult[0]?.uniqueCustomers ?? 0;

  const totalTxResult = await Transaction.aggregate([
    {
      $match: {
        $or: [
          { sender: new mongoose.Types.ObjectId(userId) },
          { receiver: new mongoose.Types.ObjectId(userId) },
        ],
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        successful: {
          $sum: { $cond: [{ $eq: ["$status", TransactionStatus.SUCCESSFUL] }, 1, 0] },
        },
      },
    },
  ]);
  const totalTx = totalTxResult[0]?.total ?? 1;
  const successfulTx = totalTxResult[0]?.successful ?? 0;
  const successRate = totalTx > 0 ? (successfulTx / totalTx) * 100 : 0;

  return {
    currentBalance,
    totalCommission,
    activeCustomers,
    successRate: Math.round(successRate * 10) / 10,
  };
};

export const AgentServices = { getSummary };
