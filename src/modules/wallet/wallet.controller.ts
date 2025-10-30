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

export const WalletControllers = {
  getMyWallet,
};
