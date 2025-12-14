import { Router } from 'express';
import { transactionController } from '../controllers/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, transactionController.getOrders);
router.get('/:listingId/card-details', authenticateToken, transactionController.getCardDetails);

export default router;
