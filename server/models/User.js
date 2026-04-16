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

        // Deletion tracking - permanently blocks all access
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date },

        // Suspension details
        suspendedAt: { type: Date },
        suspendedReason: { type: String, default: '' },

        // Reactivation requests from suspended users
        reactivationRequests: [{
            message: { type: String, required: true },
            status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
            adminResponse: { type: String },
            requestedAt: { type: Date, default: Date.now },
            respondedAt: { type: Date },
        }],
    },
    { timestamps: true }
);

export default mongoose.model('User', userSchema);
