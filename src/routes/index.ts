import express from "express";
import { AuthRoutes } from "../modules/auth/auth.route.js";
import { UserRoutes } from "../modules/user/user.route.js";
import { WalletRoutes } from "../modules/wallet/wallet.route.js";
import { TransactionRoutes } from "../modules/transaction/transaction.route.js";
import { SystemConfigRoutes } from "../modules/systemConfig/systemConfig.route.js";
import { AgentRoutes } from "../modules/agent/agent.route.js";
import { AdminRoutes } from "../modules/admin/admin.route.js";
import { ServiceRoutes } from "../modules/service/service.route.js";
import { CardRoutes } from "../modules/card/card.route.js";
import { DashboardRoutes } from "../modules/dashboard/dashboard.route.js";
import { PublicRoutes } from "../modules/public/public.route.js";

const router = express.Router();

const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  { path: "/users", route: UserRoutes },
  { path: "/wallets", route: WalletRoutes },
  { path: "/transactions", route: TransactionRoutes },
  { path: "/system-config", route: SystemConfigRoutes },
  { path: "/agent", route: AgentRoutes },
  { path: "/admin", route: AdminRoutes },
  { path: "/services", route: ServiceRoutes },
  { path: "/cards", route: CardRoutes },
  { path: "/dashboard", route: DashboardRoutes },
  { path: "/public", route: PublicRoutes },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
