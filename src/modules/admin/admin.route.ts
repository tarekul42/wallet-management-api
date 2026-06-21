import { Router } from "express";
import rateLimit from "express-rate-limit";
import { Role } from "../user/user.interface";
import { AdminControllers } from "./admin.controller";
import checkAuth from "../../middlewares/checkAuth";

const router = Router();

const adminSummaryRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
});

router.get(
  "/summary",
  adminSummaryRateLimiter,
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getSummary,
);

export const AdminRoutes = router;
