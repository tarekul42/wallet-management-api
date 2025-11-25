"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndUpdateTransactionLimits = void 0;
const http_status_codes_1 = require("http-status-codes");
const date_fns_1 = require("date-fns");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const user_model_1 = require("../user/user.model");
const systemConfig_service_1 = require("../systemConfig/systemConfig.service");
/**
 * Check if user has exceeded daily or monthly transaction limits
 * Automatically resets limits if a new day/month has started
 *
 * @param userId - ID of the user performing the transaction
 * @param amount - Amount to be transacted
 * @throws AppError if limit is exceeded
 */
const checkAndUpdateTransactionLimits = (userId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    const config = yield systemConfig_service_1.SystemConfigServices.getSystemConfig();
    const now = new Date();
    const todayStart = (0, date_fns_1.startOfDay)(now);
    const monthStart = (0, date_fns_1.startOfMonth)(now);
    // Reset daily total if it's a new day
    if (!user.lastDailyReset ||
        new Date(user.lastDailyReset) < todayStart) {
        user.dailyTransactionTotal = 0;
        user.lastDailyReset = now;
    }
    // Reset monthly total if it's a new month
    if (!user.lastMonthlyReset ||
        new Date(user.lastMonthlyReset) < monthStart) {
        user.monthlyTransactionTotal = 0;
        user.lastMonthlyReset = now;
    }
    // Check daily limit
    const newDailyTotal = (user.dailyTransactionTotal || 0) + amount;
    if (newDailyTotal > config.dailyLimit) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Daily transaction limit exceeded. Limit: ৳${config.dailyLimit}, Current: ৳${user.dailyTransactionTotal}, Attempted: ৳${amount}`);
    }
    // Check monthly limit
    const newMonthlyTotal = (user.monthlyTransactionTotal || 0) + amount;
    if (newMonthlyTotal > config.monthlyLimit) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Monthly transaction limit exceeded. Limit: ৳${config.monthlyLimit}, Current: ৳${user.monthlyTransactionTotal}, Attempted: ৳${amount}`);
    }
    // Update totals
    user.dailyTransactionTotal = newDailyTotal;
    user.monthlyTransactionTotal = newMonthlyTotal;
    yield user.save();
});
exports.checkAndUpdateTransactionLimits = checkAndUpdateTransactionLimits;
