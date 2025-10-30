/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import passport from "passport";
import AppError from "../../errorHelpers/AppError";
import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";
import setAuthCookie from "../../utils/setCookie";
import { createUserTokens } from "../../utils/userTokens";
import { IUser } from "../user/user.interface";
import { AuthServices } from "./auth.service";

const credentialsLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // const loginInfo = await AuthServices.credentialsLogin(req.body)

    passport.authenticate(
      "local",
      async (
        err: Error | null,
        user: IUser | false,
        info: { message: string },
      ) => {
        if (err) {
          return next(new AppError(401, err.message));
        }

        if (!user) {
          return next(new AppError(401, info.message));
        }

        const userTokens = createUserTokens(user);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { password: pass, ...rest } = (user as any).toObject();

        setAuthCookie(res, userTokens);

        sendResponse(res, {
          success: true,
          statusCode: httpStatus.OK,
          message: "User Logged In Successfully",
          data: {
            accessToken: userTokens.accessToken,
            refreshToken: userTokens.refreshToken,
            user: rest,
          },
        });
      },
    )(req, res, next);
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

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Verification token is required.",
    );
  }

  const result = await AuthServices.verifyEmail(token as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Refresh token not found in cookies.",
    );
  }

  const result = await AuthServices.logoutUser();

  // Clear cookies
  res.clearCookie("accessToken", { httpOnly: true, secure: false }); // secure should be true in production
  res.clearCookie("refreshToken", { httpOnly: true, secure: false });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

const getNewAccessToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No refresh token recieved from cookies",
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

export const AuthControllers = {
  credentialsLogin,
  getNewAccessToken,
  registerUser,
  verifyEmail,
  logoutUser,
};
