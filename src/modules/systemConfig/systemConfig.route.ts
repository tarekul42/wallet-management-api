import { Router } from "express";
import { Role } from "../user/user.interface";
import checkAuth from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { SystemConfigControllers } from "./systemConfig.controller";
import { SystemConfigValidations } from "./systemConfig.validation";

const router = Router();

/**
 * Get current system configuration
 * Public endpoint - anyone can view current settings
 */
router.get("/", SystemConfigControllers.getSystemConfig);

/**
 * Update system configuration
 * Admin only - requires SUPER_ADMIN or ADMIN role
 */
router.patch(
    "/",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    validateRequest(SystemConfigValidations.updateSystemConfigValidationSchema),
    SystemConfigControllers.updateSystemConfig,
);

export const SystemConfigRoutes = router;
