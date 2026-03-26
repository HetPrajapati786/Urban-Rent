import Message from '../models/Message.js';
import User from '../models/User.js';
import { io } from '../server.js';

export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all messages involving the user to determine contacts
        // Using an aggregation pipeline to get distinct contacts with the last message
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [{ sender: userId }, { receiver: userId }]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$sender", userId] },
                            "$receiver",
                            "$sender"
                        ]
                    },
                    lastMessage: { $first: "$$ROOT" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ["$receiver", userId] }, { $eq: ["$read", false] }] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        // Populate contact info
        const populatedConvos = await User.populate(conversations, {
            path: '_id',
            select: 'firstName lastName avatar email role'
        });

        // Format
        const result = populatedConvos.map(c => ({
            contact: c._id,
            lastMessage: c.lastMessage,
            unreadCount: c.unreadCount
        })).filter(c => c.contact); // remove if user was deleted

        // Sort by recency
        result.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

        res.json({ conversations: result });
    } catch (error) {
        console.error('Error in getConversations:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { contactId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { sender: myId, receiver: contactId },
                { sender: contactId, receiver: myId }
            ]
        }).sort({ createdAt: 1 });

        res.json({ messages });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { contactId } = req.params;
        const { text } = req.body;
        const myId = req.user._id;

        if (!text) {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }

        const message = await Message.create({
            sender: myId,
            receiver: contactId,
            text
        });

        // Emit the new message to the receiver's socket room defined by clerkId
        const receiverUser = await User.findById(contactId);
        if (receiverUser && receiverUser.clerkId) {
            io.to(receiverUser.clerkId).emit('new_message', message);
        }

        res.status(201).json({ message });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { contactId } = req.params;
        const myId = req.user._id;

        await Message.updateMany(
            { sender: contactId, receiver: myId, read: false },
            { $set: { read: true } }
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
