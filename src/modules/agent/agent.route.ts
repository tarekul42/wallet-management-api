import { Router } from "express";
import { Role } from "../user/user.interface";
import { AgentControllers } from "./agent.controller";
import checkAuth from "../../middlewares/checkAuth";

const router = Router();

router.get(
  "/summary",
  checkAuth(Role.AGENT, Role.ADMIN, Role.SUPER_ADMIN),
  AgentControllers.getSummary,
);

export const AgentRoutes = router;
