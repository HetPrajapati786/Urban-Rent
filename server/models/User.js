import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        clerkId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        firstName: { type: String, default: '' },
        lastName: { type: String, default: '' },
        avatar: { type: String, default: '' },
        phone: { type: String, default: '' },

        role: {
            type: String,
            enum: ['tenant', 'manager', 'admin'],
            required: true,
        },

        // Manager-specific
        credits: { type: Number, default: 0 },
        properties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],

        // Tenant-specific
        savedProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
        applications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }],

        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model('User', userSchema);
