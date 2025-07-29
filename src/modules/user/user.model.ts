import { Role, ApprovalStatus } from "./user.interface";

import { Schema, model } from "mongoose";
import { IUser } from "./user.interface";

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.USER
    },
    commissionRate: { type: Number, default: 0 }, // for agents
    approvalStatus: {
      type: String,
      enum: Object.values(ApprovalStatus),
      default: ApprovalStatus.PENDING,
    },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", UserSchema);
