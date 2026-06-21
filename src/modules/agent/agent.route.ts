import { Router } from "express";
import rateLimit from "express-rate-limit";
import { Role } from "../user/user.interface.js";
import { AgentControllers } from "./agent.controller.js";
import checkAuth from "../../middlewares/checkAuth.js";

const router = Router();

const summaryRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

router.get(
  "/summary",
  summaryRateLimiter,
  checkAuth(Role.AGENT, Role.ADMIN, Role.SUPER_ADMIN),
  AgentControllers.getSummary,
);

export const AgentRoutes = router;
