"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_route_1 = require("../modules/auth/auth.route");
const user_route_1 = require("../modules/user/user.route");
const wallet_route_1 = require("../modules/wallet/wallet.route");
const transaction_route_1 = require("../modules/transaction/transaction.route");
const systemConfig_route_1 = require("../modules/systemConfig/systemConfig.route");
const router = express_1.default.Router();
const moduleRoutes = [
    { path: "/auth", route: auth_route_1.AuthRoutes },
    { path: "/users", route: user_route_1.UserRoutes },
    { path: "/wallets", route: wallet_route_1.WalletRoutes },
    {
        path: "/transactions",
        route: transaction_route_1.TransactionRoutes,
    },
    {
        path: "/system-config",
        route: systemConfig_route_1.SystemConfigRoutes,
    },
];
moduleRoutes.forEach((route) => {
    router.use(route.path, route.route);
});
exports.default = router;
