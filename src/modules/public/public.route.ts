import { Router } from "express";
import { PublicControllers } from "./public.controller";

const router = Router();

router.get("/stats", PublicControllers.getStats);

export const PublicRoutes = router;
