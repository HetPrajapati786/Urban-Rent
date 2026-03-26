import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
    {
        invoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Invoice',
            required: true,
        },
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

        amount: { type: Number, required: true },
        method: { type: String, default: 'card' },
        transactionId: { type: String, required: true, unique: true },

        // Breakdown (snapshot at time of payment)
        breakdown: {
            rent: { type: Number },
            securityDeposit: { type: Number },
            maintenanceCharges: { type: Number },
        },

        status: {
            type: String,
            enum: ['completed', 'refunded'],
            default: 'completed',
        },
    },
    { timestamps: true }
);

paymentSchema.index({ tenant: 1, createdAt: -1 });
paymentSchema.index({ manager: 1, createdAt: -1 });
paymentSchema.index({ invoice: 1 });

export default mongoose.model('Payment', paymentSchema);
