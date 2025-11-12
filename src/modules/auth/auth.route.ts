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
  AuthControllers.registerUser
);

router.get("/verify-email", authLimiter, AuthControllers.verifyEmail);

router.post(
  "/login",
  authLimiter,
  validateRequest(AuthValidations.loginUserValidationSchema),
  AuthControllers.credentialsLogin
);

router.post(
  "/logout",
  authLimiter,
  checkAuth(Role.USER, Role.AGENT, Role.ADMIN, Role.SUPER_ADMIN),
  AuthControllers.logoutUser
);

router.post(
  "/refresh-token",
  authLimiter,
  AuthControllers.getNewAccessToken
);

export const AuthRoutes = router;
