import express from "express";
import { Role } from "../user/user.interface.js";
import { TransactionControllers } from "./transaction.controller.js";
import checkAuth from "../../middlewares/checkAuth.js";
import {
  addMoneyValidationSchema,
  sendMoneyValidationSchema,
  withdrawMoneyValidationSchema,
} from "./transaction.validation.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { transactionRateLimiter } from "../../config/rateLimiter.js";

const router = express.Router();

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
