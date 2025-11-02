import bcrypt from "bcryptjs";
import { model, Schema } from "mongoose";
import { ApprovalStatus, IsActive, IUser, Role } from "./user.interface";
import { envVars } from "../../config/env";

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true, // allows unique but optional
    },
    address: {
      type: String,
    },
    nid: {
      type: String,
      required: function () {
        return this.role === Role.USER || this.role === Role.AGENT;
      }, // so that, admins will be able to add without nid requirement
    },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.USER,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: String,
      enum: Object.values(IsActive),
      default: IsActive.ACTIVE,
    },
    isVerified: {
      type: Boolean,
      default: true, // TODO: will be changed latter
    },
    wallet: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
    },
    commissionRate: {
      type: Number,
      default: null,
    },
    approvalStatus: {
      type: String,
      enum: Object.values(ApprovalStatus),
      default: null,
      required: function () {
        return this.role === Role.AGENT;
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(
      this.password,
      Number(envVars.BCRYPT_SALT_ROUND),
    );
  }
  next();
});

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export const User = model<IUser>("User", userSchema);
