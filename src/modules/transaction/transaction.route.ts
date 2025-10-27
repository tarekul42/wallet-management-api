import express from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { TransactionControllers } from "./transaction.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { z } from "zod";

const router = express.Router();

const addMoneyValidationSchema = z.object({
  body: z.object({
    amount: z.number().positive("Amount must be a positive number."),
  }),
});

router.post(
  "/add-money",
  checkAuth(Role.USER),
  validateRequest(addMoneyValidationSchema),
  TransactionControllers.addMoneyTopUp,
);

const sendMoneyValidationSchema = z.object({
  body: z.object({
    amount: z.number().positive("Amount must be a positive number."),
    receiverPhone: z.string().min(1, "Receiver phone number is required."),
  }),
});

router.post(
  "/send-money",
  checkAuth(Role.USER),
  validateRequest(sendMoneyValidationSchema),
  TransactionControllers.sendMoney,
);

const withdrawMoneyValidationSchema = z.object({
  body: z.object({
    amount: z.number().positive("Amount must be a positive number."),
  }),
});

router.post(
  "/withdraw-money",
  checkAuth(Role.USER),
  validateRequest(withdrawMoneyValidationSchema),
  TransactionControllers.withdrawMoney,
);

router.get(
  "/history",
  checkAuth(Role.USER),
  TransactionControllers.getTransactionHistory,
);

export const TransactionRoutes = router;
