import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

export default function DiscoverValue() {
    const [ref, isVisible] = useScrollAnimation(0.1);
    const { isSignedIn } = useUser();

    return (
        <section ref={ref} className="py-20 lg:py-28 bg-dark-50 section-padding">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left - Map/Image */}
                    <div className={`relative transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                        <div className="relative rounded-2xl overflow-hidden">
                            {/* Map Image */}
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                <div className="relative">
                                    <img
                                        src="/images/property-4.png"
                                        alt="Property location map"
                                        className="w-full h-80 object-cover"
                                    />
                                    {/* Map Pin Overlay */}
                                    {/* <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                        <div className="relative">
                                            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center shadow-lg">
                                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                                </svg>
                                            </div>
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary-600 transform rotate-45" />
                                        </div>
                                    </div> */}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right - Content */}
                    <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 mb-6 leading-tight">
                            Discover Rentals with
                            <br />
                            the <span className="gradient-text">Best Value</span>
                        </h2>
                        <p className="text-dark-500 text-base leading-relaxed mb-8">
                            Find the most affordable and value-packed rental
                            properties in prime locations. Compare rental prices,
                            explore neighborhoods, and make informed decisions.
                        </p>

                        {isSignedIn ? (
                            <Link to="/tenant/properties" className="inline-flex bg-dark-900 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-dark-800 transition-all duration-300 hover:shadow-lg active:scale-95 transform items-center gap-2">
                                Explore Rentals
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                        ) : (
                            <SignInButton mode="modal">
                                <button className="bg-dark-900 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-dark-800 transition-all duration-300 hover:shadow-lg active:scale-95 transform flex items-center gap-2">
                                    Explore Rentals
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </button>
                            </SignInButton>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
