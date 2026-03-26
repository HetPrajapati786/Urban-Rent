import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';
import TenantPropertyCard from '../../components/tenant/TenantPropertyCard';
import { apiGet, apiPost } from '../../utils/api';

export default function TenantHome() {
    const location = useLocation();
    const isDemo = location.pathname.startsWith('/demo');
    const base = isDemo ? '/demo/tenant' : '/tenant';

    const [feed, setFeed] = useState({ featured: [], verified: [], mostViewed: [], latest: [] });
    const [managers, setManagers] = useState([]);
    const [favourites, setFavourites] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const [feedData, managersData] = await Promise.all([
                    apiGet('/properties/feed'),
                    apiGet('/users/managers'),
                ]);
                // Deduce verified from all properties returned
                const verifiedSubset = (feedData.latest || []).filter(p => p.verified && p.status !== 'rented').slice(0, 6);
                
                setFeed({
                    featured: (feedData.featured || []).filter(p => p.status !== 'rented'),
                    mostViewed: (feedData.mostViewed || []).filter(p => p.status !== 'rented'),
                    latest: (feedData.latest || []).filter(p => p.status !== 'rented'),
                    verified: verifiedSubset,
                });
                
                setManagers(managersData.managers || []);

                // Load favourites
                try {
                    const favData = await apiGet('/users/favourites');
                    setFavourites(new Set((favData.savedIds || []).map(id => id.toString())));
                } catch {
                    // Not logged in or demo mode — use localStorage
                    const saved = localStorage.getItem('ur_favourites');
                    if (saved) setFavourites(new Set(JSON.parse(saved)));
                }
            } catch (err) {
                console.error('Feed load error:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleToggleFav = async (id) => {
        try {
            await apiPost(`/users/favourites/${id}`);
            setFavourites(prev => {
                const copy = new Set(prev);
                copy.has(id) ? copy.delete(id) : copy.add(id);
                localStorage.setItem('ur_favourites', JSON.stringify([...copy]));
                return copy;
            });
        } catch {
            // Fallback to localStorage only
            setFavourites(prev => {
                const copy = new Set(prev);
                copy.has(id) ? copy.delete(id) : copy.add(id);
                localStorage.setItem('ur_favourites', JSON.stringify([...copy]));
                return copy;
            });
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `${base}/search?q=${encodeURIComponent(searchQuery)}`;
        }
    };

    if (loading) {
        return (
            <TenantLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                </div>
            </TenantLayout>
        );
    }

    return (
        <TenantLayout>
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900 rounded-3xl p-8 sm:p-14 mb-10 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary-500 rounded-full blur-3xl" />
                    <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-primary-400 rounded-full blur-2xl" />
                </div>
                <div className="relative max-w-3xl mx-auto text-center">
                    <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
                        Find Your Perfect <span className="text-primary-400">Home</span>
                    </h1>
                    <p className="text-dark-300 text-sm sm:text-base mb-8 max-w-xl mx-auto">
                        Browse hundreds of properties from verified managers across the city with our premium network.
                    </p>
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
                        <div className="relative flex-1">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by city, area or property name..."
                                className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md rounded-2xl text-sm text-white placeholder-dark-300 border border-white/10 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 shadow-lg transition-all"
                            />
                        </div>
                        <button type="submit" className="px-8 py-4 bg-primary-500 text-white rounded-2xl font-bold text-sm hover:bg-primary-600 transition-all shadow-lg hover:shadow-primary-500/30 active:scale-95">
                            Search
                        </button>
                    </form>
                    <div className="flex gap-2.5 mt-6 flex-wrap justify-center">
                        {['Ahmedabad', 'Surat', 'Mumbai', 'Pune'].map(city => (
                            <Link
                                key={city}
                                to={`${base}/search?q=${city}`}
                                className="px-4 py-1.5 bg-dark-800/50 text-dark-300 border border-dark-700 text-xs font-semibold rounded-full hover:bg-dark-700 hover:text-white transition-all backdrop-blur-sm"
                            >
                                {city}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Featured Properties */}
            {feed.featured.length > 0 && (
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-xl font-black text-dark-900 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                </div>
                                Featured Properties
                            </h2>
                            <p className="text-dark-400 text-xs mt-0.5">Promoted by top managers</p>
                        </div>
                        <Link to={`${base}/properties`} className="text-primary-600 text-xs font-bold hover:underline">
                            View All →
                        </Link>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {feed.featured.map(p => (
                            <TenantPropertyCard
                                key={p._id}
                                property={p}
                                isFavourite={favourites.has(p._id)}
                                onToggleFav={handleToggleFav}
                                isDemo={isDemo}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Verified Properties */}
            {feed.verified && feed.verified.length > 0 && (
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-xl font-black text-dark-900 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                </div>
                                Verified Properties
                            </h2>
                            <p className="text-dark-400 text-xs mt-0.5">Admin-verified listings you can trust</p>
                        </div>
                        <Link to={`${base}/properties`} className="text-primary-600 text-xs font-bold hover:underline">
                            View All →
                        </Link>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {feed.verified.map(p => (
                            <TenantPropertyCard
                                key={p._id}
                                property={p}
                                isFavourite={favourites.has(p._id)}
                                onToggleFav={handleToggleFav}
                                isDemo={isDemo}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Recommended Managers */}
            {managers.length > 0 && (
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-xl font-black text-dark-900">
                                Recommended Sellers
                            </h2>
                            <p className="text-dark-400 text-xs mt-0.5">Sellers with complete knowledge about locality</p>
                        </div>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-3 -mx-2 px-2 snap-x snap-mandatory scrollbar-hide">
                        {managers.map(m => (
                            <div key={m._id} className="min-w-[260px] max-w-[280px] bg-white rounded-2xl border border-dark-100 p-5 flex-shrink-0 snap-start hover:shadow-lg transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                                        {m.avatar ? (
                                            <img src={m.avatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-white font-bold text-sm">
                                                {(m.firstName?.[0] || '?').toUpperCase()}{(m.lastName?.[0] || '').toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-dark-900 text-sm truncate group-hover:text-primary-600 transition-colors">
                                            {m.firstName} {m.lastName} →
                                        </h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-dark-500 mb-3">
                                    <span className="font-semibold">
                                        <span className="text-dark-900">{Math.max(1, Math.floor((Date.now() - new Date(m.createdAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)))} Yrs</span> Experience
                                    </span>
                                    <span className="font-semibold">
                                        <span className="text-dark-900">{m.propertyCount || 0}</span> Total listings
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {(m.areas || []).map((area, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-dark-50 text-dark-500 text-[10px] font-medium rounded-md border border-dark-100">
                                            {area}
                                        </span>
                                    ))}
                                </div>
                                <button
                                    onClick={() => {
                                        if (m.phone) {
                                            alert(`Contact: ${m.phone}\nEmail: ${m.email}`);
                                        } else {
                                            alert(`Email: ${m.email}`);
                                        }
                                    }}
                                    className="w-full py-2 text-primary-600 text-xs font-bold border border-primary-200 rounded-xl hover:bg-primary-50 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    Show Contact
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Most Viewed Properties */}
            {feed.mostViewed.length > 0 && (
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-xl font-black text-dark-900 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5 1.515a3 3 0 00-3 0L3 5.845a2 2 0 00-1 1.732V21a1 1 0 001 1h6v-5h4v5h6a1 1 0 001-1V7.577a2 2 0 00-1-1.732l-7.5-4.33z"/></svg>
                                </div>
                                Most Viewed
                            </h2>
                            <p className="text-dark-400 text-xs mt-0.5">Popular properties with highest views</p>
                        </div>
                        <Link to={`${base}/properties`} className="text-primary-600 text-xs font-bold hover:underline">
                            View All →
                        </Link>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {feed.mostViewed.map(p => (
                            <TenantPropertyCard
                                key={p._id}
                                property={p}
                                isFavourite={favourites.has(p._id)}
                                onToggleFav={handleToggleFav}
                                isDemo={isDemo}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Latest Properties */}
            {feed.latest.length > 0 && (
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-xl font-black text-dark-900 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-primary-100 flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                Latest Listings
                            </h2>
                            <p className="text-dark-400 text-xs mt-0.5">Freshly added properties</p>
                        </div>
                        <Link to={`${base}/properties`} className="text-primary-600 text-xs font-bold hover:underline">
                            View All →
                        </Link>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {feed.latest.map(p => (
                            <TenantPropertyCard
                                key={p._id}
                                property={p}
                                isFavourite={favourites.has(p._id)}
                                onToggleFav={handleToggleFav}
                                isDemo={isDemo}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Empty state if no data */}
            {feed.featured.length === 0 && feed.mostViewed.length === 0 && feed.latest.length === 0 && (!feed.verified || feed.verified.length === 0) && (
                <div className="bg-white rounded-2xl border border-dark-100 p-12 text-center">
                    <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <svg className="w-10 h-10 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-dark-900 mb-2">No Properties Yet</h3>
                    <p className="text-dark-400 text-sm mb-4">Properties will appear here once managers list them.</p>
                    <Link to={`${base}/properties`} className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors">
                        Browse All Properties
                    </Link>
                </div>
            )}
        </TenantLayout>
    );
}
