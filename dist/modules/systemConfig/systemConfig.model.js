"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConfig = void 0;
const mongoose_1 = require("mongoose");
/**
 * SystemConfig Schema
 * Stores system-wide configurable parameters
 * There should only be ONE document in this collection
 */
const systemConfigSchema = new mongoose_1.Schema({
    sendMoneyFee: {
        type: Number,
        default: 5, // Flat fee
        min: 0,
    },
    cashInFee: {
        type: Number,
        default: 0, // Free
        min: 0,
    },
    withdrawFee: {
        type: Number,
        default: 1.5, // 1.5% or flat
        min: 0,
    },
    agentCommissionRate: {
        type: Number,
        default: 2, // 2%
        min: 0,
    },
    dailyLimit: {
        type: Number,
        default: 25000, // ৳25,000 per day
        min: 0,
    },
    monthlyLimit: {
        type: Number,
        default: 100000, // ৳1,00,000 per month
        min: 0,
    },
    minBalance: {
        type: Number,
        default: 0,
        min: 0,
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.SystemConfig = (0, mongoose_1.model)("SystemConfig", systemConfigSchema);
