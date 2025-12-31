import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import httpStatus from "http-status-codes";

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

const generalApiRateLimiter = createLimiter(100);
const authLimiter = createLimiter(20);
const adminActionLimiter = createLimiter(30, 1 * 60 * 1000);
const selfActionLimiter = createLimiter(60, 1 * 60 * 1000);
const transactionRateLimiter = createLimiter(100);
const systemConfigUpdateLimiter = createLimiter(50);
const walletActionLimiter = createLimiter(50);

export {
    generalApiRateLimiter,
    authLimiter,
    adminActionLimiter,
    selfActionLimiter,
    transactionRateLimiter,
    systemConfigUpdateLimiter,
    walletActionLimiter,
};
