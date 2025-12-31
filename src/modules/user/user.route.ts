import { Router } from "express";
import { UserControllers } from "./user.controller";
import { Role } from "./user.interface";
import checkAuth from "../../middlewares/checkAuth";
import {
  agentApprovalZodSchema,
  createAdminZodSchema,
  updatePasswordZodSchema,
} from "./user.validation";
import validateRequest from "../../middlewares/validateRequest";
import rateLimit from "express-rate-limit";

const router = Router();

const createAdminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 create-admin requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

router.get(
  "/me",
  checkAuth(Role.USER, Role.ADMIN, Role.AGENT, Role.SUPER_ADMIN),
  UserControllers.getMyProfile,
);
router.patch(
  "/me",
  checkAuth(Role.USER, Role.ADMIN, Role.AGENT, Role.SUPER_ADMIN),
  UserControllers.updateMyProfile,
);

router.patch(
  "/me/update-password",
  checkAuth(Role.USER, Role.ADMIN, Role.AGENT, Role.SUPER_ADMIN),
  validateRequest(updatePasswordZodSchema),
  UserControllers.updatePassword,
);
  createAdminRateLimiter,

router.post(
  "/create-admin",
  checkAuth(Role.SUPER_ADMIN),
  validateRequest(createAdminZodSchema),
  UserControllers.createAdmin,
);

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.getAllUsers,
);
router.patch(
  "/:id/block",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.blockUser,
);
router.patch(
  "/:id/unblock",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.unblockUser,
);
router.patch(
  "/:id/approval",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(agentApprovalZodSchema),
  UserControllers.agentApprovalByAdmin,
);

export const UserRoutes = router;
