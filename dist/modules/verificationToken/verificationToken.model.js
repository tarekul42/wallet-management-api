"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const verificationTokenSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
const VerificationToken = (0, mongoose_1.model)("VerificationToken", verificationTokenSchema);
exports.default = VerificationToken;
