import { Router } from "express";
import { Role } from "../user/user.interface";
import checkAuth from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { SystemConfigControllers } from "./systemConfig.controller";
import { SystemConfigValidations } from "./systemConfig.validation";
import rateLimit from "express-rate-limit";

const router = Router();

const systemConfigUpdateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 update requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Get current system configuration
 * Public endpoint - anyone can view current settings
 */
router.get("/", SystemConfigControllers.getSystemConfig);

/**
 * Update system configuration
 * Admin only - requires SUPER_ADMIN or ADMIN role
 */
    systemConfigUpdateLimiter,
router.patch(
    "/",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    validateRequest(SystemConfigValidations.updateSystemConfigValidationSchema),
    SystemConfigControllers.updateSystemConfig,
);

export const SystemConfigRoutes = router;
