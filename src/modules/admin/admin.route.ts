import { Router } from "express";
import { Role } from "../user/user.interface";
import { AdminControllers } from "./admin.controller";
import checkAuth from "../../middlewares/checkAuth";

const router = Router();

router.get(
  "/summary",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getSummary,
);

export const AdminRoutes = router;
