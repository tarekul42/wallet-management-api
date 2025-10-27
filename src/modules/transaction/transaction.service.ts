import httpStatus from "http-status-codes";
import mongoose from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { Wallet } from "../wallet/wallet.model";
import { Transaction } from "./transaction.model";
import { TransactionStatus, TransactionType } from "./transaction.interface";

const addMoneyTopUp = async (userId: string, amount: number) => {
  if (amount <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "Amount must be positive.");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found.");
    }

    const wallet = await Wallet.findById(user.wallet).session(session);
    if (!wallet) {
      throw new AppError(httpStatus.NOT_FOUND, "Wallet not found.");
    }

    if (wallet.status !== "ACTIVE") {
      throw new AppError(httpStatus.BAD_REQUEST, "Wallet is not active.");
    }

    wallet.balance += amount;
    await wallet.save({ session });

    const transaction = await Transaction.create(
      [
        {
          owner: userId,
          type: TransactionType.TOP_UP,
          amount,
          status: TransactionStatus.COMPLETED,
          timestamp: new Date(),
        },
      ],
      { session },
    );

    if (!transaction.length) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Transaction creation failed",
      );
    }

    await session.commitTransaction();
    session.endSession();

    return {
      message: "Top-up successful.",
      transactionId: transaction[0]._id,
      newBalance: wallet.balance,
    };
  } catch (error: unknown) {
    await session.abortTransaction();
    session.endSession();
    // FIX: Check if error is an instance of Error to get its stack trace
    const errorStack = error instanceof Error ? error.stack : undefined;
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Top-up failed.",
      errorStack,
    );
  }
};

const sendMoney = async (
  senderId: string,
  receiverPhone: string,
  amount: number,
) => {
  if (amount <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "Amount must be positive.");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sender = await User.findById(senderId).session(session);
    if (!sender) {
      throw new AppError(httpStatus.NOT_FOUND, "Sender not found.");
    }

    const receiver = await User.findOne({ phone: receiverPhone }).session(
      session,
    );
    if (!receiver) {
      throw new AppError(httpStatus.NOT_FOUND, "Receiver not found.");
    }

    if (sender.id === receiver.id) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cannot send money to yourself.",
      );
    }

    const senderWallet = await Wallet.findById(sender.wallet).session(session);
    if (!senderWallet || senderWallet.balance < amount) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Insufficient funds or sender wallet not found.",
      );
    }

    const receiverWallet = await Wallet.findById(receiver.wallet).session(
      session,
    );
    if (!receiverWallet) {
      throw new AppError(httpStatus.NOT_FOUND, "Receiver wallet not found.");
    }

    senderWallet.balance -= amount;
    receiverWallet.balance += amount;

    await senderWallet.save({ session });
    await receiverWallet.save({ session });

    // Create transaction records
    const transaction = await Transaction.create(
      [
        {
          owner: senderId,
          type: TransactionType.SEND_MONEY,
          amount,
          status: TransactionStatus.COMPLETED,
          receiver: receiver.id,
          timestamp: new Date(),
        },
        {
          owner: receiver.id,
          type: TransactionType.RECEIVE_MONEY,
          amount,
          status: TransactionStatus.COMPLETED,
          sender: senderId,
          timestamp: new Date(),
        },
      ],
      { session },
    );

    if (transaction.length !== 2) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Transaction creation failed",
      );
    }

    await session.commitTransaction();
    session.endSession();

    return {
      message: "Money sent successfully.",
      transactionId: transaction[0]._id,
      newBalance: senderWallet.balance,
    };
  } catch (error: unknown) {
    await session.abortTransaction();
    session.endSession();
    // FIX: Check if error is an instance of Error to get its stack trace
    const errorStack = error instanceof Error ? error.stack : undefined;
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Send money failed.",
      errorStack,
    );
  }
};

const withdrawMoney = async (userId: string, amount: number) => {
  if (amount <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "Amount must be positive.");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found.");
    }

    const wallet = await Wallet.findById(user.wallet).session(session);
    if (!wallet || wallet.balance < amount) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Insufficient funds or wallet not found.",
      );
    }

    if (wallet.status !== "ACTIVE") {
      throw new AppError(httpStatus.BAD_REQUEST, "Wallet is not active.");
    }

    wallet.balance -= amount;
    await wallet.save({ session });

    const transaction = await Transaction.create(
      [
        {
          owner: userId,
          type: TransactionType.WITHDRAW,
          amount,
          status: TransactionStatus.COMPLETED,
          timestamp: new Date(),
        },
      ],
      { session },
    );

    if (!transaction.length) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Transaction creation failed",
      );
    }

    await session.commitTransaction();
    session.endSession();

    return {
      message: "Withdrawal successful.",
      transactionId: transaction[0]._id,
      // FIX: Removed duplicate key and referenced the correct variable
      newBalance: wallet.balance,
    };
  } catch (error: unknown) {
    await session.abortTransaction();
    session.endSession();
    // FIX: Check if error is an instance of Error to get its stack trace
    const errorStack = error instanceof Error ? error.stack : undefined;
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Withdrawal failed.",
      errorStack,
    );
  }
};

const getTransactionHistory = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  const history = await Transaction.find({ owner: userId })
    .populate({ path: "sender", select: "name phone" })
    .populate({ path: "receiver", select: "name phone" })
    .sort({ timestamp: -1 });

  return history;
};

export const TransactionServices = {
  addMoneyTopUp,
  sendMoney,
  withdrawMoney,
  getTransactionHistory,
};
