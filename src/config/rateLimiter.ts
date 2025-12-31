import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import httpStatus from "http-status-codes";

/**
 * Helper function to create a rate limiter with a consistent response format.
 * @param max - Maximum number of requests
 * @param windowMs - Time window in milliseconds (default 15 minutes)
 * @param message - Custom error message
 */
const createLimiter = (max: number, windowMs: number = 15 * 60 * 1000, message = "Too many requests, Please try again later.") => {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req: Request, res: Response) => {
            res.status(httpStatus.TOO_MANY_REQUESTS).json({
                success: false,
                statusCode: httpStatus.TOO_MANY_REQUESTS,
                message,
                data: null,
            });
        },
    });
};

// General API limiter
export const apiLimiter = createLimiter(100);
export const generalApiRateLimiter = apiLimiter; // for compatibility

// Authentication limiter (stricter)
export const authLimiter = createLimiter(20);

// Admin actions limiter - Adopted 1 minute window from incoming commit
export const adminActionLimiter = createLimiter(30, 1 * 60 * 1000);

// User self-actions (profile updates etc.) - Adopted 1 minute window and limit of 60 from incoming commit
export const selfActionLimiter = createLimiter(60, 1 * 60 * 1000);

// Transaction limiter
export const transactionRateLimiter = createLimiter(20, 15 * 60 * 1000, "Too many transaction attempts. Please wait before trying again.");

// System config update limiter
export const systemConfigUpdateLimiter = createLimiter(10, 15 * 60 * 1000, "Too many configuration update attempts.");

// Wallet action limiter
export const walletActionLimiter = createLimiter(30, 15 * 60 * 1000, "Too many wallet actions. Please try again later.");
