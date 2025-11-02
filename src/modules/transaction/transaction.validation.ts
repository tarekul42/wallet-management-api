import { z } from 'zod';

export const cashInValidationSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be a positive number.'),
    userId: z.string().min(1, 'User ID is required.'),
  }),
});
