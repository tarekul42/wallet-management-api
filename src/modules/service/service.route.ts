import { Router } from "express";
import { ServiceControllers } from "./service.controller";

const router = Router();

router.get("/", ServiceControllers.getAll);
router.get("/categories", ServiceControllers.getCategories);
router.get("/:id", ServiceControllers.getById);
router.get("/:id/related", ServiceControllers.getRelated);

export const ServiceRoutes = router;
