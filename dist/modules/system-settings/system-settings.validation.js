"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSystemSettingsZodSchema = void 0;
const zod_1 = require("zod");
exports.updateSystemSettingsZodSchema = zod_1.z.object({
    transactionFee: zod_1.z
        .number()
        .min(0, "Transaction fee cannot be negative")
        .optional(),
});
