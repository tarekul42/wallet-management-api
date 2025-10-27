import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { TransactionServices } from "./transaction.service";
import { JwtPayload } from "jsonwebtoken";

const addMoneyTopUp = catchAsync(async (req: Request, res: Response) => {
  const { amount } = req.body;
  const user = req.user as JwtPayload;

  const result = await TransactionServices.addMoneyTopUp(user.userId, amount);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: {
      transactionId: result.transactionId,
      balance: result.newBalance,
    },
  });
});

const sendMoney = catchAsync(async (req: Request, res: Response) => {
  const { amount, receiverPhone } = req.body;
  const user = req.user as JwtPayload;

  const result = await TransactionServices.sendMoney(
    user.userId,
    receiverPhone,
    amount,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: {
      transactionId: result.transactionId,
      balance: result.newBalance,
    },
  });
});

const withdrawMoney = catchAsync(async (req: Request, res: Response) => {
  const { amount } = req.body;
  const user = req.user as JwtPayload;

  const result = await TransactionServices.withdrawMoney(user.userId, amount);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: {
      transactionId: result.transactionId,
      balance: result.newBalance,
    },
  });
});

const getTransactionHistory = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;

    const history = await TransactionServices.getTransactionHistory(
      user.userId,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Transaction history retrieved successfully.",
      data: history,
    });
  },
);

export const TransactionControllers = {
  addMoneyTopUp,
  sendMoney,
  withdrawMoney,
  getTransactionHistory,
};
