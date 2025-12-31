import { Router } from "express";
import { Role } from "../user/user.interface";
import { WalletControllers } from "./wallet.controller";
import checkAuth from "../../middlewares/checkAuth";
import rateLimit from "express-rate-limit";

const router = Router();

const walletRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs for wallet routes
});

router.get(
  "/me",
  walletRateLimiter,
  checkAuth(Role.USER, Role.AGENT, Role.SUPER_ADMIN),
  WalletControllers.getMyWallet,
);

router.get(
  "/",
  walletRateLimiter,
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  WalletControllers.getAllWallets,
);

router.get(
  "/:id",
  walletRateLimiter,
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  WalletControllers.getSingleWallet,
);

router.patch(
  "/:id/block",
  walletRateLimiter,
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  WalletControllers.blockWallet,
);

router.patch(
  "/:id/unblock",
  walletRateLimiter,
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  WalletControllers.unblockWallet,
);

export const WalletRoutes = router;
