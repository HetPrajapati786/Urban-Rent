import express from 'express';
import {
    getMyInvoices,
    payInvoice,
    declineInvoice,
    getPaymentHistory,
    getManagerEarnings,
} from '../controllers/invoiceController.js';
import { authenticateUser, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get my invoices (tenant or manager)
router.get('/my', authenticateUser, getMyInvoices);

// Tenant pays an invoice
router.post('/:id/pay', authenticateUser, requireRole('tenant'), payInvoice);

// Tenant declines / gives up their invoice spot
router.post('/:id/decline', authenticateUser, requireRole('tenant'), declineInvoice);

// Payment history (both tenant and manager)
router.get('/payments/history', authenticateUser, getPaymentHistory);

// Manager earnings dashboard
router.get('/earnings', authenticateUser, requireRole('manager'), getManagerEarnings);

export default router;
