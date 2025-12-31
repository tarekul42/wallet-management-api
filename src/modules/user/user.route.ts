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
import { adminActionLimiter, selfActionLimiter } from "../../config/rateLimiter";

const router = Router();


router.get(
  "/me",
  selfActionLimiter,
  checkAuth(Role.USER, Role.ADMIN, Role.AGENT, Role.SUPER_ADMIN),
  UserControllers.getMyProfile,
);
router.patch(
  "/me",
  selfActionLimiter,
  checkAuth(Role.USER, Role.ADMIN, Role.AGENT, Role.SUPER_ADMIN),
  UserControllers.updateMyProfile,
);

router.patch(
  "/me/update-password",
  selfActionLimiter,
  checkAuth(Role.USER, Role.ADMIN, Role.AGENT, Role.SUPER_ADMIN),
  validateRequest(updatePasswordZodSchema),
  UserControllers.updatePassword,
);

router.post(
  "/create-admin",
  adminActionLimiter,
  checkAuth(Role.SUPER_ADMIN),
  validateRequest(createAdminZodSchema),
  UserControllers.createAdmin,
);

router.get(
  "/",
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
