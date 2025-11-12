import { z } from "zod";

const amountValidation = z.coerce
  .number()
  .min(0.01, { message: "Amount must be at least 0.01." })
  .max(1000000, { message: "Amount cannot exceed 1,000,000." })
  .multipleOf(0.01, {
    message: "Amount must have at most two decimal places.",
  });

const objectIdValidation = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid ID format." });

const sendMoneyValidationSchema = z.object({
  body: z.object({
    amount: amountValidation,
    receiverEmail: z.string().email("Invalid email address."),
  }),
});

const addMoneyValidationSchema = z.object({
  amount: amountValidation,
  receiverId: objectIdValidation.optional(),
});

const withdrawMoneyValidationSchema = z.object({
  body: z.object({
    amount: amountValidation,
    fromId: objectIdValidation.optional(),
  }),
});

export {
  sendMoneyValidationSchema,
  addMoneyValidationSchema,
  withdrawMoneyValidationSchema,
};
