"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConfigRoutes = void 0;
const express_1 = require("express");
const user_interface_1 = require("../user/user.interface");
const checkAuth_1 = __importDefault(require("../../middlewares/checkAuth"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const systemConfig_controller_1 = require("./systemConfig.controller");
const systemConfig_validation_1 = require("./systemConfig.validation");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
const systemConfigUpdateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 update requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Get current system configuration
 * Public endpoint - anyone can view current settings
 */
router.get("/", systemConfig_controller_1.SystemConfigControllers.getSystemConfig);
/**
 * Update system configuration
 * Admin only - requires SUPER_ADMIN or ADMIN role
 */
router.patch("/", systemConfigUpdateLimiter, (0, checkAuth_1.default)(user_interface_1.Role.SUPER_ADMIN, user_interface_1.Role.ADMIN), (0, validateRequest_1.validateRequest)(systemConfig_validation_1.SystemConfigValidations.updateSystemConfigValidationSchema), systemConfig_controller_1.SystemConfigControllers.updateSystemConfig);
exports.SystemConfigRoutes = router;
