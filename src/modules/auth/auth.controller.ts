/* eslint-disable @typescript-eslint/no-unused-vars */
import { IUser } from "../user/user.interface";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import passport from "passport";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { createUserTokens } from "../../utils/userTokens";
import setAuthCookie from "../../utils/setCookie";
import { AuthServices } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";

const credentialsLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // const loginInfo = await AuthServices.credentialsLogin(req.body)

    passport.authenticate(
      "local",
      async (
        err: Error | null,
        user: IUser | false,
        info: { message: string }
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
      }
    )(req, res, next);

    // res.cookie("accessToken", loginInfo.accessToken, {
    //     httpOnly: true,
    //     secure: false
    // })

    // res.cookie("refreshToken", loginInfo.refreshToken, {
    //     httpOnly: true,
    //     secure: false,
    // })
  }
);
const getNewAccessToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No refresh token recieved from cookies"
      );
    }
    const tokenInfo = await AuthServices.getNewAccessToken(
      refreshToken as string
    );

    // res.cookie("accessToken", tokenInfo.accessToken, {
    //     httpOnly: true,
    //     secure: false
    // })

    setAuthCookie(res, tokenInfo);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "New Access Token Retrived Successfully",
      data: tokenInfo,
    });
  }
);

export const AuthControllers = {
  credentialsLogin,
  getNewAccessToken,
};
