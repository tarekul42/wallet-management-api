import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { v4 as uuidv4 } from "uuid";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { Wallet } from "../wallet/wallet.model";
import { IWallet, WalletStatus } from "../wallet/wallet.interface";
import { Transaction } from "../transaction/transaction.model";
import {
  TransactionStatus,
  TransactionType,
} from "../transaction/transaction.interface";
import { Role } from "../user/user.interface";
import { SystemConfigServices } from "../systemConfig/systemConfig.service";
import { SystemSettings } from "../system-settings/system-settings.model";
import { Service } from "./service.model";

const getAll = async (query: {
  search?: string;
  category?: string;
  minRating?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
}) => {
  const { search, category, minRating, sortBy, page = 1, limit = 12 } = query;

  const filter: Record<string, unknown> = {};

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (category && category !== "All") {
    filter.category = category;
  }

  if (minRating) {
    filter.rating = { $gte: minRating };
  }

  let sortOption: Record<string, 1 | -1> = { rating: -1 };
  if (sortBy === "title") sortOption = { title: 1 };
  if (sortBy === "date") sortOption = { createdAt: -1 };

  const skip = (page - 1) * limit;

  const [services, total] = await Promise.all([
    Service.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
    Service.countDocuments(filter),
  ]);

  return {
    data: services,
    meta: {
      page,
      limit,
      totalPage: Math.ceil(total / limit),
      total,
    },
  };
};

const getById = async (id: string) => {
  return await Service.findById(id).lean();
};

const getRelated = async (id: string) => {
  const service = await Service.findById(id).lean();
  if (!service) return [];
  return await Service.find({
    _id: { $ne: id },
    category: service.category,
  })
    .select("title image")
    .limit(4)
    .lean();
};

const getCategories = async () => {
  return await Service.distinct("category");
};

const purchase = async (userId: string, serviceId: string, amount: number) => {
  if (amount <= 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Amount must be positive.");
  }

  const service = await Service.findById(serviceId).lean();
  if (!service) {
    throw new AppError(StatusCodes.NOT_FOUND, "Service not found");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findById(userId)
      .populate<{ wallet: IWallet }>("wallet")
      .session(session);

    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }
    if (user.role !== Role.USER) {
      throw new AppError(StatusCodes.FORBIDDEN, "Only users can purchase services");
    }
    if (!user.wallet) {
      throw new AppError(StatusCodes.NOT_FOUND, "Wallet not found");
    }
    if (user.wallet.status !== WalletStatus.ACTIVE) {
      throw new AppError(StatusCodes.FORBIDDEN, "Your wallet is not active");
    }

    // Get system fee and system wallet
    const config = await SystemConfigServices.getSystemConfig();
    const settings = await SystemSettings.findOne();
    const feeRate = settings?.transactionFee ?? 0.015;
    const fee = parseFloat((amount * feeRate).toFixed(2));
    const totalDeduction = amount + fee;

    // Atomically deduct amount + fee from user's wallet
    const walletUpdate = await Wallet.findOneAndUpdate(
      {
        _id: { $eq: String(user.wallet._id) },
        balance: { $gte: totalDeduction },
      },
      { $inc: { balance: -totalDeduction } },
      { session },
    );

    if (!walletUpdate) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Insufficient funds.");
    }

    // Send fee to system wallet
    if (fee > 0 && config.systemWalletId) {
      await Wallet.findOneAndUpdate(
        { _id: { $eq: String(config.systemWalletId) } },
        { $inc: { balance: fee } },
        { session },
      );
    }

    await Transaction.create(
      [
        {
          walletId: user.wallet._id,
          sender: user._id,
          receiver: user._id,
          amount,
          fee,
          type: TransactionType.SERVICE_PURCHASE,
          status: TransactionStatus.SUCCESSFUL,
          referenceId: uuidv4(),
          description: `Payment for ${service.title}`,
          service: new mongoose.Types.ObjectId(serviceId),
        },
      ],
      { session },
    );

    await session.commitTransaction();

    const updatedWallet = await Wallet.findById(user.wallet._id);
    return {
      message: `Successfully purchased ${service.title}`,
      balance: updatedWallet?.balance ?? 0,
    };
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Purchase failed. Please try again.",
    );
  } finally {
    session.endSession();
  }
};

const getMyPurchases = async (userId: string) => {
  const transactions = await Transaction.find({
    sender: new mongoose.Types.ObjectId(userId),
    type: TransactionType.SERVICE_PURCHASE,
    status: TransactionStatus.SUCCESSFUL,
  })
    .populate("service", "title image price category")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return transactions;
};

export const ServiceServices = { getAll, getById, getRelated, getCategories, purchase, getMyPurchases };
