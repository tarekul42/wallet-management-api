import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import sendResponse from "../utils/sendResponse";

const envMax = (key: string, fallback: number): number => {
  const val = process.env[key];
  if (val) {
    const parsed = Number(val);
    if (!isNaN(parsed)) return parsed;
  }
  return fallback;
};

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
export const apiLimiter = createLimiter(envMax("RATE_LIMIT_API_MAX", 100));
export const generalApiRateLimiter = apiLimiter; // for compatibility

// Authentication limiter (stricter)
export const authLimiter = createLimiter(envMax("RATE_LIMIT_AUTH_MAX", 20));

// Admin actions limiter
export const adminActionLimiter = createLimiter(envMax("RATE_LIMIT_ADMIN_MAX", 30), 1 * 60 * 1000);

// User self-actions (profile updates etc.)
export const selfActionLimiter = createLimiter(envMax("RATE_LIMIT_SELF_MAX", 60), 1 * 60 * 1000);

// Transaction limiter
export const transactionRateLimiter = createLimiter(envMax("RATE_LIMIT_TX_MAX", 100), 15 * 60 * 1000, "Too many transaction attempts. Please wait before trying again.");

// System config update limiter
export const systemConfigUpdateLimiter = createLimiter(envMax("RATE_LIMIT_CONFIG_MAX", 50), 15 * 60 * 1000, "Too many configuration update attempts.");

// Wallet action limiter
export const walletActionLimiter = createLimiter(envMax("RATE_LIMIT_WALLET_MAX", 50), 15 * 60 * 1000, "Too many wallet actions. Please try again later.");
