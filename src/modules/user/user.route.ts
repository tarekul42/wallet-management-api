import { Router } from "express";
import { UserControllers } from "./user.controller.js";
import { Role } from "./user.interface.js";
import checkAuth from "../../middlewares/checkAuth.js";
import {
  agentApprovalZodSchema,
  createAdminZodSchema,
  suspendAgentZodSchema,
  updatePasswordZodSchema,
  updateUserZodSchema,
} from "./user.validation.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { adminActionLimiter, selfActionLimiter } from "../../config/rateLimiter.js";

const router = Router();

router.get(
  "/me",
  selfActionLimiter,
  checkAuth(Role.USER, Role.ADMIN, Role.AGENT, Role.SUPER_ADMIN),
  UserControllers.getMyProfile
);
router.get(
  "/",
  adminActionLimiter,
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.getAllUsers
);

router.patch(
  "/me",
  selfActionLimiter,
  checkAuth(Role.USER, Role.ADMIN, Role.AGENT, Role.SUPER_ADMIN),
  validateRequest(updateUserZodSchema),
  UserControllers.updateMyProfile
);

router.patch(
  "/me/update-password",
  selfActionLimiter,
  checkAuth(Role.USER, Role.ADMIN, Role.AGENT, Role.SUPER_ADMIN),
  validateRequest(updatePasswordZodSchema),
  UserControllers.updatePassword
);

router.post(
  "/create-admin",
  adminActionLimiter,
  checkAuth(Role.SUPER_ADMIN),
  validateRequest(createAdminZodSchema),
  UserControllers.createAdmin
);

router.patch(
  "/:id/block",
  adminActionLimiter,
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.blockUser
);

router.patch(
  "/:id/unblock",
  adminActionLimiter,
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.unblockUser
);

router.patch(
  "/:id/approval",
  adminActionLimiter,
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(agentApprovalZodSchema),
  UserControllers.agentApprovalByAdmin
);

router.patch(
  "/:id/suspend",
  adminActionLimiter,
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(suspendAgentZodSchema),
  UserControllers.suspendAgent
);

export const UserRoutes = router;
