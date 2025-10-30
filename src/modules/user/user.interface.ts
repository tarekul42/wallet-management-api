import { Types } from "mongoose";

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  USER = "USER",
  AGENT = "AGENT",
}

export enum IsActive {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED",
}

export enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface IUser {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword?: string;
  address?: string;
  nid?: string;
  isDeleted?: boolean;
  isActive?: IsActive;
  isVerified?: boolean;
  role: Role;
  wallet?: Types.ObjectId;
  commissionRate?: number;
  approvalStatus?: ApprovalStatus;
  createdAt?: Date;
  updatedAt?: Date;
}
