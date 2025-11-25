import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import sendResponse from "../utils/sendResponse";
import httpStatus from "http-status-codes";

const generalApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requrests, Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    sendResponse(res, {
      success: false,
      statusCode: httpStatus.TOO_MANY_REQUESTS,
      message: "Too many requests, Please try again later.",
      data: null,
    });
  },
});

export { generalApiRateLimiter, authLimiter };
