import { z } from "zod";

const registerUserValidationSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: "Name is required",
    }),
    email: z
      .string({
        required_error: "Email is required",
      })
      .email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    role: z.enum(["user", "agent"], {
      required_error: "Role is required",
      invalid_type_error: "Role must be either user or agent",
    }),
  }),
});

export const AuthValidations = {
  registerUserValidationSchema,
};
