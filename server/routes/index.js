import { Router } from 'express';
import authRoutes from './auth.js';
import listingsRoutes from './listings.js';
import transactionsRoutes from './transactions.js';
import ordersRoutes from './orders.js';
import cartRoutes from './cart.js';
import refundsRoutes from './refunds.js';
import settingsRoutes from './settings.js';
import adminRoutes from './admin.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/listings', listingsRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/orders', ordersRoutes);
router.use('/cart', cartRoutes);
router.use('/refunds', refundsRoutes);
router.use('/settings', settingsRoutes);
router.use('/admin', adminRoutes);

export default router;
