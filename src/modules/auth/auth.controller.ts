/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import passport from "passport";
import AppError from "../../errorHelpers/AppError";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import setAuthCookie from "../../utils/setCookie";
import { IUser } from "../user/user.interface";
import { AuthServices } from "./auth.service";
import { Document } from "mongoose";

const getNewAccessToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No refresh token received from cookies",
      );
    }
    const tokenInfo = await AuthServices.getNewAccessToken(
      refreshToken as string,
    );

    setAuthCookie(res, tokenInfo);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "New Access Token Retrived Successfully",
      data: tokenInfo,
    });
  },
);

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.registerUser(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message:
      "User registered successfully. Please check your email to verify your account.",
    data: result,
  });
});

const credentialsLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      "local",
      async (
        err: Error | null,
        user: (IUser & Document) | false,
        info: { message: string },
      ) => {
        if (err) {
          return next(new AppError(httpStatus.UNAUTHORIZED, err.message));
        }

        if (!user) {
          return next(
            new AppError(
              httpStatus.UNAUTHORIZED,
              info.message || "Authentication failed",
            ),
          );
        }

        const loginData = await AuthServices.credentialsLogin(user);

        setAuthCookie(res, loginData);

        sendResponse(res, {
          success: true,
          statusCode: httpStatus.OK,
          message: "User Logged In Successfully",
          data: loginData,
        });
      },
    )(req, res, next);
  },
);

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  if (refreshToken) {
    await AuthServices.logoutUser(refreshToken);
  }

  // Clear cookies
  res.clearCookie("accessToken", { httpOnly: true, secure: false }); // secure should be true in production
  res.clearCookie("refreshToken", { httpOnly: true, secure: false });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged out successfully.",
    data: null,
  });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const token = (req.query.token as string) || (req.body.token as string);
  const result = await AuthServices.verifyEmail(token);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await AuthServices.forgotPassword(email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  const result = await AuthServices.resetPassword(token, newPassword);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const AuthControllers = {
  getNewAccessToken,
  registerUser,
  credentialsLogin,
  logoutUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
