import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, SignInButton } from '@clerk/clerk-react';

export default function Hero() {
    const navigate = useNavigate();
    const { isSignedIn, user } = useUser();
    
    const [activeType, setActiveType] = useState('House');
    const [q, setQ] = useState('');
    const [city, setCity] = useState('Any');
    const [priceRange, setPriceRange] = useState('Any');
    const [rooms, setRooms] = useState('Any');

    const propertyTypes = ['House', 'Apartment', 'Shop', 'Office'];
    const filterTags = ['Villas', 'City', 'Residential', 'Apartment', 'Commercial'];

    const handleSearchClick = () => {
        if (!isSignedIn) return; // Handled by SignInButton wrap if unsigned

        // Ensure user isn't a manager
        const role = user?.unsafeMetadata?.role || user?.publicMetadata?.role;
        if (role === 'manager') {
            navigate('/manager/dashboard');
            return;
        }

        // Push to sessionStorage for TenantSearch to pick up
        if (q.trim()) sessionStorage.setItem('ts_q', JSON.stringify(q));
        if (city !== 'Any') sessionStorage.setItem('ts_city', JSON.stringify(city));
        if (activeType !== 'Any') sessionStorage.setItem('ts_propType', JSON.stringify(activeType));
        if (rooms !== 'Any') sessionStorage.setItem('ts_bhk', JSON.stringify(rooms));
        
        if (priceRange !== 'Any') {
            if (priceRange === '10k-20k') { sessionStorage.setItem('ts_minRent', JSON.stringify('10000')); sessionStorage.setItem('ts_maxRent', JSON.stringify('20000')); }
            else if (priceRange === '20k-40k') { sessionStorage.setItem('ts_minRent', JSON.stringify('20000')); sessionStorage.setItem('ts_maxRent', JSON.stringify('40000')); }
            else if (priceRange === '40k-60k') { sessionStorage.setItem('ts_minRent', JSON.stringify('40000')); sessionStorage.setItem('ts_maxRent', JSON.stringify('60000')); }
            else if (priceRange === '60k+') { sessionStorage.setItem('ts_minRent', JSON.stringify('60000')); sessionStorage.setItem('ts_maxRent', JSON.stringify('10000000')); }
        }

        navigate('/tenant/search');
    };

    const SearchCTA = () => (
        <button 
            type="button"
            onClick={isSignedIn ? handleSearchClick : undefined}
            className="w-full sm:w-auto px-8 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-[0_4px_14px_0_rgba(22,163,74,0.39)] hover:bg-primary-700 hover:shadow-[0_6px_20px_rgba(22,163,74,0.23)] hover:-translate-y-0.5 transition-all cursor-pointer whitespace-nowrap"
        >
            Search Rentals
        </button>
    );

    return (
        <section id="home" className="relative min-h-screen flex flex-col justify-center overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
                <img
                    src="https://images.pexels.com/photos/11669971/pexels-photo-11669971.jpeg"
                    alt="Modern luxury home"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-dark-950/70 via-dark-900/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/30 via-transparent to-dark-900/20" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-28 pb-8">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                    {/* Left Content */}
                    <div>
                        {/* Property Type Tabs */}
                        <div className="flex gap-2 mb-6 animate-fade-in">
                            {propertyTypes.map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setActiveType(type)}
                                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${activeType === type
                                        ? 'bg-primary-600 text-white border-primary-600'
                                        : 'bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        {/* Heading */}
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1] mb-6 animate-slide-up">
                            Find Spaces That Fit , 
                            <br />
                            <span className="gradient-text">Your Life & Business</span>
                        </h1>

                        {/* Subheading */}
                        <p className="text-base text-white/60 max-w-md mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            Browse verified and premium rental properties, villas, apartments,
                            and reliable commercial spaces. 
                            We are URBANRENT — built from the ground up to secure your ideal rental.
                        </p>
                    </div>

                    {/* Right - empty as per design, the image fills the background */}
                    <div className="hidden lg:block" />
                </div>
            </div>

            {/* Search Box - Bottom Section */}
            <div className="relative z-10 w-full animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="bg-white rounded-2xl shadow-2xl shadow-black/10 p-6 mb-4">
                        {/* Find the best place header */}
                        <h3 className="text-lg font-bold text-dark-900 mb-4">Find the best place</h3>

                        {/* Search Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-1.5 block">
                                    Looking for
                                </label>
                                <div className="flex items-center gap-2 border border-dark-200 rounded-xl px-3 py-2.5">
                                    <svg className="w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Property keywords..."
                                        value={q}
                                        onChange={(e) => setQ(e.target.value)}
                                        className="w-full text-sm text-dark-800 placeholder-dark-400 outline-none bg-transparent"
                                        id="search-looking-for"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-1.5 block">
                                    Price
                                </label>
                                <div className="flex items-center gap-2 border border-dark-200 rounded-xl px-3 py-2.5">
                                    <svg className="w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <select
                                        className="w-full text-sm text-dark-800 outline-none bg-transparent appearance-none cursor-pointer"
                                        id="search-price"
                                        value={priceRange}
                                        onChange={(e) => setPriceRange(e.target.value)}
                                    >
                                        <option value="Any">Any Price</option>
                                        <option value="10k-20k">₹10k - ₹20k</option>
                                        <option value="20k-40k">₹20k - ₹40k</option>
                                        <option value="40k-60k">₹40k - ₹60k</option>
                                        <option value="60k+">₹60k+</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-1.5 block">
                                    Locations
                                </label>
                                <div className="flex items-center gap-2 border border-dark-200 rounded-xl px-3 py-2.5">
                                    <svg className="w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <select
                                        className="w-full text-sm text-dark-800 outline-none bg-transparent appearance-none cursor-pointer"
                                        id="search-location"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                    >
                                        <option value="Any">Any City</option>
                                        <option value="Mumbai">Mumbai</option>
                                        <option value="Delhi">Delhi</option>
                                        <option value="Bangalore">Bangalore</option>
                                        <option value="Hyderabad">Hyderabad</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-1.5 block">
                                    Unit Size
                                </label>
                                <div className="flex items-center gap-2 border border-dark-200 rounded-xl px-3 py-2.5">
                                    <svg className="w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <select
                                        className="w-full text-sm text-dark-800 outline-none bg-transparent appearance-none cursor-pointer"
                                        id="search-rooms"
                                        value={rooms}
                                        onChange={(e) => setRooms(e.target.value)}
                                    >
                                        <option value="Any">Any Configuration</option>
                                        <option value="1 RK">1 RK</option>
                                        <option value="1 BHK">1 BHK</option>
                                        <option value="2 BHK">2 BHK</option>
                                        <option value="3 BHK">3 BHK</option>
                                        <option value="4+ BHK">4+ BHK</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Filter Tags & CTA */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mt-6">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-dark-500 text-sm font-medium mr-1">Quick Filters :</span>
                                {filterTags.map((tag, index) => (
                                    <button
                                        key={tag}
                                        onClick={() => setQ(tag)}
                                        className={`text-sm px-4 py-1.5 rounded-full transition-all duration-300 border ${q === tag
                                            ? 'bg-dark-900 text-white border-dark-900'
                                            : 'bg-white text-dark-600 border-dark-200 hover:border-dark-400 hover:bg-dark-50'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                            
                            {isSignedIn ? <SearchCTA /> : (
                                <SignInButton mode="modal">
                                    <div className="w-full sm:w-auto">
                                        <SearchCTA />
                                    </div>
                                </SignInButton>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
