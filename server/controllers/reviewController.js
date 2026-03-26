import Review from '../models/Review.js';
import Property from '../models/Property.js';

// Get reviews for a specific property
export const getPropertyReviews = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const reviews = await Review.find({ property: propertyId }).sort('-createdAt');
        
        // Calculate averge optionally or just send it
        const avgRating = reviews.length > 0
            ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
            : 0;

        res.json({
            count: reviews.length,
            averageRating: Number(avgRating.toFixed(1)),
            reviews
        });
    } catch (error) {
        console.error('Error fetching property reviews:', error);
        res.status(500).json({ message: 'Failed to find reviews.' });
    }
};

// Create a new review for a property
export const createReview = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { rating, comment } = req.body;
        const tenantId = req.user._id;

        // Validation
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be a number between 1 and 5.' });
        }

        // Check if property exists
        const property = await Property.findById(propertyId);
        if (!property) return res.status(404).json({ message: 'Property not found' });

        // Ensure user hasn't already reviewed
        const existingReview = await Review.findOne({ property: propertyId, tenant: tenantId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this property.' });
        }

        const review = await Review.create({
            property: propertyId,
            tenant: tenantId,
            rating,
            comment
        });

        // Re-fetch to populate the tenant details
        const populatedReview = await Review.findById(review._id);

        res.status(201).json({ message: 'Review successfully submitted.', review: populatedReview });
    } catch (error) {
        console.error('Error submitting review:', error);
        // Duplicate key safety net
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already reviewed this property.' });
        }
        res.status(500).json({ message: 'Server error while submitting your review.' });
    }
};

// Public global reviews (for landing page testimonial carousel)
export const getPublicReviews = async (req, res) => {
    try {
        // Find 5 random 4-5 star reviews
        const reviews = await Review.aggregate([
            { $match: { rating: { $gte: 4 } } },
            { $sample: { size: 5 } }
        ]);
        
        // Aggregate loses mongoose plugins like pre('find') population, 
        // so we manually populate the output array.
        const populatedReviews = await Review.populate(reviews, {
            path: 'tenant property',
            select: 'firstName lastName avatar title location'
        });

        res.json(populatedReviews);
    } catch (error) {
        console.error('Error fetching public reviews:', error);
        res.status(500).json({ message: 'Error retrieving testimonials.' });
    }
};
