import express from 'express';
import {
    createProperty,
    getProperties,
    getMyProperties,
    getPropertyById,
    getPropertyFeed,
    incrementPropertyViews,
    updateProperty,
    deleteProperty,
    togglePropertyStatus,
    toggleBoost,
    requestVerification,
} from '../controllers/propertyController.js';
import { authenticateUser, requireRole } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getProperties);

// Manager's own properties (must be before /:id)
router.get('/user/my', authenticateUser, requireRole('manager'), getMyProperties);

// Feed for tenant home page (must be before /:id)
router.get('/feed', getPropertyFeed);

// Public - single property
router.get('/:id', getPropertyById);

// Track property views (authenticated tenants only)
router.post('/:id/view', authenticateUser, incrementPropertyViews);

// Protected routes (Manager only)
router.post(
    '/',
    authenticateUser,
    requireRole('manager'),
    upload.fields([
        { name: 'images', maxCount: 10 },
        { name: 'video', maxCount: 1 },
        { name: 'floorPlan', maxCount: 1 },
        { name: 'ownershipProof', maxCount: 1 },
        { name: 'propertyDocument', maxCount: 1 },
        { name: 'electricityBill', maxCount: 1 },
        { name: 'taxReceipt', maxCount: 1 },
    ]),
    createProperty
);

router.put(
    '/:id',
    authenticateUser,
    requireRole('manager'),
    upload.fields([
        { name: 'images', maxCount: 10 },
        { name: 'video', maxCount: 1 },
        { name: 'floorPlan', maxCount: 1 },
    ]),
    updateProperty
);
router.delete('/:id', authenticateUser, requireRole('manager'), deleteProperty);
router.patch('/:id/status', authenticateUser, requireRole('manager'), togglePropertyStatus);
router.patch('/:id/boost', authenticateUser, requireRole('manager'), toggleBoost);
router.patch('/:id/verify', authenticateUser, requireRole('manager'), requestVerification);

export default router;
