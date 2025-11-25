import { Router } from "express";
import checkAuth from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { AuthControllers } from "./auth.controller";
import { AuthValidations } from "./auth.validation";
import { validateRequest } from "../../middlewares/validateRequest";
import { authLimiter } from "../../config/rateLimiter";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validateRequest(AuthValidations.registerUserValidationSchema),
  AuthControllers.registerUser,
);

router.post(
  "/login",
  authLimiter,
  validateRequest(AuthValidations.loginUserValidationSchema),
  AuthControllers.credentialsLogin,
);

router.post(
  "/logout",
  authLimiter,
  checkAuth(Role.USER, Role.AGENT, Role.ADMIN, Role.SUPER_ADMIN),
  AuthControllers.logoutUser,
);

router.post(
  "/refresh-token",
  authLimiter,
  AuthControllers.getNewAccessToken
);

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

router.post(
  "/verify-email",
  validateRequest(AuthValidations.verifyEmailValidationSchema),
  AuthControllers.verifyEmail,
);

router.post(
  "/forgot-password",
  validateRequest(AuthValidations.forgotPasswordValidationSchema),
  AuthControllers.forgotPassword,
);

router.post(
  "/reset-password",
  validateRequest(AuthValidations.resetPasswordValidationSchema),
  AuthControllers.resetPassword,
);

export const AuthRoutes = router;
