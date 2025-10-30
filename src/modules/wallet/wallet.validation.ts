import { z } from "zod";

const addMoneyTopUpValidationSchema = z.object({
  body: z.object({
    amount: z
      .number({
        required_error: "Amount is required",
        invalid_type_error: "Amount must be a number",
      })
      .positive("Amount must be a positive number"),
  }),
});

const withdrawMoneyValidationSchema = z.object({
  body: z.object({
    amount: z
      .number({
        required_error: "Amount is required",
        invalid_type_error: "Amount must be a number",
      })
      .positive("Amount must be a positive number"),
  }),
});

const sendMoneyValidationSchema = z.object({
  body: z.object({
    receiverEmail: z.string().email("Invalid receiver email address"),
    amount: z
      .number({
        required_error: "Amount is required",
        invalid_type_error: "Amount must be a number",
      })
      .positive("Amount must be a positive number"),
  }),
});

export const WalletValidations = {
  addMoneyTopUpValidationSchema,
  withdrawMoneyValidationSchema,
  sendMoneyValidationSchema,
};
