import { Router } from "express";
import checkAuth from "../../middlewares/checkAuth.js";
import { Role } from "../user/user.interface.js";
import { AuthControllers } from "./auth.controller.js";
import { AuthValidations } from "./auth.validation.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { authLimiter } from "../../config/rateLimiter.js";

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

router.get("/demo-users", AuthControllers.getDemoUsers);

export const AuthRoutes = router;
