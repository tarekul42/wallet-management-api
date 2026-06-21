import { model, Schema } from "mongoose";
import { IWallet, WalletStatus } from "./wallet.interface.js";

const walletSchema = new Schema<IWallet>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    balance: { type: Number, required: true, default: 50 },
    status: {
      type: String,
      enum: Object.values(WalletStatus),
      default: WalletStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

walletSchema.index({ owner: 1 }, { unique: true });
walletSchema.index({ status: 1 });

export const Wallet = model<IWallet>("Wallet", walletSchema);
