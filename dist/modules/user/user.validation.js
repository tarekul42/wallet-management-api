"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentApprovalZodSchema = exports.approveAgentZodSchema = exports.suspendAgentZodSchema = exports.updatePasswordZodSchema = exports.updateUserZodSchema = exports.createAdminZodSchema = void 0;
const zod_1 = require("zod");
const user_interface_1 = require("./user.interface");
exports.createAdminZodSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(50),
    email: zod_1.z.string().email(),
    password: zod_1.z
        .string()
        .min(6)
        .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={[}\]:;"'`~<>,.?/\\-]).{6,}$/),
    role: zod_1.z.enum([user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN]),
});
exports.updateUserZodSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(2, { message: "Name must be at least 2 characters long." })
        .max(50, { message: "Name cannot exceed 50 characters." })
        .trim()
        .optional(),
    phone: zod_1.z
        .string()
        .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
        message: "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
    })
        .optional(),
    address: zod_1.z
        .string()
        .max(200, { message: "Address cannot exceed 200 characters." })
        .trim()
        .optional(),
    nid: zod_1.z
        .string()
        .length(10, { message: "NID must be exactly 10 digits" })
        .regex(/^\d+$/, { message: "NID must contain only digits" })
        .optional(),
    role: zod_1.z.enum(Object.values(user_interface_1.Role)).optional(),
    isActive: zod_1.z.enum(Object.values(user_interface_1.IsActive)).optional(),
    isDeleted: zod_1.z.boolean().optional(),
    isVerified: zod_1.z.boolean().optional(),
});
exports.updatePasswordZodSchema = zod_1.z
    .object({
    oldPassword: zod_1.z.string(),
    newPassword: zod_1.z
        .string()
        .min(6)
        .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={[}\]:;"'`~<>,.?/\\-]).{6,}$/),
    confirmPassword: zod_1.z.string(),
})
    .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
// Explicit schemas for agent status updates.
// - `suspendAgentZodSchema` ensures the request sets status to SUSPENDED.
// - `approveAgentZodSchema` ensures the request sets status to APPROVED.
// This avoids a dual-purpose schema that can be misleading about intent.
exports.suspendAgentZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum([user_interface_1.ApprovalStatus.SUSPENDED]),
    }),
});
exports.approveAgentZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum([user_interface_1.ApprovalStatus.APPROVED]),
    }),
});
exports.agentApprovalZodSchema = zod_1.z.object({
    approvalStatus: zod_1.z.enum(Object.values(user_interface_1.ApprovalStatus)),
    commissionRate: zod_1.z.number().positive().optional(),
});
