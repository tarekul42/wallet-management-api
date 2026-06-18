import { Router } from "express";
import { DashboardControllers } from "./dashboard.controller";
import checkAuth from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router = Router();

router.get(
  "/spending-overview",
  checkAuth(Role.USER, Role.AGENT, Role.ADMIN, Role.SUPER_ADMIN),
  DashboardControllers.getSpendingOverview,
);

export const DashboardRoutes = router;
