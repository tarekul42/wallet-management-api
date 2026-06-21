import { Response } from "express";
import { envVars } from "../config/env.js";

export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
}

const setAuthCookie = (res: Response, tokenInfo: AuthTokens) => {
  const isProduction = envVars.NODE_ENV === "production";
  
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" as const : "lax" as const,
    domain: envVars.COOKIE_DOMAIN,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  };

  if (tokenInfo.accessToken) {
    res.cookie("accessToken", tokenInfo.accessToken, cookieOptions);
  }

  if (tokenInfo.refreshToken) {
    res.cookie("refreshToken", tokenInfo.refreshToken, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days for refresh token
    });
  }
};

export default setAuthCookie;
