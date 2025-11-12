import { z } from "zod";
import { ApprovalStatus, IsActive, Role } from "./user.interface";

export const createAdminZodSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z
    .string()
    .min(6)
    .regex(
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={[}\]:;"'`~<>,.?/\\-]).{6,}$/,
    ),
  role: z.enum([Role.ADMIN, Role.SUPER_ADMIN]),
});

export const updateUserZodSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." })
    .trim()
    .optional(),
  phone: z
    .string()
    .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
      message:
        "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
    })
    .optional(),
  address: z
    .string()
    .max(200, { message: "Address cannot exceed 200 characters." })
    .trim()
    .optional(),
  nid: z
    .string()
    .length(10, { message: "NID must be exactly 10 digits" })
    .regex(/^\d+$/, { message: "NID must contain only digits" })
    .optional(),
  role: z.enum(Object.values(Role) as [string, ...string[]]).optional(),
  isActive: z.enum(Object.values(IsActive) as [string, ...string[]]).optional(),
  isDeleted: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

export const updatePasswordZodSchema = z
  .object({
    oldPassword: z.string(),
    newPassword: z
      .string()
      .min(6)
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={[}\]:;"'`~<>,.?/\\-]).{6,}$/,
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Explicit schemas for agent status updates.
// - `suspendAgentZodSchema` ensures the request sets status to SUSPENDED.
// - `approveAgentZodSchema` ensures the request sets status to APPROVED.
// This avoids a dual-purpose schema that can be misleading about intent.
export const suspendAgentZodSchema = z.object({
  body: z.object({
    status: z.literal(ApprovalStatus.SUSPENDED),
  }),
});

export const approveAgentZodSchema = z.object({
  body: z.object({
    status: z.literal(ApprovalStatus.APPROVED),
  }),
});

export const agentApprovalZodSchema = z.object({
  approvalStatus: z.enum(
    Object.values(ApprovalStatus) as [string, ...string[]],
  ),
  commissionRate: z.number().positive().optional(),
});
