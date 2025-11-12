import { z } from "zod";
import { IsActive, Role } from "../user/user.interface";

const registerUserValidationSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters long." })
      .max(50, { message: "Name cannot exceed 50 characters." })
      .trim(),
    email: z
      .string()
      .email({ message: "Invalid email address format." })
      .min(5, { message: "Email must be at least 5 characters long." })
      .max(100, { message: "Email cannot exceed 100 characters." })
      .trim(),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters long." })
      .max(25, { message: "Password cannot exceed 25 characters." })
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={[}\]:;"'`~<>,.?/\\-]).{6,}$/,
        {
          message:
            "Password must include an uppercase letter, a number, and a special character.",
        },
      ),
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
      .regex(/^\d+$/, { message: "NID must contain only digits" }),
    role: z.enum(Object.values(Role) as [string, ...string[]]).optional(),
    isActive: z
      .enum(Object.values(IsActive) as [string, ...string[]])
      .optional(),
    confirmPassword: z.string().optional(),
    commissionRate: z.undefined(),
    approvalStatus: z.undefined(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password and confirm password must match",
    path: ["confirmPassword"],
  });

const loginUserValidationSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email address format." })
    .refine((value) => value !== "", {
      message: "Email is required",
      path: ["email"],
    }),
  password: z.string().refine((value) => value !== "", {
    message: "Password is required",
    path: ["password"],
  }),
});

export const AuthValidations = {
  registerUserValidationSchema,
  loginUserValidationSchema,
};
