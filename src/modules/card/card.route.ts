import { Router } from "express";
import rateLimit from "express-rate-limit";
import { CardControllers } from "./card.controller";
import checkAuth from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router = Router();

const cardRouteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get(
  "/",
  cardRouteLimiter,
  checkAuth(Role.USER, Role.AGENT, Role.ADMIN, Role.SUPER_ADMIN),
  CardControllers.getMyCards
);

export const CardRoutes = router;
