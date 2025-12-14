import { Router } from 'express';
import { listingController } from '../controllers/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', listingController.getAll);
router.get('/my', authenticateToken, listingController.getMy);
router.post('/', authenticateToken, listingController.create);
router.put('/:id', authenticateToken, listingController.update);
router.delete('/:id', authenticateToken, listingController.delete);
router.post('/:id/purchase', authenticateToken, listingController.purchase);

export default router;
