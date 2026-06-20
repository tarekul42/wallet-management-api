import { Router } from "express";
import { ServiceControllers } from "./service.controller";
import checkAuth from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router = Router();

router.get("/", ServiceControllers.getAll);
router.get("/categories", ServiceControllers.getCategories);
router.get("/my-purchases", checkAuth(Role.USER), ServiceControllers.getMyPurchases);
router.get("/:id", ServiceControllers.getById);
router.get("/:id/related", ServiceControllers.getRelated);
router.post("/:id/purchase", checkAuth(Role.USER), ServiceControllers.purchase);

export const ServiceRoutes = router;
