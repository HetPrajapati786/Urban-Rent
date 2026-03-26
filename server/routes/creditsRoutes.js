import express from 'express';
import { getCreditsBalance, purchaseCredits, getCreditPackages, getCreditHistory } from '../controllers/creditsController.js';
import { authenticateUser, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require auth + manager role
router.get('/balance', authenticateUser, requireRole('manager'), getCreditsBalance);
router.get('/packages', authenticateUser, requireRole('manager'), getCreditPackages);
router.post('/purchase', authenticateUser, requireRole('manager'), purchaseCredits);
router.get('/history', authenticateUser, requireRole('manager'), getCreditHistory);

export default router;
