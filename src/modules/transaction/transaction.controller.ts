import { Request, Response } from "express";
import httpStatus, { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { TransactionServices } from "./transaction.service.js";
import { JwtPayload } from "jsonwebtoken";

const sendMoney = catchAsync(async (req: Request, res: Response) => {
  const { amount, receiverEmail, description } = req.body;
  const user = req.user as JwtPayload;

  const result = await TransactionServices.sendMoney(
    user.userId,
    receiverEmail,
    amount,
    description,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: { balance: result.balance },
  });
});

const addMoney = catchAsync(async (req: Request, res: Response) => {
  const { amount, receiverId } = req.body;
  const user = req.user as JwtPayload;

  const result = await TransactionServices.addMoney(
    user.userId,
    amount,
    receiverId,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: { balance: result.balance },
  });
});

const withdrawMoney = catchAsync(async (req: Request, res: Response) => {
  const { amount, fromId } = req.body;
  const user = req.user as JwtPayload;

  const result = await TransactionServices.withdrawMoney(
    user.userId,
    amount,
    fromId,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: { balance: result.balance },
  });
});

const viewHistory = catchAsync(async (req: Request, res: Response) => {
  // CRITICAL FIX: Use the authenticated user's ID from the JWT, not from params.
  const user = req.user as JwtPayload;
  const result = await TransactionServices.viewHistory(user.userId, req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Transaction history retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getCommissionHistory = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;

  const result = await TransactionServices.getCommissionHistory(
    user.userId,
    req.query,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Commission history retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const TransactionControllers = {
  sendMoney,
  addMoney,
  withdrawMoney,
  viewHistory,
  getCommissionHistory,
};
