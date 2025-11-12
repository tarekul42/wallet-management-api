"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawMoneyValidationSchema = exports.addMoneyValidationSchema = exports.sendMoneyValidationSchema = void 0;
const zod_1 = require("zod");
const sendMoneyValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z.number().positive("Amount must be a positive number."),
        receiverEmail: zod_1.z.string().email("Invalid email address."),
    }),
});
exports.sendMoneyValidationSchema = sendMoneyValidationSchema;
const addMoneyValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z.number().positive("Amount must be a positive number."),
        receiverId: zod_1.z.string().optional(),
    }),
});
exports.addMoneyValidationSchema = addMoneyValidationSchema;
const withdrawMoneyValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z.number().positive("Amount must be a positive number."),
        fromId: zod_1.z.string().optional(),
    }),
});
exports.withdrawMoneyValidationSchema = withdrawMoneyValidationSchema;
