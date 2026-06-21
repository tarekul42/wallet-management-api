import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status-codes";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { AgentServices } from "./agent.service";

const getSummary = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await AgentServices.getSummary(user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Agent dashboard summary retrieved successfully",
    data: result,
  });
});

export const AgentControllers = { getSummary };
