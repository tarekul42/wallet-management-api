"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const mongoose_1 = require("mongoose");
const transaction_interface_1 = require("./transaction.interface");
const transactionSchema = new mongoose_1.Schema({
    walletId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Wallet",
        required: true,
    },
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    receiver: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    amount: {
        type: Number,
        required: true,
        min: [0, "Amount cannot be negative"],
    },
    fee: {
        type: Number,
        required: true,
        default: 0,
    },
    commission: {
        type: Number,
    },
    type: {
        type: String,
        enum: Object.values(transaction_interface_1.TransactionType),
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(transaction_interface_1.TransactionStatus),
        required: true,
        default: transaction_interface_1.TransactionStatus.PENDING,
    },
    referenceId: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
    },
    // createdAt is populated by Mongoose when `timestamps: true` is enabled.
    // Define the path here to enforce immutability for audit purposes.
    createdAt: {
        type: Date,
        immutable: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.Transaction = (0, mongoose_1.model)("Transaction", transactionSchema);
