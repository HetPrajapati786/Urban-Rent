import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
    {
        blog: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Blog',
            required: true,
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        likes: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

commentSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: 'firstName lastName avatar role'
    });
    next();
});

export default mongoose.model('Comment', commentSchema);
