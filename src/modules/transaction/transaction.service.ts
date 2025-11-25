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
import { checkAndUpdateTransactionLimits } from "./transaction.helpers";
import { SystemConfigServices } from "../systemConfig/systemConfig.service";

const MAX_PAGINATION_LIMIT = 100;

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
    const commissionRateNum = parseFloat(String(agent.commissionRate));

    if (isNaN(commissionRateNum) || commissionRateNum < 0) return;

    const commission = transactionAmount * (commissionRateNum / 100);
    if (commission <= 0) return; // Don't process zero or negative commission

    // Add commission to agent's wallet
    await Wallet.findByIdAndUpdate(
      agent.wallet._id,
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
    const receiver = await User.findOne({ email: receiverEmail })
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

    // Check transaction limits (throws if exceeded)
    await checkAndUpdateTransactionLimits(senderId, amount);

    // Get system config for fee
    const systemConfig = await SystemConfigServices.getSystemConfig();
    const fee = systemConfig.sendMoneyFee || 0;
    const totalAmount = amount + fee;

    // Decrement sender's balance
    const senderWalletUpdate = await Wallet.findOneAndUpdate(
      { _id: sender.wallet._id, balance: { $gte: totalAmount } },
      { $inc: { balance: -totalAmount } },
      { session },
    );

    if (!senderWalletUpdate) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Insufficient funds");
    }

    // Increment receiver's balance
    await Wallet.findByIdAndUpdate(
      receiver.wallet._id,
      { $inc: { balance: amount } },
      { session },
    );

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
      // For self-top-up, the actor is the receiver, use the populated wallet
      receiverUser = actor;
      receiverWallet = actor.wallet;
    } else if (actor.role === Role.AGENT) {
      if (!receiverId) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Receiver ID is required for agents",
        );
      }
      receiverUser = await User.findById(receiverId).session(session);
      if (!receiverUser) {
        throw new AppError(StatusCodes.NOT_FOUND, "Receiver not found");
      }
      receiverWallet = await Wallet.findOne({ owner: receiverId }).session(
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

    // Check transaction limits for users (not agents)
    if (actor.role === Role.USER) {
      await checkAndUpdateTransactionLimits(actor._id.toString(), amount);
    }

    // Get system config for fee (Cash In is usually free, but we support it)
    const systemConfig = await SystemConfigServices.getSystemConfig();
    const feePercentage = (systemConfig.cashInFee || 0) / 100;
    const fee = amount * feePercentage;
    // Note: For Cash In, usually the receiver gets the full amount and the sender pays the fee + amount.
    // Or it's free. Here we assume sender pays fee if any.
    const totalAmount = amount + fee;


    // If actor is AGENT, they are giving money to user, so debit agent's wallet
    if (actor.role === Role.AGENT && actor.wallet) {
      const agentWalletUpdate = await Wallet.findOneAndUpdate(
        { _id: actor.wallet._id, balance: { $gte: totalAmount } },
        { $inc: { balance: -totalAmount } },
        { session },
      );

      if (!agentWalletUpdate) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Agent has insufficient funds to perform Cash In",
        );
      }
    }

    await Wallet.findByIdAndUpdate(
      receiverWallet._id,
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

    await _handleAgentCommission(session, actor, amount, "cash-in");

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
      fromWallet = actor.wallet; // Use populated wallet
      transactionType = TransactionType.WITHDRAW;
    } else if (actor.role === Role.AGENT) {
      if (!fromId) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "'fromId' is required for agents",
        );
      }
      fromUser = await User.findById(fromId).session(session);
      if (!fromUser) {
        throw new AppError(
          StatusCodes.NOT_FOUND,
          "User to withdraw from not found",
        );
      }
      fromWallet = await Wallet.findOne({ owner: fromId }).session(session);
      transactionType = TransactionType.CASH_OUT;
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

    // Get system config for fee
    const systemConfig = await SystemConfigServices.getSystemConfig();
    const feePercentage = (systemConfig.withdrawFee || 0) / 100;
    const fee = amount * feePercentage;
    const totalAmount = amount + fee;

    // Atomically check balance and decrement
    const fromWalletUpdate = await Wallet.findOneAndUpdate(
      {
        _id: fromWallet._id,
        balance: { $gte: totalAmount },
      },
      { $inc: { balance: -totalAmount } },
      { session },
    );

    // If actor is AGENT (Cash Out), they receive the digital money
    if (actor.role === Role.AGENT && actor.wallet) {
      await Wallet.findByIdAndUpdate(
        actor.wallet._id,
        { $inc: { balance: amount } },
        { session },
      );
    }

    if (!fromWalletUpdate) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Insufficient funds.");
    }

    await Transaction.create(
      [
        {
          walletId: fromWallet._id,
          sender: actor._id,
          receiver: fromUser._id, // Clarification: `receiver` is the owner of the debited wallet.
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

    await _handleAgentCommission(session, actor, amount, "cash-out");

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

  if (actor.role === Role.ADMIN) {
    if (typeof query.userId === "string") {
      filter.$or = [{ sender: query.userId }, { receiver: query.userId }];
    }
  } else {
    filter.$or = [{ sender: actor._id }, { receiver: actor._id }];
  }

  if (typeof query.type === "string") {
    filter.type = query.type;
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
    receiver: actor._id,
    type: TransactionType.COMMISSION,
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
