import { Router } from "express";
import { Role } from "../user/user.interface.js";
import checkAuth from "../../middlewares/checkAuth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { SystemConfigControllers } from "./systemConfig.controller.js";
import { SystemConfigValidations } from "./systemConfig.validation.js";
import { systemConfigUpdateLimiter } from "../../config/rateLimiter.js";

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
    systemConfigUpdateLimiter,
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    validateRequest(SystemConfigValidations.updateSystemConfigValidationSchema),
    SystemConfigControllers.updateSystemConfig,
);

export const SystemConfigRoutes = router;
