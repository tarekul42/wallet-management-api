import { Router } from "express";
import rateLimit from "express-rate-limit";
import { DashboardControllers } from "./dashboard.controller";
import checkAuth from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router = Router();

const dashboardOverviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

router.get(
  "/spending-overview",
  dashboardOverviewLimiter,
  checkAuth(Role.USER, Role.AGENT, Role.ADMIN, Role.SUPER_ADMIN),
  DashboardControllers.getSpendingOverview,
);

export const DashboardRoutes = router;
