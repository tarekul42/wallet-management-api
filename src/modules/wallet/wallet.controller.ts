import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import { WalletServices } from "./wallet.service";
import sendResponse from "../../utils/sendResponse";
import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";

const getMyWallet = catchAsync(async (req: Request, res: Response) => {
  // The checkAuth middleware ensures req.user exists and has a userId.
  const user = req.user as JwtPayload;
  const result = await WalletServices.getMyWallet(user.userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Wallet retrieved successfully",
    data: result,
  });
});

const getAllWallets = catchAsync(async (req: Request, res: Response) => {
  const result = await WalletServices.getAllWallets(req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Wallets retrieved successfully",
    data: result,
  });
});

const getSingleWallet = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await WalletServices.getSingleWallet(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Wallet retrieved successfully",
    data: result,
  });
});

const blockWallet = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await WalletServices.blockWallet(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Wallet blocked successfully",
    data: result,
  });
});

const unblockWallet = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await WalletServices.unblockWallet(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
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
