"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_interface_1 = require("../user/user.interface");
const transaction_controller_1 = require("./transaction.controller");
const checkAuth_1 = __importDefault(require("../../middlewares/checkAuth"));
const transaction_validation_1 = require("./transaction.validation");
const validateRequest_1 = require("../../middlewares/validateRequest");
const router = express_1.default.Router();
router.post("/send-money", (0, checkAuth_1.default)(user_interface_1.Role.USER), (0, validateRequest_1.validateRequest)(transaction_validation_1.sendMoneyValidationSchema), transaction_controller_1.TransactionControllers.sendMoney);
router.post("/add-money", (0, checkAuth_1.default)(user_interface_1.Role.USER, user_interface_1.Role.AGENT), (0, validateRequest_1.validateRequest)(transaction_validation_1.addMoneyValidationSchema), transaction_controller_1.TransactionControllers.addMoney);
router.post("/withdraw-money", (0, checkAuth_1.default)(user_interface_1.Role.USER, user_interface_1.Role.AGENT), (0, validateRequest_1.validateRequest)(transaction_validation_1.withdrawMoneyValidationSchema), transaction_controller_1.TransactionControllers.withdrawMoney);
router.get("/history", (0, checkAuth_1.default)(user_interface_1.Role.USER, user_interface_1.Role.AGENT, user_interface_1.Role.ADMIN), transaction_controller_1.TransactionControllers.viewHistory);
router.get("/get-commission-history", (0, checkAuth_1.default)(user_interface_1.Role.AGENT, user_interface_1.Role.ADMIN), transaction_controller_1.TransactionControllers.getCommissionHistory);
exports.TransactionRoutes = router;
