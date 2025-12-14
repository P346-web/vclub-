import { Router } from 'express';
import { transactionController } from '../controllers/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, transactionController.getAll);
router.post('/:id/refund', authenticateToken, transactionController.requestRefund);

export default router;
