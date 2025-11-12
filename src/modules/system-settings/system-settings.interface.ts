import { Types } from "mongoose";

export interface ISystemSettings {
    transactionFee: number;
    updatedBy?: Types.ObjectId;
}
