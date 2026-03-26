import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
    {
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property',
            required: true,
        },
        tenant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        manager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // Application details
        message: { type: String },
        moveInDate: { type: Date },
        leaseDuration: { type: Number }, // months

        formDetails: {
            maritalStatus: { type: String }, // 'Single', 'Married', 'Bachelor', etc.
            employmentStatus: { type: String }, // 'Employed', 'Self-Employed/Business', 'Student'
            companyName: { type: String },
            familySize: { type: Number },
            pets: { type: Boolean, default: false },
            businessType: { type: String },
            yearsInBusiness: { type: Number },
            reasonForMoving: { type: String }
        },

        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'withdrawn', 'waitlist', 'terminated'],
            default: 'pending',
        },

        // ─── Early Termination ───
        termination: {
            requestedBy: { type: String, enum: ['tenant', 'manager'] },
            requestedAt: { type: Date },
            reason: { type: String }, // tenant's reason for requesting termination
            status: { type: String, enum: ['requested', 'processed'] },
            refundAmount: { type: Number, default: 0 },
            deductionAmount: { type: Number, default: 0 }, // auto-calculated pro-rata deduction
            deductionReason: { type: String },
            processedAt: { type: Date },
            stayedDuration: { type: Number }, // in days
        },

        // Manager response
        managerNotes: { type: String },
        respondedAt: { type: Date },
    },
    { timestamps: true }
);

applicationSchema.index({ tenant: 1, status: 1 });
applicationSchema.index({ manager: 1, status: 1 });
applicationSchema.index({ property: 1 });

export default mongoose.model('Application', applicationSchema);
