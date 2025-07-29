import { Router } from "express";
import { getWallet } from "./wallet.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router = Router();

router.get("/me", checkAuth(...Object.values(Role)), getWallet);

export const WalletRoutes = router;