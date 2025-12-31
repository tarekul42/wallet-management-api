import express from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { UserRoutes } from "../modules/user/user.route";
import { WalletRoutes } from "../modules/wallet/wallet.route";
import { TransactionRoutes } from "../modules/transaction/transaction.route";
import { SystemConfigRoutes } from "../modules/systemConfig/systemConfig.route";

const router = express.Router();

const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  { path: "/users", route: UserRoutes },
  { path: "/wallets", route: WalletRoutes },
  {
    path: "/transactions",
    route: TransactionRoutes,
  },
  {
    path: "/system-config",
    route: SystemConfigRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
