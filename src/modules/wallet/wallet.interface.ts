import { Types } from "mongoose";

export interface IWallet {
  _id?: Types.ObjectId;
  owner: Types.ObjectId;
  balance: number;
  status: "ACTIVE" | "BLOCKED";
  createdAt?: Date;
  updatedAt?: Date;
}
