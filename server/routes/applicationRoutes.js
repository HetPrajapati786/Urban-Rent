import express from 'express';
import {
    createApplication,
    getMyApplications,
    respondToApplication,
    withdrawApplication,
    waitlistApplication,
} from '../controllers/applicationController.js';
import { requestTermination, processTermination, previewTermination } from '../controllers/terminationController.js';
import { authenticateUser, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Tenant creates an application
router.post('/', authenticateUser, requireRole('tenant'), createApplication);

// Get my applications (works for both tenant and manager)
router.get('/my', authenticateUser, getMyApplications);

// Manager responds to an application
router.patch('/:id/respond', authenticateUser, requireRole('manager'), respondToApplication);

// Tenant withdraws an application
router.patch('/:id/withdraw', authenticateUser, requireRole('tenant'), withdrawApplication);

// Manager puts an applicant on the waitlist
router.patch('/:id/waitlist', authenticateUser, requireRole('manager'), waitlistApplication);

// Early termination routes
router.post('/:id/terminate/request', authenticateUser, requestTermination);
router.get('/:id/terminate/preview', authenticateUser, requireRole('manager'), previewTermination);
router.post('/:id/terminate/process', authenticateUser, requireRole('manager'), processTermination);

export default router;
