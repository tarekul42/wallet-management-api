import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import asyncHandler from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { DashboardServices } from "./dashboard.service.js";

const getSpendingOverview = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const data = await DashboardServices.getSpendingOverview(user.userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Spending overview fetched successfully",
    data,
  });
});

export const DashboardControllers = { getSpendingOverview };
