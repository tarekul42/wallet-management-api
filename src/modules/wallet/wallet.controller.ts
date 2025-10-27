import httpStatus from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import AppError from "../../errorHelpers/AppError";
import { sendResponse } from "../../utils/sendResponse";
import { getMyWallet } from "./wallet.service";

import { JwtPayload } from "jsonwebtoken";

// Wallet Controller
export const getWallet = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError(httpStatus.BAD_REQUEST, "User does not exists");
    }

    const userId = (req.user as JwtPayload).userId;
    const wallet = await getMyWallet(userId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Wallet fetched successfully",
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
};
