import { Router } from "express";
import { UserControllers } from "./user.controller";
import { Role } from "./user.interface";
import checkAuth from "../../middlewares/checkAuth";
import {
  agentApprovalZodSchema,
  createAdminZodSchema,
  suspendAgentZodSchema,
  updatePasswordZodSchema,
} from "./user.validation";
import { validateRequest } from "../../middlewares/validateRequest";
import rateLimit from "express-rate-limit";

const router = Router();

const adminActionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 admin requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

const selfActionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 self-service requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

router.get(
  "/me",
  checkAuth(Role.USER, Role.ADMIN, Role.AGENT, Role.SUPER_ADMIN),
  selfActionLimiter,
  UserControllers.getMyProfile,
);
router.patch(
  "/me",
  checkAuth(Role.USER, Role.ADMIN, Role.AGENT, Role.SUPER_ADMIN),
  selfActionLimiter,
  selfActionLimiter,
  UserControllers.updateMyProfile,
);
  adminActionLimiter,

  adminActionLimiter,
router.patch(
  "/me/update-password",
  checkAuth(Role.USER, Role.ADMIN, Role.AGENT, Role.SUPER_ADMIN),
  validateRequest(updatePasswordZodSchema),
  UserControllers.updatePassword,
  adminActionLimiter,
);

router.post(
  "/create-admin",
  checkAuth(Role.SUPER_ADMIN),
  adminActionLimiter,
  validateRequest(createAdminZodSchema),
  UserControllers.createAdmin,
);

router.get(
  "/",
  adminActionLimiter,
  adminActionLimiter,
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

router.patch(
  "/:id/suspend",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(suspendAgentZodSchema),
  UserControllers.suspendAgent,
);

export const UserRoutes = router;
