import { Router } from "express";
import {
  getProfile,
  updateProfile,
  getUsers,
  blockUserController,
  unblockUserController,
} from "./user.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "./user.interface";

const router = Router();

// Authenticated users can get and update their own profile
router.get("/me", checkAuth(...Object.values(Role)), getProfile);
router.patch("/me", checkAuth(...Object.values(Role)), updateProfile);

// Admin endpoints
router.get("/", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), getUsers);
router.patch("/:id/block", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), blockUserController);
router.patch("/:id/unblock", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), unblockUserController);

export const UserRoutes = router;
