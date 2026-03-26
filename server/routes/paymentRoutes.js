import express from 'express';
import { createRazorpayOrder } from '../controllers/paymentController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Order creation route
router.post('/razorpay/order', authenticateUser, createRazorpayOrder);

export default router;
