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

const router = Router();

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
