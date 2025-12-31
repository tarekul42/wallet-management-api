import { Router } from "express";
import checkAuth from "../../middlewares/checkAuth";
import validateRequest from "../../middlewares/validateRequest";
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

export const AuthRoutes = router;
