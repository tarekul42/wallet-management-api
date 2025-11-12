import { Router } from "express";
import checkAuth from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { AuthControllers } from "./auth.controller";
import { AuthValidations } from "./auth.validation";
import { validateRequest } from "../../middlewares/validateRequest";

const router = Router();

router.post(
  "/register",
  validateRequest(AuthValidations.registerUserValidationSchema),
  AuthControllers.registerUser
);

router.get("/verify-email", AuthControllers.verifyEmail);

router.post(
  "/login",
  validateRequest(AuthValidations.loginUserValidationSchema),
  AuthControllers.credentialsLogin
);

router.post(
  "/logout",
  checkAuth(Role.USER, Role.AGENT, Role.ADMIN, Role.SUPER_ADMIN),
  AuthControllers.logoutUser
);

router.post("/refresh-token", AuthControllers.getNewAccessToken);

export const AuthRoutes = router;
