import { Router } from 'express';
import { transactionController } from '../controllers/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, transactionController.getCart);
router.post('/:transactionId/auto-check', authenticateToken, transactionController.autoCheck);

export default router;
