import { Router } from "express";
import checkAuth from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { AuthControllers } from "./auth.controller";
import { AuthValidations } from "./auth.validation";
import rateLimit from "express-rate-limit";

const router = Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 auth requests per windowMs
});

router.post(
  "/register",
  authLimiter,
  validateRequest(AuthValidations.registerUserValidationSchema),
  AuthControllers.registerUser,
);

router.get("/verify-email", authRateLimiter, AuthControllers.verifyEmail);

router.post(
  "/login",
  authRateLimiter,
  validateRequest(AuthValidations.loginUserValidationSchema),
  AuthControllers.credentialsLogin,
);

router.post(
  "/logout",
  authRateLimiter,
  checkAuth(Role.USER, Role.AGENT, Role.ADMIN, Role.SUPER_ADMIN),
  AuthControllers.logoutUser,
);

router.post("/refresh-token", authRateLimiter, AuthControllers.getNewAccessToken);

router.post(
  "/verify-email",
  authLimiter,
  validateRequest(AuthValidations.verifyEmailValidationSchema),
  AuthControllers.verifyEmail,
);

router.post(
  "/forgot-password",
  authLimiter,
  validateRequest(AuthValidations.forgotPasswordValidationSchema),
  AuthControllers.forgotPassword,
);

router.post(
  "/reset-password",
  authLimiter,
  validateRequest(AuthValidations.resetPasswordValidationSchema),
  AuthControllers.resetPassword,
);

export const AuthRoutes = router;
