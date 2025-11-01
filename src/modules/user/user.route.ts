import { Router } from "express";
import { UserControllers } from "./user.controller";
import { Role } from "./user.interface";
import checkAuth from "../../middlewares/checkAuth";
import { agentApprovalZodSchema } from "./user.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = Router();

// Authenticated users can get and update their own profile
router.get(
  "/me",
  checkAuth(Role.USER, Role.ADMIN, Role.AGENT),
  UserControllers.getMyProfile,
);
router.patch(
  "/me",
  checkAuth(Role.USER, Role.ADMIN, Role.AGENT),
  UserControllers.updateMyProfile,
);

// Admin endpoints
router.get("/", checkAuth(Role.ADMIN), UserControllers.getAllUsers);
router.patch("/:id/block", checkAuth(Role.ADMIN), UserControllers.blockUser);
router.patch(
  "/:id/unblock",
  checkAuth(Role.ADMIN),
  UserControllers.unblockUser,
);
router.patch(
  "/:id/approval",
  checkAuth(Role.ADMIN),
  validateRequest(agentApprovalZodSchema),
  UserControllers.agentApprovalByAdmin,
);

export const UserRoutes = router;
