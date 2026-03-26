import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function CTA() {
    const [ref, isVisible] = useScrollAnimation(0.2);

    return (
        <section ref={ref} className="py-20 lg:py-28 section-padding bg-white">
            <div className="max-w-7xl mx-auto">
                <div
                    className={`relative rounded-3xl overflow-hidden transition-all duration-700 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                        }`}
                >
                    {/* Background */}
                    <img
                        src="https://images.pexels.com/photos/10647324/pexels-photo-10647324.jpeg"
                        alt="Beautiful neighborhood"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-dark-900/80" />

                    {/* Content */}
                    <div className="relative z-10 px-8 sm:px-12 lg:px-20 py-16 lg:py-24 text-center">
                        <div className="max-w-2xl mx-auto">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight text-balance">
                                Ready To Make Your Dream
                                <br />
                                Rental A Reality?
                            </h2>
                            <p className="text-white/60 text-base mb-10 max-w-lg mx-auto">
                                Join thousands of happy tenants. Start your journey towards finding the perfect rental home today.
                            </p>
                            <button className="bg-primary-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary-500 transition-all duration-300 hover:shadow-xl hover:shadow-primary-600/30 active:scale-95 transform inline-flex items-center gap-2">
                                Get Started
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
