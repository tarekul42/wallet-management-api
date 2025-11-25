"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLimiter = exports.generalApiRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const sendResponse_1 = __importDefault(require("../utils/sendResponse"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const generalApiRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: "Too many requrests, Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.generalApiRateLimiter = generalApiRateLimiter;
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_codes_1.default.TOO_MANY_REQUESTS,
            message: "Too many requests, Please try again later.",
            data: null,
        });
    },
});
exports.authLimiter = authLimiter;
