import { Types } from "mongoose";

export enum Role {
  USER = "USER",
  AGENT = "AGENT",
  ADMIN = "ADMIN",
}

export enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  SUSPENDED = "SUSPENDED",
}

export enum IsActive {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    BLOCKED = "BLOCKED"
}

export interface IUser {
  _id?: Types.ObjectId;
  name: string;
  phone: string;
  password: string;
  role: Role;
  isActive?: IsActive;
  commissionRate?: number;
  approvalStatus?: ApprovalStatus;
  createdAt?: Date;
  updatedAt?: Date;
}
