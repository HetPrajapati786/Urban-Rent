import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['info', 'success', 'warning', 'error'],
            default: 'info',
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
        link: {
            type: String, // Optional URL to navigate to when clicked
        },
    },
    { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
