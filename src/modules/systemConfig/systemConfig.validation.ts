import { z } from "zod";

/**
 * Validation schema for updating system configuration
 * All fields are optional to allow partial updates
 */
const updateSystemConfigValidationSchema = z.object({
    sendMoneyFee: z
        .number()
        .min(0, "Send money fee must be at least 0")
        .max(100, "Send money fee cannot exceed 100")
        .optional(),
    cashInFee: z
        .number()
        .min(0, "Cash in fee must be at least 0")
        .max(100, "Cash in fee cannot exceed 100")
        .optional(),
    withdrawFee: z
        .number()
        .min(0, "Withdraw fee must be at least 0")
        .max(100, "Withdraw fee cannot exceed 100")
        .optional(),
    agentCommissionRate: z
        .number()
        .min(0, "Agent commission rate must be at least 0")
        .max(100, "Agent commission rate cannot exceed 100")
        .optional(),
    dailyLimit: z
        .number()
        .min(0, "Daily limit must be at least 0")
        .optional(),
    monthlyLimit: z
        .number()
        .min(0, "Monthly limit must be at least 0")
        .optional(),
    minBalance: z
        .number()
        .min(0, "Minimum balance must be at least 0")
        .optional(),
});

export const SystemConfigValidations = {
    updateSystemConfigValidationSchema,
};
