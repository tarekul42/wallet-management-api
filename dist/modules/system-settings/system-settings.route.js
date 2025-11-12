"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemSettingsRoutes = void 0;
const express_1 = require("express");
const user_interface_1 = require("../user/user.interface");
const checkAuth_1 = __importDefault(require("../../middlewares/checkAuth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const system_settings_controller_1 = require("./system-settings.controller");
const system_settings_validation_1 = require("./system-settings.validation");
const router = (0, express_1.Router)();
router.get("/", (0, checkAuth_1.default)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), system_settings_controller_1.SystemSettingsControllers.getSystemSettings);
router.patch("/", (0, checkAuth_1.default)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), (0, validateRequest_1.default)(system_settings_validation_1.updateSystemSettingsZodSchema), system_settings_controller_1.SystemSettingsControllers.updateSystemSettings);
exports.SystemSettingsRoutes = router;
