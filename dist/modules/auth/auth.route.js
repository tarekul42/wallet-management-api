"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = require("express");
const checkAuth_1 = __importDefault(require("../../middlewares/checkAuth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const user_interface_1 = require("../user/user.interface");
const auth_controller_1 = require("./auth.controller");
const auth_validation_1 = require("./auth.validation");
const router = (0, express_1.Router)();
router.post("/register", (0, validateRequest_1.default)(auth_validation_1.AuthValidations.registerUserValidationSchema), auth_controller_1.AuthControllers.registerUser);
router.get("/verify-email", auth_controller_1.AuthControllers.verifyEmail);
router.post("/login", (0, validateRequest_1.default)(auth_validation_1.AuthValidations.loginUserValidationSchema), auth_controller_1.AuthControllers.credentialsLogin);
router.post("/logout", (0, checkAuth_1.default)(user_interface_1.Role.USER, user_interface_1.Role.AGENT, user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), auth_controller_1.AuthControllers.logoutUser);
router.post("/refresh-token", auth_controller_1.AuthControllers.getNewAccessToken);
exports.AuthRoutes = router;
