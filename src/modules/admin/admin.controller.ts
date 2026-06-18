import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { AdminServices } from "./admin.service";

const getSummary = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminServices.getSummary();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin dashboard statistics retrieved successfully",
    data: result,
  });
});

export const AdminControllers = { getSummary };
