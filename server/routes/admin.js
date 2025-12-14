import { Router } from 'express';
import { adminController } from '../controllers/index.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/users', authenticateToken, isAdmin, adminController.getUsers);
router.put('/users/:id', authenticateToken, isAdmin, adminController.updateUser);
router.delete('/users/:id', authenticateToken, isAdmin, adminController.deleteUser);

router.get('/settings', authenticateToken, isAdmin, adminController.getSettings);
router.put('/settings', authenticateToken, isAdmin, adminController.updateSettings);

router.get('/listings', authenticateToken, isAdmin, adminController.getListings);
router.put('/listings/:id/approve', authenticateToken, isAdmin, adminController.approveListing);
router.put('/listings/:id/reject', authenticateToken, isAdmin, adminController.rejectListing);

router.get('/transactions', authenticateToken, isAdmin, adminController.getTransactions);

router.get('/refunds', authenticateToken, isAdmin, adminController.getRefunds);
router.put('/refunds/:id/approve', authenticateToken, isAdmin, adminController.approveRefund);
router.put('/refunds/:id/reject', authenticateToken, isAdmin, adminController.rejectRefund);

router.post('/upload-qr', authenticateToken, isAdmin, adminController.uploadQr);

export default router;
