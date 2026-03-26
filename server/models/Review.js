import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        maxLength: 1000,
        trim: true
    }
}, { timestamps: true });

// A tenant can only leave one review per property
reviewSchema.index({ property: 1, tenant: 1 }, { unique: true });

// Helper to auto-populate tenant details when querying reviews
reviewSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'tenant',
        select: 'firstName lastName avatar'
    });
    next();
});

export default mongoose.model('Review', reviewSchema);
