"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConfigValidations = void 0;
const zod_1 = require("zod");
/**
 * Validation schema for updating system configuration
 * All fields are optional to allow partial updates
 */
const updateSystemConfigValidationSchema = zod_1.z.object({
    sendMoneyFee: zod_1.z
        .number()
        .min(0, "Send money fee must be at least 0")
        .max(100, "Send money fee cannot exceed 100")
        .optional(),
    cashInFee: zod_1.z
        .number()
        .min(0, "Cash in fee must be at least 0")
        .max(100, "Cash in fee cannot exceed 100")
        .optional(),
    withdrawFee: zod_1.z
        .number()
        .min(0, "Withdraw fee must be at least 0")
        .max(100, "Withdraw fee cannot exceed 100")
        .optional(),
    agentCommissionRate: zod_1.z
        .number()
        .min(0, "Agent commission rate must be at least 0")
        .max(100, "Agent commission rate cannot exceed 100")
        .optional(),
    dailyLimit: zod_1.z
        .number()
        .min(0, "Daily limit must be at least 0")
        .optional(),
    monthlyLimit: zod_1.z
        .number()
        .min(0, "Monthly limit must be at least 0")
        .optional(),
    minBalance: zod_1.z
        .number()
        .min(0, "Minimum balance must be at least 0")
        .optional(),
});
exports.SystemConfigValidations = {
    updateSystemConfigValidationSchema,
};
