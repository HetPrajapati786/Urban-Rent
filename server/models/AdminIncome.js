import mongoose from 'mongoose';

const adminIncomeSchema = new mongoose.Schema(
    {
        source: { 
            type: String, 
            enum: ['credit_purchase', 'lease_commission', 'other'], 
            required: true 
        },
        amount: { type: Number, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        description: { type: String },
        transactionId: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model('AdminIncome', adminIncomeSchema);
