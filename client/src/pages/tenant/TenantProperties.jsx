import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';
import TenantPropertyCard from '../../components/tenant/TenantPropertyCard';
import { apiGet, apiPost } from '../../utils/api';

const PROPERTY_TYPES = ['All', 'Residential', 'Commercial', 'PG/Hostel'];
const SORT_OPTIONS = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Rent: Low to High', value: 'rent_asc' },
    { label: 'Rent: High to Low', value: 'rent_desc' },
    { label: 'Most Popular', value: 'popular' },
];

export default function TenantProperties() {
    const location = useLocation();
    const isDemo = location.pathname.startsWith('/demo');

    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeType, setActiveType] = useState('All');
    const [sortBy, setSortBy] = useState('newest');
    const [favourites, setFavourites] = useState(new Set());

    const fetchProperties = useCallback(async () => {
        try {
            setLoading(true);
            const data = await apiGet('/properties?status=active');
            const all = data.properties || data || [];
            setProperties(all.filter(p => p.status !== 'rented'));
            setError('');
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProperties();
        // Load favourites
        (async () => {
            try {
                const data = await apiGet('/users/favourites');
                setFavourites(new Set((data.savedIds || []).map(id => id.toString())));
            } catch {
                const saved = localStorage.getItem('ur_favourites');
                if (saved) setFavourites(new Set(JSON.parse(saved)));
            }
        })();
    }, [fetchProperties]);

    const handleToggleFav = async (id) => {
        try {
            await apiPost(`/users/favourites/${id}`);
        } catch { /* fallback */ }
        setFavourites(prev => {
            const copy = new Set(prev);
            copy.has(id) ? copy.delete(id) : copy.add(id);
            localStorage.setItem('ur_favourites', JSON.stringify([...copy]));
            return copy;
        });
    };

    // Filter & sort
    const filtered = properties
        .filter(p => {
            const locStr = `${p.location?.area || ''} ${p.location?.city || ''}`;
            const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                locStr.toLowerCase().includes(searchQuery.toLowerCase());
            const matchType = activeType === 'All' || p.type?.toLowerCase() === activeType.toLowerCase();
            return matchSearch && matchType;
        })
        .sort((a, b) => {
            if (sortBy === 'rent_asc') return (a.pricing?.monthlyRent || 0) - (b.pricing?.monthlyRent || 0);
            if (sortBy === 'rent_desc') return (b.pricing?.monthlyRent || 0) - (a.pricing?.monthlyRent || 0);
            if (sortBy === 'popular') return (b.views || 0) - (a.views || 0);
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

    return (
        <TenantLayout
            breadcrumbs={[
                { label: 'Home', href: isDemo ? '/demo/tenant' : '/tenant/dashboard' },
                { label: 'All Properties' },
            ]}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search by name or location..."
        >
            {/* Header Row */}
            <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-dark-900">All Properties</h1>
                    <p className="text-dark-500 text-sm mt-1">{filtered.length} properties available</p>
                </div>
                {/* Sort */}
                <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="border border-dark-200 rounded-xl px-4 py-2 text-sm text-dark-700 outline-none focus:border-primary-500 bg-white cursor-pointer"
                >
                    {SORT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {/* Type Filter Tabs */}
            <div className="flex-shrink-0 flex items-center gap-2 overflow-x-auto pb-2 mb-4">
                {PROPERTY_TYPES.map(type => (
                    <button
                        key={type}
                        onClick={() => setActiveType(type)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                            activeType === type
                                ? 'bg-dark-900 text-white'
                                : 'bg-dark-100 text-dark-500 hover:bg-dark-200'
                        }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pb-4">
            {/* Loading skeleton */}
            {loading && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-dark-100 overflow-hidden animate-pulse">
                            <div className="aspect-[4/3] bg-dark-100" />
                            <div className="p-4 space-y-3">
                                <div className="h-3 bg-dark-100 rounded w-2/3" />
                                <div className="h-4 bg-dark-100 rounded w-full" />
                                <div className="h-3 bg-dark-100 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-700 font-medium mb-2">Failed to load properties</p>
                    <p className="text-red-600 text-sm mb-4">{error}</p>
                    <button onClick={fetchProperties} className="text-sm text-primary-600 font-semibold hover:underline">
                        Try Again
                    </button>
                </div>
            )}

            {/* Grid */}
            {!loading && !error && (
                filtered.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map(property => (
                            <TenantPropertyCard
                                key={property._id}
                                property={property}
                                isFavourite={favourites.has(property._id)}
                                onToggleFav={handleToggleFav}
                                isDemo={isDemo}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-dark-100 p-12 text-center">
                        <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-dark-900 mb-2">No Properties Found</h3>
                        <p className="text-dark-400 text-sm">Try adjusting your search or filters.</p>
                    </div>
                )
            )}
            </div>
        </TenantLayout>
    );
}
