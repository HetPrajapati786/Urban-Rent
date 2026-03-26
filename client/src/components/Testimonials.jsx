import { useState, useEffect } from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { apiGet } from '../utils/api';

const STATIC_TESTIMONIALS = [
    {
        name: 'Rahul Sharma',
        role: 'Software Engineer',
        location: 'Bangalore',
        image: '/images/testimonial.png',
        rating: 5,
        text: 'UrbanRent made finding my rental home effortless. They understood my budget and lifestyle needs, and matched me to a perfect apartment within a week. The entire rental process was seamless!',
    },
    {
        name: 'Priya Patel',
        role: 'Marketing Manager',
        location: 'Mumbai',
        image: '/images/testimonial.png',
        rating: 5,
        text: 'The virtual tour feature saved me so much time while apartment hunting. I could explore rental properties from my office and only visited the ones I truly liked. The digital rental agreement process was seamless!',
    },
    {
        name: 'Arjun Reddy',
        role: 'Property Owner',
        location: 'Hyderabad',
        image: '/images/testimonial.png',
        rating: 5,
        text: 'As a landlord, UrbanRent has been a game-changer for finding reliable tenants. The platform handles rental documentation, tenant verification, and even manages rent collection. Highly recommended!',
    },
];

export default function Testimonials() {
    const [ref, isVisible] = useScrollAnimation(0.1);
    const [testimonials, setTestimonials] = useState(STATIC_TESTIMONIALS);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const data = await apiGet('/reviews/public');
                if (data && data.length > 0) {
                    const dynamicTestimonials = data.map(review => ({
                        name: review.tenant ? `${review.tenant.firstName} ${review.tenant.lastName}` : 'Verified Tenant',
                        role: 'Verified Renter',
                        location: review.property?.location?.city || 'India',
                        image: review.tenant?.avatar || '/images/testimonial.png',
                        rating: review.rating,
                        text: review.comment || 'Amazing rental experience. Highly recommended!',
                    }));
                    setTestimonials(dynamicTestimonials);
                }
            } catch (err) {
                console.error('Failed to load public reviews', err);
            }
        };

        fetchReviews();
    }, []);

    return (
        <section id="about" ref={ref} className="py-20 lg:py-28 bg-dark-50 section-padding">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className={`max-w-2xl mb-14 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <span className="inline-block text-primary-600 font-semibold text-sm uppercase tracking-widest mb-4 bg-primary-50 px-4 py-1.5 rounded-full">
                        Testimonials
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 mb-5">
                        What our clients say{' '}
                        <span className="gradient-text">about us</span>
                    </h2>
                    <p className="text-dark-500 text-lg">
                        Hear from our satisfied tenants and landlords who found their perfect rental match through UrbanRent.
                    </p>
                </div>

                {/* Testimonial Cards */}
                <div className="max-w-4xl mx-auto space-y-6">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            className={`group bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-dark-100 hover:border-primary-200 flex gap-5 sm:gap-7 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                                }`}
                            style={{ transitionDelay: `${(index + 1) * 150}ms` }}
                        >
                            {/* Left Column: Avatar */}
                            <img
                                src={testimonial.image}
                                alt={testimonial.name}
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover flex-shrink-0 ring-4 ring-primary-50"
                            />

                            {/* Right Column: Content */}
                            <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                    <div>
                                        <h4 className="font-bold text-dark-900 text-base">{testimonial.name}</h4>
                                        <p className="text-dark-400 text-xs sm:text-sm font-medium mt-0.5">{testimonial.role} • {testimonial.location}</p>
                                    </div>
                                    {/* Stars */}
                                    <div className="flex gap-1 bg-amber-50 px-2.5 py-1 rounded-lg w-fit">
                                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                                            <svg key={i} className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            </svg>
                                        ))}
                                    </div>
                                </div>

                                {/* Quote */}
                                <p className="text-dark-600 leading-relaxed text-[14px] sm:text-[15px]">
                                    "{testimonial.text}"
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
