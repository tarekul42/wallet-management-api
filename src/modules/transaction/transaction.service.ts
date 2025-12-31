import mongoose, { ClientSession } from "mongoose";
import { StatusCodes } from "http-status-codes";
import { v4 as uuidv4 } from "uuid";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { Wallet } from "../wallet/wallet.model";
import { IWallet, WalletStatus } from "../wallet/wallet.interface";
import { Transaction } from "./transaction.model";
import {
  ITransaction,
  TransactionStatus,
  TransactionType,
} from "./transaction.interface";
import { Role } from "../user/user.interface";
import { SystemConfigServices } from "../systemConfig/systemConfig.service";

const MAX_PAGINATION_LIMIT = 100;

/**
 * Checks if a user has exceeded their daily or monthly transaction limits.
 * Throws an AppError if any limit is exceeded.
 */
const checkAndUpdateTransactionLimits = async (
  userId: string,
  amount: number,
  session?: ClientSession,
) => {
  const config = await SystemConfigServices.getSystemConfig();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const filterBase = {
    sender: { $eq: String(userId) },
    status: { $eq: TransactionStatus.SUCCESSFUL },
    type: { $in: [TransactionType.SEND_MONEY, TransactionType.CASH_OUT, TransactionType.WITHDRAW] },
  };

  // Calculate daily total
  const dailyTransactions = await Transaction.find({
    ...filterBase,
    createdAt: { $gte: startOfDay },
  }).session(session || null);

  const dailyTotal = dailyTransactions.reduce((sum, t) => sum + t.amount, 0);

  if (dailyTotal + amount > config.dailyTransactionLimit) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Daily transaction limit exceeded. Remaining: ${config.dailyTransactionLimit - dailyTotal}`,
    );
  }

  // Calculate monthly total
  const monthlyTransactions = await Transaction.find({
    ...filterBase,
    createdAt: { $gte: startOfMonth },
  }).session(session || null);

  const monthlyTotal = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);

  if (monthlyTotal + amount > config.monthlyTransactionLimit) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Monthly transaction limit exceeded. Remaining: ${config.monthlyTransactionLimit - monthlyTotal}`,
    );
  }
};

// Private helper to handle agent commission
const _handleAgentCommission = async (
  session: ClientSession,
  agent: {
    role: Role;
    _id: mongoose.Types.ObjectId;
    commissionRate?: number | null;
    wallet?: IWallet;
  },
  transactionAmount: number,
  transactionType: "cash-in" | "cash-out",
) => {
  if (
    agent.role === Role.AGENT &&
    agent.commissionRate != null &&
    agent.wallet
  ) {
    // Explicitly parse to number to avoid unexpected behavior
    const commissionRateNum = parseFloat(String(agent.commissionRate));

    if (isNaN(commissionRateNum) || commissionRateNum < 0) return;

    // Use the stored rate directly (e.g., 0.02 for 2%)
    const commission = transactionAmount * commissionRateNum;
    if (commission <= 0) return;

    // Add commission to agent's wallet
    await Wallet.findOneAndUpdate(
      { _id: { $eq: String(agent.wallet._id) } },
      { $inc: { balance: commission } },
      { session },
    );

    // Create commission transaction record
    await Transaction.create(
      [
        {
          walletId: agent.wallet._id,
          amount: commission,
          type: TransactionType.COMMISSION,
          status: TransactionStatus.SUCCESSFUL,
          referenceId: uuidv4(),
          description: `Commission for ${transactionType} of ${transactionAmount}`,
          receiver: agent._id,
        },
      ],
      { session },
    );
  }
};

const sendMoney = async (
  senderId: string,
  receiverEmail: string,
  amount: number,
  description?: string,
) => {
  if (amount <= 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Amount must be positive.");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const sender = await User.findById(senderId)
      .populate<{ wallet: IWallet }>("wallet")
      .session(session);

    // Ensure receiverEmail is a string to prevent NoSQL injection
    const receiver = await User.findOne({ email: { $eq: String(receiverEmail) } })
      .populate<{ wallet: IWallet }>("wallet")
      .session(session);

    if (!sender) {
      throw new AppError(StatusCodes.NOT_FOUND, "Sender not found");
    }
    if (!receiver) {
      throw new AppError(StatusCodes.NOT_FOUND, "Receiver not found");
    }
    if (sender.email === receiver.email) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "You cannot send money to yourself",
      );
    }
    if (!sender.wallet || !receiver.wallet) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        "Sender or receiver wallet not found",
      );
    }
    if (sender.wallet.status !== WalletStatus.ACTIVE) {
      throw new AppError(StatusCodes.FORBIDDEN, "Your wallet is not active");
    }
    if (receiver.wallet.status !== WalletStatus.ACTIVE) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Receiver's wallet is not active",
      );
    }

    // Check transaction limits
    await checkAndUpdateTransactionLimits(senderId, amount, session);

    // Get dynamic fee from SystemConfig
    const config = await SystemConfigServices.getSystemConfig();
    const fee = amount > 100 ? config.sendMoneyFee : 0;
    const totalDeduction = amount + fee;

    // Atomically check balance and decrement
    const senderWalletUpdate = await Wallet.findOneAndUpdate(
      {
        _id: { $eq: String(sender.wallet._id) },
        balance: { $gte: totalDeduction },
      },
      { $inc: { balance: -totalDeduction } },
      { session },
    );

    if (!senderWalletUpdate) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Insufficient funds.");
    }

    // Increment receiver's balance
    await Wallet.findByIdAndUpdate(
      { $eq: String(receiver.wallet._id) },
      { $inc: { balance: amount } },
      { session },
    );

    // Add fee to system wallet
    if (fee > 0) {
      await Wallet.findByIdAndUpdate(
        { $eq: String(config.systemWalletId) },
        { $inc: { balance: fee } },
        { session },
      );
    }

    // Create transaction record
    await Transaction.create(
      [
        {
          walletId: sender.wallet._id,
          sender: sender._id,
          receiver: receiver._id,
          amount,
          fee,
          type: TransactionType.SEND_MONEY,
          status: TransactionStatus.SUCCESSFUL,
          referenceId: uuidv4(),
          description,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return { message: "Money sent successfully" };
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Transaction failed. Please try again later.",
    );
  } finally {
    session.endSession();
  }
};

const addMoney = async (
  actorId: string,
  amount: number,
  receiverId?: string,
) => {
  if (amount <= 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Amount must be positive.");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const actor = await User.findById(actorId)
      .populate<{ wallet: IWallet }>("wallet")
      .session(session);
    if (!actor) {
      throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    let receiverWallet: IWallet | null | undefined;
    let receiverUser;

    if (actor.role === Role.USER) {
      receiverUser = actor;
      receiverWallet = actor.wallet;
    } else if (actor.role === Role.AGENT) {
      if (!receiverId) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Receiver ID is required for agents",
        );
      }
      receiverUser = await User.findOne({ _id: { $eq: String(receiverId) } }).session(session);
      if (!receiverUser) {
        throw new AppError(StatusCodes.NOT_FOUND, "Receiver not found");
      }
      receiverWallet = await Wallet.findOne({ owner: { $eq: String(receiverId) } }).session(
        session,
      );
    } else {
      throw new AppError(StatusCodes.FORBIDDEN, "Admins cannot add money");
    }

    if (!receiverWallet) {
      throw new AppError(StatusCodes.NOT_FOUND, "Receiver wallet not found");
    }

    if (receiverWallet.status !== WalletStatus.ACTIVE) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Receiver's wallet is not active",
      );
    }

    const config = await SystemConfigServices.getSystemConfig();
    const fee = amount * (config.cashInFee / 100);
    const totalDeduction = actor.role === Role.AGENT ? amount : 0; // Agents pay the amount they cash-in

    if (actor.role === Role.AGENT) {
      const agentWalletUpdate = await Wallet.findOneAndUpdate(
        {
          _id: { $eq: String(actor.wallet?._id) },
          balance: { $gte: totalDeduction + fee },
        },
        { $inc: { balance: -(totalDeduction + fee) } },
        { session },
      );

      if (!agentWalletUpdate) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Insufficient funds in agent wallet.");
      }
    }

    await Wallet.findByIdAndUpdate(
      { $eq: String(receiverWallet._id) },
      { $inc: { balance: amount } },
      { session },
    );

    await Transaction.create(
      [
        {
          walletId: receiverWallet._id,
          sender: actor.role === Role.AGENT ? actor._id : undefined,
          receiver: receiverUser?._id,
          amount,
          fee,
          type: TransactionType.CASH_IN,
          status: TransactionStatus.SUCCESSFUL,
          referenceId: uuidv4(),
          description: "Cash in",
        },
      ],
      { session },
    );

    if (actor.role === Role.AGENT) {
      await _handleAgentCommission(session, actor as any, amount, "cash-in");
    }

    await session.commitTransaction();

    const updatedWallet = await Wallet.findById(receiverWallet._id).session(
      session,
    );

    return {
      message: "Money added successfully",
      wallet: updatedWallet,
    };
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Transaction failed. Please try again later.",
    );
  } finally {
    session.endSession();
  }
};

const withdrawMoney = async (
  actorId: string,
  amount: number,
  fromId?: string,
) => {
  if (amount <= 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Amount must be positive.");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const actor = await User.findById(actorId)
      .populate<{ wallet: IWallet }>("wallet")
      .session(session);
    if (!actor) {
      throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    let fromWallet: IWallet | null | undefined;
    let fromUser;
    let transactionType: TransactionType;

    if (actor.role === Role.USER) {
      fromUser = actor;
      fromWallet = actor.wallet;
      transactionType = TransactionType.WITHDRAW;
      await checkAndUpdateTransactionLimits(actorId, amount, session);
    } else if (actor.role === Role.AGENT) {
      if (!fromId) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "'fromId' is required for agents",
        );
      }
      // Validate and safely cast fromId before using it in any database query
      if (typeof fromId !== "string" || !mongoose.Types.ObjectId.isValid(fromId)) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Invalid 'fromId' format",
        );
      }
      fromUser = await User.findOne({ _id: { $eq: String(fromId) } }).session(session);
      if (!fromUser) {
        throw new AppError(
          StatusCodes.NOT_FOUND,
          "User to withdraw from not found",
        );
      }
      fromWallet = await Wallet.findOne({ owner: { $eq: String(fromId) } }).session(session);
      transactionType = TransactionType.CASH_OUT;
      await checkAndUpdateTransactionLimits(String(fromUser._id), amount, session);
    } else {
      throw new AppError(StatusCodes.FORBIDDEN, "Admins cannot withdraw money");
    }

    if (!fromWallet) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        "Wallet to withdraw from not found",
      );
    }

    if (fromWallet.status !== WalletStatus.ACTIVE) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Wallet to withdraw from is not active",
      );
    }

    const config = await SystemConfigServices.getSystemConfig();
    const feeRate = transactionType === TransactionType.WITHDRAW ? config.withdrawFee : config.cashOutFee;
    const fee = amount * (feeRate / 100);
    const totalDeduction = amount + fee;

    // Atomically check balance and decrement
    const fromWalletUpdate = await Wallet.findOneAndUpdate(
      {
        _id: { $eq: String(fromWallet._id) },
        balance: { $gte: totalDeduction },
      },
      { $inc: { balance: -totalDeduction } },
      { session },
    );

    if (!fromWalletUpdate) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Insufficient funds.");
    }

    // If it's a cash-out, add amount to agent wallet
    if (transactionType === TransactionType.CASH_OUT) {
      await Wallet.findByIdAndUpdate(
        { $eq: String(actor.wallet?._id) },
        { $inc: { balance: amount } },
        { session },
      );
    }

    // Add fee to system wallet
    if (fee > 0) {
      await Wallet.findByIdAndUpdate(
        { $eq: String(config.systemWalletId) },
        { $inc: { balance: fee } },
        { session },
      );
    }

    await Transaction.create(
      [
        {
          walletId: fromWallet._id,
          sender: actor._id,
          receiver: fromUser._id,
          amount,
          fee,
          type: transactionType,
          status: TransactionStatus.SUCCESSFUL,
          referenceId: uuidv4(),
          description: `Withdrawal by ${actor.role}`,
        },
      ],
      { session },
    );

    if (actor.role === Role.AGENT) {
      await _handleAgentCommission(session, actor as any, amount, "cash-out");
    }

    await session.commitTransaction();

    return { message: "Money withdrawn successfully" };
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Transaction failed. Please try again later.",
    );
  } finally {
    session.endSession();
  }
};

const viewHistory = async (actorId: string, query: Record<string, unknown>) => {
  const actor = await User.findById(actorId);
  if (!actor) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(
    MAX_PAGINATION_LIMIT,
    Math.max(1, Number(query.limit) || 10),
  );
  const skip = (page - 1) * limit;

  const filter: mongoose.FilterQuery<ITransaction> = {};

  if (actor.role === Role.ADMIN || actor.role === Role.SUPER_ADMIN) {
    if (typeof query.userId === "string") {
      filter.$or = [
        { sender: { $eq: String(query.userId) } },
        { receiver: { $eq: String(query.userId) } }
      ];
    }
  } else {
    filter.$or = [
      { sender: { $eq: String(actor._id) } },
      { receiver: { $eq: String(actor._id) } }
    ];
  }

  if (typeof query.type === "string") {
    filter.type = { $eq: query.type };
  }

  if (
    typeof query.startDate === "string" &&
    typeof query.endDate === "string"
  ) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      filter.createdAt = { $gte: startDate, $lte: endDate };
    }
  }

  const transactions = await Transaction.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Transaction.countDocuments(filter);

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data: transactions,
  };
};

const getCommissionHistory = async (
  actorId: string,
  query: Record<string, unknown>,
) => {
  const actor = await User.findById(actorId);
  if (!actor) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (actor.role !== Role.AGENT) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Only agents can view commission history",
    );
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(
    MAX_PAGINATION_LIMIT,
    Math.max(1, Number(query.limit) || 10),
  );
  const skip = (page - 1) * limit;

  const filter: mongoose.FilterQuery<ITransaction> = {
    receiver: { $eq: String(actor._id) },
    type: { $eq: TransactionType.COMMISSION },
  };

  const transactions = await Transaction.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Transaction.countDocuments(filter);

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data: transactions,
  };
};

export const TransactionServices = {
  sendMoney,
  addMoney,
  withdrawMoney,
  viewHistory,
  getCommissionHistory,
};
