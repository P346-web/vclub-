import { Router } from 'express';
import { refundController } from '../controllers/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/my', authenticateToken, refundController.getMy);

export default router;
