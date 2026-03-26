import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { getConversations, getMessages, sendMessage, markAsRead } from '../controllers/messageController.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', getConversations);
router.get('/:contactId', getMessages);
router.post('/:contactId', sendMessage);
router.patch('/:contactId/read', markAsRead);

export default router;
