import { NextFunction, Request, Response, Router } from "express";
import passport from "passport";
import checkAuth from "../../middlewares/checkAuth";
import validateRequest from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { AuthControllers } from "./auth.controller";
import { AuthValidations } from "./auth.validation";

const router = Router();

router.post(
  "/register",
  validateRequest(AuthValidations.registerUserValidationSchema),
  AuthControllers.registerUser,
);

router.get("/verify-email", AuthControllers.verifyEmail);

router.post("/login", AuthControllers.credentialsLogin);

router.post(
  "/logout",
  checkAuth(Role.USER, Role.AGENT, Role.ADMIN),
  AuthControllers.logoutUser,
);

router.post("/refresh-token", AuthControllers.getNewAccessToken);

router.get(
  "/google",
  async (req: Request, res: Response, next: NextFunction) => {
    const redirect = req.query.redirect || "/";
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: redirect as string,
    })(req, res, next);
  },
);

export const AuthRoutes = router;
