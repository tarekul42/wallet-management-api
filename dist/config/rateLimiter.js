"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletActionLimiter = exports.systemConfigUpdateLimiter = exports.transactionRateLimiter = exports.selfActionLimiter = exports.adminActionLimiter = exports.authLimiter = exports.generalApiRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
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
const generalApiRateLimiter = createLimiter(100);
exports.generalApiRateLimiter = generalApiRateLimiter;
const authLimiter = createLimiter(20);
exports.authLimiter = authLimiter;
const adminActionLimiter = createLimiter(30, 1 * 60 * 1000);
exports.adminActionLimiter = adminActionLimiter;
const selfActionLimiter = createLimiter(60, 1 * 60 * 1000);
exports.selfActionLimiter = selfActionLimiter;
const transactionRateLimiter = createLimiter(100);
exports.transactionRateLimiter = transactionRateLimiter;
const systemConfigUpdateLimiter = createLimiter(50);
exports.systemConfigUpdateLimiter = systemConfigUpdateLimiter;
const walletActionLimiter = createLimiter(50);
exports.walletActionLimiter = walletActionLimiter;
