import crypto from "crypto";
import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError.js";
import { User } from "../user/user.model.js";
import { Wallet } from "../wallet/wallet.model.js";
import { IWallet, WalletStatus } from "../wallet/wallet.interface.js";
import { Transaction } from "../transaction/transaction.model.js";
import {
  TransactionStatus,
  TransactionType,
} from "../transaction/transaction.interface.js";
import { Role } from "../user/user.interface.js";
import { SystemConfigServices } from "../systemConfig/systemConfig.service.js";
import { SystemSettings } from "../system-settings/system-settings.model.js";
import { Service } from "./service.model.js";
import { withTransaction } from "../../utils/withTransaction.js";

const isPlainString = (value: unknown): value is string => {
  return typeof value === "string";
};

const escapeRegex = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

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

  if (isPlainString(search) && search.trim() !== "") {
    const safeSearch = escapeRegex(search.trim());
    filter.$or = [
      { title: { $regex: safeSearch, $options: "i" } },
      { description: { $regex: safeSearch, $options: "i" } },
    ];
  }

  if (isPlainString(category) && category.trim() !== "" && category !== "All") {
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

  const priceMatch = service.price.match(/(\d+(?:\.\d{1,2})?)/);
  const servicePrice = priceMatch ? parseFloat(priceMatch[1]) : null;
  if (servicePrice !== null && Math.abs(servicePrice - amount) > 0.001) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Amount does not match service price. Expected $${servicePrice.toFixed(2)}.`,
    );
  }

  return withTransaction(async (session) => {
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

    const config = await SystemConfigServices.getSystemConfig();
    const settings = await SystemSettings.findOne();
    const feeRate = settings?.transactionFee ?? 0.015;
    const fee = parseFloat((amount * feeRate).toFixed(2));
    const totalDeduction = amount + fee;

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
          referenceId: crypto.randomUUID(),
          description: `Payment for ${service.title}`,
          service: new mongoose.Types.ObjectId(serviceId),
        },
      ],
      { session },
    );

    const updatedWallet = await Wallet.findById(user.wallet._id);
    return {
      message: `Successfully purchased ${service.title}`,
      balance: updatedWallet?.balance ?? 0,
    };
  }, "Purchase");
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
