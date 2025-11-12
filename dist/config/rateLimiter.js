"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletActionLimiter = exports.systemConfigUpdateLimiter = exports.transactionRateLimiter = exports.selfActionLimiter = exports.adminActionLimiter = exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
/**
 * Helper function to create a rate limiter with a consistent response format.
 * @param max - Maximum number of requests
 * @param windowMs - Time window in milliseconds (default 15 minutes)
 * @param message - Custom error message
 */
const createLimiter = (max, windowMs = 15 * 60 * 1000, message = "Too many requests, Please try again later.") => {
    return (0, express_rate_limit_1.default)({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(http_status_codes_1.default.TOO_MANY_REQUESTS).json({
                success: false,
                statusCode: http_status_codes_1.default.TOO_MANY_REQUESTS,
                message,
                data: null,
            });
        },
    });
};
// General API limiter
exports.apiLimiter = createLimiter(100);
// Authentication limiter (stricter)
exports.authLimiter = createLimiter(20);
// Admin actions limiter
exports.adminActionLimiter = createLimiter(30);
// User self-actions (profile updates etc.)
exports.selfActionLimiter = createLimiter(50);
// Transaction limiter
exports.transactionRateLimiter = createLimiter(20, 15 * 60 * 1000, "Too many transaction attempts. Please wait before trying again.");
// System config update limiter
exports.systemConfigUpdateLimiter = createLimiter(10, 15 * 60 * 1000, "Too many configuration update attempts.");
// Wallet action limiter
exports.walletActionLimiter = createLimiter(30, 15 * 60 * 1000, "Too many wallet actions. Please try again later.");
