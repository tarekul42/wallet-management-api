import { Types } from "mongoose";

export enum TransactionType {
  TOP_UP = "TOP_UP",
  WITHDRAW = "WITHDRAW",
  SEND_MONEY = "SEND_MONEY",
  RECEIVE_MONEY = "RECEIVE_MONEY",
  CASH_IN = "CASH_IN",
  CASH_OUT = "CASH_OUT",
  COMMISSION = "COMMISSION",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REVERSED = "REVERSED",
}

export interface ITransaction {
  owner: Types.ObjectId;
  type: TransactionType;
  amount: number;
  fee?: number;
  commission?: number;
  status: TransactionStatus;
  reference?: string;
  sender?: Types.ObjectId;
  receiver?: Types.ObjectId;
  timestamp: Date;
}
