"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletRoutes = void 0;
const express_1 = require("express");
const user_interface_1 = require("../user/user.interface");
const wallet_controller_1 = require("./wallet.controller");
const checkAuth_1 = __importDefault(require("../../middlewares/checkAuth"));
const rateLimiter_1 = require("../../config/rateLimiter");
const router = (0, express_1.Router)();
router.get("/me", rateLimiter_1.walletActionLimiter, (0, checkAuth_1.default)(user_interface_1.Role.USER, user_interface_1.Role.AGENT, user_interface_1.Role.SUPER_ADMIN), wallet_controller_1.WalletControllers.getMyWallet);
router.get("/", rateLimiter_1.walletActionLimiter, (0, checkAuth_1.default)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), wallet_controller_1.WalletControllers.getAllWallets);
router.get("/:id", rateLimiter_1.walletActionLimiter, (0, checkAuth_1.default)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), wallet_controller_1.WalletControllers.getSingleWallet);
router.patch("/:id/block", rateLimiter_1.walletActionLimiter, (0, checkAuth_1.default)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), wallet_controller_1.WalletControllers.blockWallet);
router.patch("/:id/unblock", rateLimiter_1.walletActionLimiter, (0, checkAuth_1.default)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), wallet_controller_1.WalletControllers.unblockWallet);
exports.WalletRoutes = router;
