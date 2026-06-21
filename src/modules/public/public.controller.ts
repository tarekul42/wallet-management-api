import { Request, Response } from "express";
import asyncHandler from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { PublicServices } from "./public.service.js";

const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await PublicServices.getStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Platform stats fetched successfully",
    data: stats,
  });
});

export const PublicControllers = { getStats };
