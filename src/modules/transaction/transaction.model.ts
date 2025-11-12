import { model, Schema } from "mongoose";
import {
  ITransaction,
  TransactionModel,
  TransactionStatus,
  TransactionType,
} from "./transaction.interface";

const transactionSchema = new Schema<ITransaction, TransactionModel>(
  {
    walletId: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
    },
    fee: {
      type: Number,
      required: true,
      default: 0,
    },
    commission: {
      type: Number,
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      required: true,
      default: TransactionStatus.PENDING,
    },
    referenceId: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Add indexes for better query performance
transactionSchema.index({ walletId: 1 });
transactionSchema.index({ sender: 1 });
transactionSchema.index({ receiver: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });

// Compound index for common query patterns
transactionSchema.index({ walletId: 1, status: 1, createdAt: -1 });

export const Transaction = model<ITransaction, TransactionModel>(
  "Transaction",
  transactionSchema,
);
