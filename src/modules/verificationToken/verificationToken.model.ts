import { model, Schema } from "mongoose";
import IVerificationToken from "./verificationToken.interface";

const verificationTokenSchema = new Schema<IVerificationToken>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
    index: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const VerificationToken = model<IVerificationToken>(
  "VerificationToken",
  verificationTokenSchema
);

export default VerificationToken;
