import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../utils/api';
import { useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

export default function PropertyReviews({ propertyId }) {
    const { user } = useUser();
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        if (!propertyId) return;
        fetchReviews();
    }, [propertyId]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const data = await apiGet(`/reviews/property/${propertyId}`);
            setReviews(data.reviews || []);
            setAverageRating(data.averageRating || 0);
        } catch (error) {
            console.error('Failed to load reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = await apiPost(`/reviews/property/${propertyId}`, { rating, comment });
            toast.success('Review submitted successfully!');
            setReviews([data.review, ...reviews]);
            setShowForm(false);
            setComment('');
            // Recalculate average optionally, or re-fetch
            const newAvg = ((averageRating * reviews.length) + rating) / (reviews.length + 1);
            setAverageRating(Number(newAvg.toFixed(1)));
        } catch (error) {
            toast.error(error.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-6 text-center text-dark-400">Loading reviews...</div>;

    const hasUserReviewed = reviews.some(r => r.tenant && r.tenant._id === user?.publicMetadata?.userId);

    return (
        <div className="bg-white p-6 rounded-2xl border border-dark-100 mt-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-dark-900 flex items-center gap-2">
                    <span className="w-1 h-5 bg-primary-500 rounded-full" />
                    Ratings & Reviews
                </h2>
                {reviews.length > 0 && (
                    <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                        <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                        <span className="font-bold text-amber-700 text-sm">{averageRating} <span className="text-amber-600/60 font-medium">/ 5</span></span>
                    </div>
                )}
            </div>

            {/* Review Form Toggle */}
            {user && !hasUserReviewed && !showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full mb-6 py-3 border-2 border-dashed border-dark-200 text-dark-500 font-bold text-sm rounded-xl hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-colors"
                >
                    + Write a Review
                </button>
            )}

            {/* Submit Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="mb-8 bg-dark-50 p-5 rounded-xl border border-dark-100 animate-fade-in">
                    <h3 className="font-bold text-dark-900 text-sm mb-3">Rate your experience</h3>
                    <div className="flex gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className={`transition-transform hover:scale-110 ${rating >= star ? 'text-amber-400' : 'text-dark-200'}`}
                            >
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                            </button>
                        ))}
                    </div>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share details of your own experience at this property..."
                        className="w-full p-3 rounded-xl border border-dark-200 bg-white text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 mb-3 min-h-[100px] resize-none"
                    />
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 text-dark-500 font-bold text-sm hover:text-dark-700 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting || !comment.trim() || rating === 0} className="px-6 py-2 bg-primary-600 text-white font-bold text-sm rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md">
                            {submitting ? 'Posting...' : 'Post Review'}
                        </button>
                    </div>
                </form>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <div className="text-center py-6">
                    <span className="text-dark-400 text-sm">No reviews yet. Be the first to leave a review!</span>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map(review => (
                        <div key={review._id} className="p-5 rounded-xl border border-dark-100 bg-white hover:border-dark-200 transition-colors flex gap-4">
                            {/* Avatar Left Column */}
                            <img 
                                src={review.tenant?.avatar || '/images/testimonial.png'} 
                                alt="Avatar" 
                                className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover shadow-sm flex-shrink-0 ring-2 ring-primary-50"
                            />
                            {/* Content Right Column */}
                            <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-dark-900 text-[13px] md:text-sm">
                                            {review.tenant ? `${review.tenant.firstName} ${review.tenant.lastName}` : 'Verified Tenant'}
                                        </p>
                                        <span className="text-[11px] text-dark-400 font-medium">
                                            • {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center bg-amber-50 px-2 py-0.5 rounded-md w-fit">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <svg key={star} className={`w-3 h-3 ${review.rating >= star ? 'text-amber-500' : 'text-amber-200'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                                        ))}
                                    </div>
                                </div>
                                {review.comment && (
                                    <p className="text-dark-600 text-[13.5px] leading-relaxed mt-1">
                                        {review.comment}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
