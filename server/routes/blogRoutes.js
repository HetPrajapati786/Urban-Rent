import express from 'express';
import {
    getBlogs,
    getBlogBySlug,
    createBlog,
    getPendingApprovals,
    getManagerBlogs,
    reviewBlog,
    toggleInteraction,
    addComment,
    getAITopics,
    getAISummary,
    enhanceBlogContent,
    getUserReadingHistory,
    deleteBlog,
    getAdminBlogById,
    updateBlog
} from '../controllers/blogController.js';
import { authenticateUser, requireRole, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public / Viewers
router.get('/', getBlogs); // supports ?filter=latest/trending/personalized

// Tenant/User Interactions
router.post('/interact/:id', authenticateUser, toggleInteraction);
router.post('/comment/:id', authenticateUser, addComment);
router.get('/user/history', authenticateUser, getUserReadingHistory);

// AI Agents (Admin/Manager Editors)
router.get('/ai/topics', authenticateUser, getAITopics);
router.post('/ai/summary', authenticateUser, getAISummary);
router.post('/ai/enhance', authenticateUser, enhanceBlogContent);

// Management
router.post('/', authenticateUser, requireRole('admin'), createBlog);
router.get('/author/manager', authenticateUser, requireRole('admin'), getManagerBlogs);

// Admin Workflows
router.get('/admin/pending', authenticateUser, requireRole('admin'), getPendingApprovals);
router.put('/admin/review/:id', authenticateUser, requireRole('admin'), reviewBlog);

// Admin Active Editor Workflows
router.get('/admin/:id', authenticateUser, requireRole('admin'), getAdminBlogById);
router.put('/admin/:id', authenticateUser, requireRole('admin'), updateBlog);
router.delete('/admin/:id', authenticateUser, requireRole('admin'), deleteBlog);

// Public Single Blog (Must be last to prevent slug overlaps)
router.get('/:slug', optionalAuth, getBlogBySlug);

export default router;
