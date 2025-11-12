"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("../config/env");
const setAuthCookie = (res, tokenInfo) => {
    const cookieOptions = {
        httpOnly: true,
        secure: env_1.envVars.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24,
    };
    if (tokenInfo.accessToken) {
        res.cookie("accessToken", tokenInfo.accessToken, cookieOptions);
    }
    if (tokenInfo.refreshToken) {
        res.cookie("refreshToken", tokenInfo.refreshToken, cookieOptions);
    }
};
exports.default = setAuthCookie;
