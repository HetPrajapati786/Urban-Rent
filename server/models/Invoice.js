import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
    {
        application: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Application',
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

        // Pricing breakdown
        rent: { type: Number, required: true },
        securityDeposit: { type: Number, default: 0 },
        maintenanceCharges: { type: Number, default: 0 },
        totalAmount: { type: Number, required: true },

        // Due date — 7 days from creation
        dueDate: { type: Date, required: true },

        status: {
            type: String,
            enum: ['pending', 'paid', 'overdue', 'void'],
            default: 'pending',
        },

        paidAt: { type: Date },
        paymentId: { type: String }, // reference to Payment
    },
    { timestamps: true }
);

invoiceSchema.index({ tenant: 1, status: 1 });
invoiceSchema.index({ manager: 1, status: 1 });
invoiceSchema.index({ application: 1 });

export default mongoose.model('Invoice', invoiceSchema);
