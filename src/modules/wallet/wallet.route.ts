import { Router } from "express";
import { Role } from "../user/user.interface";
import { WalletControllers } from "./wallet.controller";
import checkAuth from "../../middlewares/checkAuth";
import { walletActionLimiter } from "../../config/rateLimiter";

const router = Router();

router.use(walletActionLimiter);

router.get(
  "/me",
  checkAuth(Role.USER, Role.AGENT, Role.SUPER_ADMIN),
  WalletControllers.getMyWallet,
);

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  WalletControllers.getAllWallets,
);

router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  WalletControllers.getSingleWallet,
);

router.patch(
  "/:id/block",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  WalletControllers.blockWallet,
);

router.patch(
  "/:id/unblock",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  WalletControllers.unblockWallet,
);

export const WalletRoutes = router;
