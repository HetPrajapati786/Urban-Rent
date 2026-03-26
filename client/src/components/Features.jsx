import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function Features() {
    const [sectionRef, isSectionVisible] = useScrollAnimation(0.1);

    return (
        <section className="py-20 lg:py-28 bg-white section-padding" ref={sectionRef}>
            <div className="max-w-7xl mx-auto">
                {/* Top Row - Heading + Play Button */}
                <div className={`flex flex-col lg:flex-row items-start lg:items-center justify-between mb-14 transition-all duration-700 ${isSectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 leading-tight max-w-lg mb-6 lg:mb-0">
                        Your primary home might
                        <br />
                        begin to feel <span className="font-display italic">left out.</span>
                    </h2>

                    {/* Play Button */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 bg-dark-900 rounded-full flex items-center justify-center cursor-pointer hover:bg-dark-800 transition-colors group">
                                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>
                            {/* Pulse ring */}
                            <div className="absolute inset-0 w-16 h-16 bg-dark-900/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                        </div>
                        <div className="max-w-[180px]">
                            <p className="text-dark-500 text-sm leading-snug">
                                Each listing offers unique features,
                                top-quality amenities, and a prime
                                location.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Feature Cards Row */}
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-5 transition-all duration-700 delay-200 ${isSectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    {/* Card 1 - Large Image */}
                    <div className="relative rounded-2xl overflow-hidden aspect-[4/3] group">
                        <img
                            src="/images/property-1.png"
                            alt="Modern property"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>

                    {/* Card 2 - Text Card with Image */}
                    <div className="bg-dark-50 rounded-2xl p-6 flex flex-col justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-dark-900 mb-3">
                                Big things can happen in small spaces.
                            </h3>
                            <p className="text-dark-500 text-sm leading-relaxed mb-4">
                                Lorem ipsum dolor sit amet, consectetur adipiscing
                                elit. In a ipsum turpis. Morbi ornare interdum
                                sagittis.
                            </p>
                            <button className="text-sm font-semibold text-dark-900 flex items-center gap-2 hover:gap-3 transition-all group">
                                More
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </button>
                        </div>
                        <div className="mt-4 rounded-xl overflow-hidden">
                            <img
                                src="/images/property-2.png"
                                alt="Small space property"
                                className="w-full h-32 object-cover rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Card 3 - Price Card */}
                    <div className="flex flex-col gap-5">
                        <div className="bg-dark-50 rounded-2xl p-5 flex-1">
                            <div className="rounded-xl overflow-hidden mb-4">
                                <img
                                    src="/images/property-3.png"
                                    alt="Featured property"
                                    className="w-full h-32 object-cover rounded-xl"
                                />
                            </div>
                            <p className="text-dark-500 text-sm leading-relaxed">
                                Lorem ipsum dolor sit amet, consectetur adipiscing
                                elit. In a ipsum turpis ipsum.
                            </p>
                        </div>
                        <div className="bg-dark-900 rounded-2xl p-5 text-white">
                            <p className="text-white/60 text-sm mb-1">Best Starts at</p>
                            <p className="text-2xl font-bold mb-3">₹10000</p>
                            <button className="w-full bg-white text-dark-900 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-all">
                                View Properties →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
