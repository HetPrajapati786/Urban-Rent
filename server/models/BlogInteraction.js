import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        blog: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Blog',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['like', 'bookmark', 'view', 'share'],
            required: true,
        },
    },
    { timestamps: true }
);

// Prevent duplicate likes/bookmarks per user per blog
interactionSchema.index({ user: 1, blog: 1, type: 1 }, { unique: true });

export default mongoose.model('BlogInteraction', interactionSchema);
