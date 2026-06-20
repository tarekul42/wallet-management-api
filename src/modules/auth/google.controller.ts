import { Request, Response } from "express";
import { envVars } from "../../config/env";
import { createUserTokens } from "../../utils/userTokens";
import { IUser } from "../user/user.interface";

const googleCallback = (req: Request, res: Response) => {
  const user = req.user as (IUser & { _id: { toString(): string } }) | undefined;

  if (!user) {
    return res.redirect(`${envVars.CLIENT_URL}/login?error=google_auth_failed`);
  }

  const tokens = createUserTokens(user);

  const redirectUrl = new URL(`${envVars.CLIENT_URL}/auth/callback`);
  redirectUrl.searchParams.set("token", tokens.accessToken);
  redirectUrl.searchParams.set("refreshToken", tokens.refreshToken);
  redirectUrl.searchParams.set("redirect", "/dashboard");

  res.redirect(redirectUrl.toString());
};

export const GoogleControllers = { googleCallback };
