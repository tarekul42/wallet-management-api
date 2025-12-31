import express from "express";
import { Role } from "../user/user.interface";
import { TransactionControllers } from "./transaction.controller";
import checkAuth from "../../middlewares/checkAuth";
import {
  addMoneyValidationSchema,
  sendMoneyValidationSchema,
  withdrawMoneyValidationSchema,
} from "./transaction.validation";
import { validateRequest } from "../../middlewares/validateRequest";
import rateLimit from "express-rate-limit";

const router = express.Router();

const transactionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window per transaction routes
});

router.use(transactionRateLimiter);

router.post(
  "/send-money",
  checkAuth(Role.USER),
  validateRequest(sendMoneyValidationSchema),
  TransactionControllers.sendMoney,
);

router.post(
  "/add-money",
  checkAuth(Role.USER, Role.AGENT),
  validateRequest(addMoneyValidationSchema),
  TransactionControllers.addMoney,
);

router.post(
  "/withdraw-money",
  checkAuth(Role.USER, Role.AGENT),
  validateRequest(withdrawMoneyValidationSchema),
  TransactionControllers.withdrawMoney,
);

router.get(
  "/history",
  checkAuth(Role.USER, Role.AGENT, Role.ADMIN),
  TransactionControllers.viewHistory,
);

router.get(
  "/get-commission-history",
  checkAuth(Role.AGENT, Role.ADMIN),
  TransactionControllers.getCommissionHistory,
);

export const TransactionRoutes = router;
