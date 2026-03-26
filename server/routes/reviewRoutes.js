import express from 'express';
import {
    createReview,
    getPropertyReviews,
    getPublicReviews,
} from '../controllers/reviewController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Public route for landing page random 5 star testimonials
router.get('/public', getPublicReviews);

// Reviews for a specific property
router.get('/property/:propertyId', getPropertyReviews);

// Require auth to submit reviews (mostly tenants but keeping it open to signed-in 'users')
router.post('/property/:propertyId', authenticateUser, createReview);

export default router;
