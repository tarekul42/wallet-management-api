"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const user_interface_1 = require("./user.interface");
const checkAuth_1 = __importDefault(require("../../middlewares/checkAuth"));
const user_validation_1 = require("./user.validation");
const validateRequest_1 = require("../../middlewares/validateRequest");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
const adminActionLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 admin requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
const selfActionLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // limit each IP to 60 self-service requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
router.get("/me", (0, checkAuth_1.default)(user_interface_1.Role.USER, user_interface_1.Role.ADMIN, user_interface_1.Role.AGENT, user_interface_1.Role.SUPER_ADMIN), selfActionLimiter, user_controller_1.UserControllers.getMyProfile);
router.patch("/me", (0, checkAuth_1.default)(user_interface_1.Role.USER, user_interface_1.Role.ADMIN, user_interface_1.Role.AGENT, user_interface_1.Role.SUPER_ADMIN), selfActionLimiter, user_controller_1.UserControllers.updateMyProfile);
router.patch("/me/update-password", (0, checkAuth_1.default)(user_interface_1.Role.USER, user_interface_1.Role.ADMIN, user_interface_1.Role.AGENT, user_interface_1.Role.SUPER_ADMIN), (0, validateRequest_1.validateRequest)(user_validation_1.updatePasswordZodSchema), user_controller_1.UserControllers.updatePassword);
router.post("/create-admin", (0, checkAuth_1.default)(user_interface_1.Role.SUPER_ADMIN), adminActionLimiter, (0, validateRequest_1.validateRequest)(user_validation_1.createAdminZodSchema), user_controller_1.UserControllers.createAdmin);
router.get("/", adminActionLimiter, (0, checkAuth_1.default)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), user_controller_1.UserControllers.getAllUsers);
router.patch("/:id/block", (0, checkAuth_1.default)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), user_controller_1.UserControllers.blockUser);
router.patch("/:id/unblock", (0, checkAuth_1.default)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), user_controller_1.UserControllers.unblockUser);
router.patch("/:id/approval", (0, checkAuth_1.default)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), (0, validateRequest_1.validateRequest)(user_validation_1.agentApprovalZodSchema), user_controller_1.UserControllers.agentApprovalByAdmin);
router.patch("/:id/suspend", (0, checkAuth_1.default)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), (0, validateRequest_1.validateRequest)(user_validation_1.suspendAgentZodSchema), user_controller_1.UserControllers.suspendAgent);
exports.UserRoutes = router;
