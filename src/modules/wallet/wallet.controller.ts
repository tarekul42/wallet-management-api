import httpStatus from "http-status-codes";
import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";
import { WalletServices } from "./wallet.service";

const getMyWallet = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await WalletServices.getMyWallet(user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Wallet fetched successfully",
    data: result,
  });
});

const getAllWallets = catchAsync(async (req: Request, res: Response) => {
  const result = await WalletServices.getAllWallets();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Wallets fetched successfully",
    data: result,
  });
});

const getSingleWallet = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await WalletServices.getSingleWallet(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Wallet fetched successfully",
    data: result,
  });
});

const blockWallet = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await WalletServices.blockWallet(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Wallet blocked successfully",
    data: result,
  });
});

const unblockWallet = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await WalletServices.unblockWallet(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Wallet unblocked successfully",
    data: result,
  });
});

export const WalletControllers = {
  getMyWallet,
  getAllWallets,
  getSingleWallet,
  blockWallet,
  unblockWallet,
};
