import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import asyncHandler from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { CardServices } from "./card.service";

const getMyCards = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const cards = await CardServices.getByUser(user.userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Cards fetched successfully",
    data: cards,
  });
});

export const CardControllers = { getMyCards };
