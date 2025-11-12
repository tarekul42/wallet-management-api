import { Types } from "mongoose";

export interface IVerificationToken {
    userId: Types.ObjectId;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}
