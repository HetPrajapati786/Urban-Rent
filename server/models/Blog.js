import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        summary: {
            type: String,
            required: true,
            maxlength: 300,
        },
        content: {
            type: String,
            required: true,
        },
        images: [
            {
                url: { type: String, required: true },
                public_id: String,
            },
        ],
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['draft', 'pending_approval', 'published', 'rejected'],
            default: 'draft',
            index: true,
        },
        category: {
            type: String,
            enum: ['Market Trends', 'Legal Updates', 'Announcements', 'Locality Insights', 'Offers', 'Guides', 'Other'],
            required: true,
            index: true,
        },
        tags: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],
        isHighImpact: {
            // Used for smart toaster notifications
            type: Boolean,
            default: false,
        },
        views: {
            type: Number,
            default: 0,
        },
        likesCount: {
            type: Number,
            default: 0,
        },
        bookmarksCount: {
            type: Number,
            default: 0,
        },
        commentsCount: {
            type: Number,
            default: 0,
        },
        adminFeedback: {
            // For rejection notes to managers
            type: String,
            default: '',
        },
        publishedAt: {
            type: Date,
            index: true,
        },
    },
    { timestamps: true }
);

// Populate author details automatically on queries
blogSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'author',
        select: 'firstName lastName avatar role'
    });
    next();
});

export default mongoose.model('Blog', blogSchema);
