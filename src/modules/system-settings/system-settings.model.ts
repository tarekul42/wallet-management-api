import { Schema, model } from "mongoose";
import { ISystemSettings } from "./system-settings.interface";

const systemSettingsSchema = new Schema<ISystemSettings>(
    {
        transactionFee: {
            type: Number,
            required: true,
            default: 0.015, // Default 1.5% fee
            min: 0,
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

export const SystemSettings = model<ISystemSettings>(
    "SystemSettings",
    systemSettingsSchema,
);
