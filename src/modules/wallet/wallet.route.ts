import { Router } from 'express';
import { getWallet } from './wallet.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { Role } from '../user/user.interface';

const router = Router();

// Only authenticated users (any role) can view their wallet
router.get('/me', checkAuth(...Object.values(Role)), getWallet);

export const WalletRoutes = router;

// Wallet Routes
// ...implementation will be added...
