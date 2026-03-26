import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';
import TenantPropertyCard from '../../components/tenant/TenantPropertyCard';
import { apiGet, apiPost } from '../../utils/api';

export default function TenantFavourites() {
    const location = useLocation();
    const isDemo = location.pathname.startsWith('/demo');

    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const loadFavourites = async () => {
        try {
            setLoading(true);
            const data = await apiGet('/users/favourites');
            setProperties(data.savedProperties || []);
        } catch {
            // Fallback to localStorage
            const saved = localStorage.getItem('ur_favourites');
            if (saved) {
                const ids = JSON.parse(saved);
                try {
                    const allData = await apiGet('/properties?status=active');
                    const list = allData.properties || allData || [];
                    setProperties(list.filter(p => ids.includes(p._id)));
                } catch {
                    setProperties([]);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadFavourites(); }, []);

    const handleToggleFav = async (id) => {
        try {
            await apiPost(`/users/favourites/${id}`);
        } catch { /* fallback */ }
        // Optimistic update — remove from list
        setProperties(prev => prev.filter(p => (p._id || p) !== id));
        // Update localStorage too
        const saved = localStorage.getItem('ur_favourites');
        if (saved) {
            const ids = JSON.parse(saved).filter(i => i !== id);
            localStorage.setItem('ur_favourites', JSON.stringify(ids));
        }
    };

    const filtered = properties.filter(p => {
        const loc = `${p.location?.area || ''} ${p.location?.city || ''}`;
        return p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <TenantLayout
            breadcrumbs={[
                { label: 'Home', href: isDemo ? '/demo/tenant' : '/tenant/dashboard' },
                { label: 'Favourites' },
            ]}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search saved properties..."
        >
            {/* Page Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Favourites</h1>
                    <p className="text-dark-500 text-sm">{filtered.length} saved {filtered.length === 1 ? 'property' : 'properties'}</p>
                </div>
            </div>

            {/* Loading skeleton */}
            {loading && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-dark-100 overflow-hidden animate-pulse">
                            <div className="aspect-[4/3] bg-dark-100" />
                            <div className="p-4 space-y-3">
                                <div className="h-3 bg-dark-100 rounded w-2/3" />
                                <div className="h-4 bg-dark-100 rounded w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && filtered.length === 0 && (
                <div className="bg-white rounded-2xl border border-dark-100 p-12 text-center">
                    <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <svg className="w-10 h-10 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    {searchQuery ? (
                        <>
                            <h3 className="text-lg font-bold text-dark-900 mb-2">No matches found</h3>
                            <p className="text-dark-400 text-sm">Try a different search term.</p>
                        </>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold text-dark-900 mb-2">No Saved Properties Yet</h3>
                            <p className="text-dark-400 text-sm max-w-xs mx-auto mb-6">
                                Tap the favorite button on any listing to save it here for easy comparison.
                            </p>
                            <Link
                                to={isDemo ? '/demo/tenant/properties' : '/tenant/properties'}
                                className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
                            >
                                Browse Properties
                            </Link>
                        </>
                    )}
                </div>
            )}

            {/* Grid */}
            {!loading && filtered.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map(property => (
                        <TenantPropertyCard
                            key={property._id}
                            property={property}
                            isFavourite={true}
                            onToggleFav={handleToggleFav}
                            isDemo={isDemo}
                        />
                    ))}
                </div>
            )}
        </TenantLayout>
    );
}
