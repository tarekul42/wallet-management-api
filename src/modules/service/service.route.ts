import { Router } from "express";
import rateLimit from "express-rate-limit";
import { ServiceControllers } from "./service.controller";
import checkAuth from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router = Router();

const purchaseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/", ServiceControllers.getAll);
router.get("/categories", ServiceControllers.getCategories);
router.get("/my-purchases", purchaseLimiter, checkAuth(Role.USER), ServiceControllers.getMyPurchases);
router.get("/:id", ServiceControllers.getById);
router.get("/:id/related", ServiceControllers.getRelated);
router.post("/:id/purchase", purchaseLimiter, checkAuth(Role.USER), ServiceControllers.purchase);

export const ServiceRoutes = router;
