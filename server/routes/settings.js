import { Router } from 'express';
import { settingsController } from '../controllers/index.js';

const router = Router();

router.get('/public', settingsController.getPublic);

export default router;
