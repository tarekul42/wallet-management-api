import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import sendResponse from "../utils/sendResponse";

/**
 * Helper function to create a rate limiter with a consistent response format.
 * @param max - Maximum number of requests
 * @param windowMs - Time window in milliseconds (default 15 minutes)
 * @param message - Custom error message
 */
const createLimiter = (max: number, windowMs: number = 15 * 60 * 1000, message: string = "Too many requests, Please try again later.") => {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req: Request, res: Response) => {
            sendResponse(res, {
                success: false,
                statusCode: httpStatus.TOO_MANY_REQUESTS,
                message,
                data: null,
            });
        },
    });
};

// General API limiter
export const generalApiRateLimiter = createLimiter(100);
export const apiLimiter = generalApiRateLimiter; // Maintain compatibility

// Authentication limiter (stricter)
export const authLimiter = createLimiter(20);

// Admin actions limiter
export const adminActionLimiter = createLimiter(30, 1 * 60 * 1000);

// User self-actions (profile updates etc.)
export const selfActionLimiter = createLimiter(60, 1 * 60 * 1000);

// Transaction limiter
export const transactionRateLimiter = createLimiter(100);

// System config update limiter
export const systemConfigUpdateLimiter = createLimiter(50);

// Wallet action limiter
export const walletActionLimiter = createLimiter(50);
