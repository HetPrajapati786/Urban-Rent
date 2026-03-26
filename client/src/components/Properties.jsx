import { useState, useEffect } from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { apiGet } from '../utils/api';
import TenantPropertyCard from './tenant/TenantPropertyCard';
import { Link } from 'react-router-dom';
import { useUser, SignInButton } from '@clerk/clerk-react';

export default function Properties() {
    const [ref, isVisible] = useScrollAnimation(0.05);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isSignedIn } = useUser();

    useEffect(() => {
        const fetchVerifiedProperties = async () => {
            try {
                // Fetch up to 6 verified properties
                const data = await apiGet('/properties?verified=true&limit=6');
                setProperties(data.properties || []);
            } catch (error) {
                console.error('Failed to fetch verified properties:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchVerifiedProperties();
    }, []);

    return (
        <section id="properties" ref={ref} className="py-20 lg:py-28 bg-dark-50 section-padding">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className={`flex flex-col sm:flex-row sm:items-end justify-between mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div>
                        <span className="inline-block text-primary-600 font-semibold text-sm uppercase tracking-widest mb-4 bg-primary-50 px-4 py-1.5 rounded-full">
                            Available for Rent
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 text-balance">
                            Explore our premier <span className="gradient-text">rental homes</span>
                        </h2>
                        <p className="text-dark-500 mt-3 max-w-lg text-lg">
                            Curated collection of premium rental properties across India's most desirable locations.
                        </p>
                    </div>
                    {isSignedIn ? (
                        <Link to="/tenant/properties" className="mt-4 sm:mt-0 btn-outline self-start sm:self-auto inline-flex">
                            View All Rentals
                        </Link>
                    ) : (
                        <SignInButton mode="modal">
                            <button className="mt-4 sm:mt-0 btn-outline self-start sm:self-auto inline-flex">
                                View All Rentals
                            </button>
                        </SignInButton>
                    )}
                </div>

                {/* Property Grid */}
                {loading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-2xl border border-dark-100 overflow-hidden animate-pulse h-80">
                                <div className="aspect-[4/3] bg-dark-50" />
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-dark-50 rounded w-2/3" />
                                    <div className="h-6 bg-dark-50 rounded w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : properties.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map((property, index) => (
                            <div
                                key={property._id}
                                className={`transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                style={{ transitionDelay: `${(index + 1) * 100}ms` }}
                            >
                                <TenantPropertyCard
                                    property={property}
                                    isFavourite={false}
                                    onToggleFav={() => {}}
                                    isDemo={true} // Using isDemo=true for the landing page so it routes to /demo/tenant/properties/:id or gracefully degrades
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-dark-500">No verified properties available at the moment.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
