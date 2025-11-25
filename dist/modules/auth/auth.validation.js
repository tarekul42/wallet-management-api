"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthValidations = void 0;
const zod_1 = require("zod");
const user_interface_1 = require("../user/user.interface");
const registerUserValidationSchema = zod_1.z
    .object({
    name: zod_1.z
        .string()
        .min(2, { message: "Name must be at least 2 characters long." })
        .max(50, { message: "Name cannot exceed 50 characters." })
        .trim(),
    email: zod_1.z
        .string()
        .email({ message: "Invalid email address format." })
        .min(5, { message: "Email must be at least 5 characters long." })
        .max(100, { message: "Email cannot exceed 100 characters." })
        .trim(),
    password: zod_1.z
        .string()
        .min(6, { message: "Password must be at least 6 characters long." })
        .max(25, { message: "Password cannot exceed 25 characters." })
        .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={[}\]:;"'`~<>,.?/\\-]).{6,}$/, {
        message: "Password must include an uppercase letter, a number, and a special character.",
    }),
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
        .regex(/^\d+$/, { message: "NID must contain only digits" }),
    role: zod_1.z.enum(Object.values(user_interface_1.Role)).optional(),
    isActive: zod_1.z
        .enum(Object.values(user_interface_1.IsActive))
        .optional(),
    confirmPassword: zod_1.z.string().optional(),
    commissionRate: zod_1.z.undefined(),
    approvalStatus: zod_1.z.undefined(),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Password and confirm password must match",
    path: ["confirmPassword"],
});
const loginUserValidationSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email({ message: "Invalid email address format." })
        .refine((value) => value !== "", {
        message: "Email is required",
        path: ["email"],
    }),
    password: zod_1.z.string().refine((value) => value !== "", {
        message: "Password is required",
        path: ["password"],
    }),
});
const verifyEmailValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string().min(1, "Verification token is required"),
    }),
});
const forgotPasswordValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().min(1, "Email is required").email("Invalid email address"),
    }),
});
const resetPasswordValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string().min(1, "Token is required"),
        newPassword: zod_1.z
            .string()
            .min(6, "Password must be at least 6 characters long"),
    }),
});
exports.AuthValidations = {
    registerUserValidationSchema,
    loginUserValidationSchema,
    verifyEmailValidationSchema,
    forgotPasswordValidationSchema,
    resetPasswordValidationSchema,
};
