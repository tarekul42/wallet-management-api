"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemSettings = void 0;
const mongoose_1 = require("mongoose");
const systemSettingsSchema = new mongoose_1.Schema({
    transactionFee: {
        type: Number,
        required: true,
        default: 0.015, // Default 1.5% fee
        min: 0,
    },
    updatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.SystemSettings = (0, mongoose_1.model)("SystemSettings", systemSettingsSchema);
