import { Types } from "mongoose";

interface IVerificationToken {
  userId: Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt?: Date;
}

export default IVerificationToken;
