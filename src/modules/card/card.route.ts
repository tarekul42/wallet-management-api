import { Router } from "express";
import { CardControllers } from "./card.controller";
import checkAuth from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router = Router();

router.get("/", checkAuth(Role.USER, Role.AGENT, Role.ADMIN, Role.SUPER_ADMIN), CardControllers.getMyCards);

export const CardRoutes = router;
