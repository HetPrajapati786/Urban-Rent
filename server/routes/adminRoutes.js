import express from 'express';
import {
    adminLogin,
    getDashboardStats,
    getAllProperties,
    approveProperty,
    rejectProperty,
    getAllUsers,
    getPropertyDetail,
    deleteUser,
    deleteProperty,
    verifyProperty,
    unverifyProperty,
    toggleUserStatus,
    impersonateUser,
    getAllApplications,
    updateApplicationStatus,
    getAllPayments,
    refundPayment,
    getAdminIncomeStats,
    getReactivationRequests,
    handleReactivationRequest,
} from '../controllers/adminController.js';
import { authenticateUser, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public admin route (no auth required)
router.post('/login', adminLogin);

// All routes below require admin role
router.use(authenticateUser, requireRole('admin'));

router.get('/stats', getDashboardStats);
router.get('/properties', getAllProperties);
router.get('/properties/:id', getPropertyDetail);
router.patch('/properties/:id/approve', approveProperty);
router.patch('/properties/:id/reject', rejectProperty);
router.patch('/properties/:id/verify', verifyProperty);
router.patch('/properties/:id/unverify', unverifyProperty);
router.delete('/properties/:id', deleteProperty);

router.get('/users', getAllUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.post('/users/:id/impersonate', impersonateUser);
router.delete('/users/:id', deleteUser);

router.get('/reactivation-requests', getReactivationRequests);
router.patch('/reactivation-requests/:userId/:requestId', handleReactivationRequest);

router.get('/applications', getAllApplications);
router.patch('/applications/:id/status', updateApplicationStatus);

router.get('/payments', getAllPayments);
router.patch('/payments/:id/refund', refundPayment);

router.get('/income', getAdminIncomeStats);

export default router;

