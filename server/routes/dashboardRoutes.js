import express from 'express';
import { getManagerDashboard } from '../controllers/dashboardController.js';
import { authenticateUser, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Manager dashboard data
router.get('/manager', authenticateUser, requireRole('manager'), getManagerDashboard);

export default router;
