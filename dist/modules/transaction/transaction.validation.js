"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawMoneyValidationSchema = exports.addMoneyValidationSchema = exports.sendMoneyValidationSchema = void 0;
const zod_1 = require("zod");
const amountValidation = zod_1.z.coerce
    .number()
    .min(0.01, { message: "Amount must be at least 0.01." })
    .max(1000000, { message: "Amount cannot exceed 1,000,000." })
    .multipleOf(0.01, {
    message: "Amount must have at most two decimal places.",
});
const objectIdValidation = zod_1.z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid ID format." });
const sendMoneyValidationSchema = zod_1.z.object({
    amount: amountValidation,
    receiverEmail: zod_1.z.string().email("Invalid email address."),
});
exports.sendMoneyValidationSchema = sendMoneyValidationSchema;
const addMoneyValidationSchema = zod_1.z.object({
    amount: amountValidation,
    receiverId: objectIdValidation.optional(),
});
exports.addMoneyValidationSchema = addMoneyValidationSchema;
const withdrawMoneyValidationSchema = zod_1.z.object({
    amount: amountValidation,
    fromId: objectIdValidation.optional(),
});
exports.withdrawMoneyValidationSchema = withdrawMoneyValidationSchema;
