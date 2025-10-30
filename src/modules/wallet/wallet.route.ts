import { Router } from "express";
import { Role } from "../user/user.interface";
import { WalletControllers } from "./wallet.controller";
import checkAuth from "../../middlewares/checkAuth";

const router = Router();

router.get(
  "/me",
  checkAuth(Role.USER, Role.AGENT),
  WalletControllers.getMyWallet,
);

export const WalletRoutes = router;
