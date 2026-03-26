import express from 'express';
import { handleClerkWebhook, getMe, updateMe, syncUser, toggleFavourite, getFavourites, getManagers } from '../controllers/userController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Clerk Webhook (no auth — Clerk calls this)
router.post('/webhooks/clerk', handleClerkWebhook);

// Sync user from client (no auth middleware — used during registration)
router.post('/sync', syncUser);

// Public route — list managers
router.get('/managers', getManagers);

// Protected routes
router.get('/me', authenticateUser, getMe);
router.put('/me', authenticateUser, updateMe);

// Favourites
router.get('/favourites', authenticateUser, getFavourites);
router.post('/favourites/:propertyId', authenticateUser, toggleFavourite);

export default router;

