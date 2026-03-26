import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { apiGet, apiPatch, apiDelete } from '../../utils/api';

const STATUS_CONFIG = {
    active: { label: 'Active', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    paused: { label: 'Paused', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    pending: { label: 'Pending Review', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200' },
    awaiting_payment: { label: 'Awaiting Payment', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    rented: { label: 'Rented Out', color: 'bg-dark-100 text-dark-700 border-dark-200' },
};

const FILTER_OPTIONS = ['Available', 'Awaiting Payment', 'Rented', 'Active', 'Paused', 'Pending', 'Verified', 'Boosted'];

// Placeholder image when property has no images
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop';

export default function AllProperties() {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('Available');
    const [sortBy, setSortBy] = useState('newest');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [showBoostModal, setShowBoostModal] = useState(null);
    const [showVerifyModal, setShowVerifyModal] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    // Fetch properties from API
    const fetchProperties = useCallback(async () => {
        try {
            setLoading(true);
            const data = await apiGet('/properties/user/my');
            setProperties(data.properties || []);
            setError('');
        } catch (err) {
            console.error('Fetch properties error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProperties();
    }, [fetchProperties]);

    // Filtering logic
    const filteredProperties = properties.filter(p => {
        const locationStr = `${p.location?.area || ''} ${p.location?.city || ''}`;
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            locationStr.toLowerCase().includes(searchQuery.toLowerCase());

        if (activeFilter === 'Available') return matchesSearch && !['rented', 'awaiting_payment'].includes(p.status);
        if (activeFilter === 'Awaiting Payment') return matchesSearch && p.status === 'awaiting_payment';
        if (activeFilter === 'Rented') return matchesSearch && p.status === 'rented';
        if (activeFilter === 'Active') return matchesSearch && p.status === 'active';
        if (activeFilter === 'Paused') return matchesSearch && p.status === 'paused';
        if (activeFilter === 'Pending') return matchesSearch && p.status === 'pending';
        if (activeFilter === 'Verified') return matchesSearch && p.verified;
        if (activeFilter === 'Boosted') return matchesSearch && p.boosted;
        return matchesSearch;
    }).sort((a, b) => {
        if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
        if (sortBy === 'rent_high') return (b.pricing?.monthlyRent || 0) - (a.pricing?.monthlyRent || 0);
        if (sortBy === 'rent_low') return (a.pricing?.monthlyRent || 0) - (b.pricing?.monthlyRent || 0);
        return new Date(b.createdAt) - new Date(a.createdAt); // newest
    });

    const handleTogglePause = async (id) => {
        try {
            await apiPatch(`/properties/${id}/status`);
            fetchProperties();
        } catch (err) {
            console.error('Toggle pause error:', err);
        }
        setOpenMenuId(null);
    };

    const handleDelete = async (id) => {
        try {
            await apiDelete(`/properties/${id}`);
            fetchProperties();
        } catch (err) {
            console.error('Delete error:', err);
        }
        setShowDeleteConfirm(null);
    };

    const handleBoost = async (id) => {
        try {
            await apiPatch(`/properties/${id}/boost`);
            fetchProperties();
        } catch (err) {
            console.error('Boost error:', err);
        }
        setShowBoostModal(null);
    };

    const handleVerify = async (id) => {
        try {
            await apiPatch(`/properties/${id}/verify`);
            fetchProperties();
        } catch (err) {
            console.error('Verify error:', err);
        }
        setShowVerifyModal(null);
    };

    // Summary stats
    const totalViews = properties.reduce((sum, p) => sum + (p.views || 0), 0);
    const stats = {
        total: properties.filter(p => !['rented', 'awaiting_payment'].includes(p.status)).length,
        owned: properties.length,
        active: properties.filter(p => p.status === 'active').length,
        verified: properties.filter(p => p.verified).length,
        boosted: properties.filter(p => p.boosted).length,
        views: totalViews,
    };

    return (
        <ManagerLayout
            breadcrumbs={[
                { label: 'Home', href: '/manager/dashboard' },
                { label: 'All Properties' },
            ]}
        >
            {/* Header Row */}
            <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-dark-900">All Properties</h1>
                    <p className="text-dark-500 text-sm mt-1">{stats.total} available listed properties ({stats.owned} total)</p>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-80">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search Properties..."
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-dark-200 rounded-full text-sm text-dark-800 placeholder-dark-400 outline-none transition-all duration-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                        id="search-properties"
                    />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="flex-shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <StatCard label="Total Views" value={stats.views} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>} color="bg-blue-50 text-blue-600" />
                <StatCard label="Active" value={stats.active} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="bg-blue-50 text-blue-600" />
                <StatCard label="Verified" value={stats.verified} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>} color="bg-blue-50 text-blue-600" />
                <StatCard label="Boosted" value={stats.boosted} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} color="bg-blue-50 text-blue-600" />
            </div>

            {/* Filter Tabs + Sort + Add Property */}
            <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {FILTER_OPTIONS.map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 ${activeFilter === filter
                                ? 'bg-dark-900 text-white'
                                : 'bg-dark-100 text-dark-500 hover:bg-dark-200'
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Sort dropdown */}
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            className="appearance-none pl-8 pr-8 py-2 border-2 border-dark-200 rounded-full text-xs font-semibold text-dark-700 bg-white outline-none focus:border-primary-500 cursor-pointer"
                        >
                            <option value="newest">Newest First</option>
                            <option value="views">Most Viewed</option>
                            <option value="rent_high">Rent: High to Low</option>
                            <option value="rent_low">Rent: Low to High</option>
                        </select>
                        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                        <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <Link
                        to={window.location.pathname.startsWith('/demo') ? '/demo/manager/add-property' : '/manager/add-property'}
                        className="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-primary-700 transition-all hover:shadow-lg hover:shadow-primary-600/20 active:scale-95 flex-shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Property
                    </Link>
                </div>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pb-4">
            {/* Loading State */}
            {loading && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-dark-100 overflow-hidden animate-pulse">
                            <div className="aspect-[4/3] bg-dark-100" />
                            <div className="p-4 space-y-3">
                                <div className="h-3 bg-dark-100 rounded w-1/2" />
                                <div className="h-4 bg-dark-100 rounded w-3/4" />
                                <div className="h-3 bg-dark-100 rounded w-2/3" />
                                <hr className="border-dark-100" />
                                <div className="flex justify-between">
                                    <div className="h-5 bg-dark-100 rounded w-1/3" />
                                    <div className="h-6 bg-dark-100 rounded w-16" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {!loading && error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-700 font-medium mb-2">Failed to load properties</p>
                    <p className="text-red-600 text-sm mb-4">{error}</p>
                    <button onClick={fetchProperties} className="text-sm text-primary-600 font-semibold hover:underline">
                        Try Again
                    </button>
                </div>
            )}

            {/* Property Grid */}
            {!loading && !error && (
                filteredProperties.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredProperties.map(property => (
                            <PropertyCard
                                key={property._id}
                                property={property}
                                openMenuId={openMenuId}
                                setOpenMenuId={setOpenMenuId}
                                onTogglePause={handleTogglePause}
                                onDelete={() => setShowDeleteConfirm(property._id)}
                                onBoost={() => setShowBoostModal(property._id)}
                                onVerify={() => setShowVerifyModal(property._id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-dark-100 p-12 text-center">
                        <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-dark-900 mb-1">No properties yet</h3>
                        <p className="text-dark-500 text-sm mb-4">Start by adding your first property listing.</p>
                        <Link
                            to={window.location.pathname.startsWith('/demo') ? '/demo/manager/add-property' : '/manager/add-property'}
                            className="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Your First Property
                        </Link>
                    </div>
                )
            )}
            </div>

            {/* Boost Modal */}
            {showBoostModal && (
                <Modal onClose={() => setShowBoostModal(null)}>
                    <div className="text-center">
                        <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-dark-900 mb-2">Boost This Property</h3>
                        <p className="text-dark-500 text-sm mb-6">
                            Boosted properties get <strong>5x more visibility</strong> in search results, featured placement on the homepage, and priority in tenant recommendations.
                        </p>
                        <div className="bg-dark-50 rounded-xl p-4 mb-6 text-left space-y-3">
                            {['Featured badge on listing', 'Top of search results for 30 days', 'Premium placement on homepage', 'Analytics & performance report'].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm">
                                    <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                                    <span className="text-dark-700">{item}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowBoostModal(null)} className="flex-1 py-3 border-2 border-dark-200 rounded-xl text-sm font-semibold text-dark-600 hover:bg-dark-50 transition-colors">Cancel</button>
                            <button onClick={() => handleBoost(showBoostModal)} className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-rose-500/25 transition-all active:scale-95">Boost Property</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Verify Modal */}
            {showVerifyModal && (
                <Modal onClose={() => setShowVerifyModal(null)}>
                    <div className="text-center">
                        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-dark-900 mb-2">Request Verification</h3>
                        <p className="text-dark-500 text-sm mb-6">
                            Verified properties display a trust badge, confirming the property's legitimacy, safety standards, and document authenticity.
                        </p>
                        <div className="bg-dark-50 rounded-xl p-4 mb-6 text-left space-y-3">
                            <h4 className="text-sm font-semibold text-dark-800 mb-1">Requirements:</h4>
                            {['Ownership proof uploaded', 'Property documents verified', 'Property photos match listing', 'Admin on-site inspection (if needed)'].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm">
                                    <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                                    <span className="text-dark-700">{item}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowVerifyModal(null)} className="flex-1 py-3 border-2 border-dark-200 rounded-xl text-sm font-semibold text-dark-600 hover:bg-dark-50 transition-colors">Cancel</button>
                            <button onClick={() => handleVerify(showVerifyModal)} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/25 transition-all active:scale-95">Request Verification</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <Modal onClose={() => setShowDeleteConfirm(null)}>
                    <div className="text-center">
                        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-dark-900 mb-2">Delete Property</h3>
                        <p className="text-dark-500 text-sm mb-6">
                            Are you sure? This action cannot be undone and will remove all associated data.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-3 border-2 border-dark-200 rounded-xl text-sm font-semibold text-dark-600 hover:bg-dark-50 transition-colors">Cancel</button>
                            <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors active:scale-95">Delete Permanently</button>
                        </div>
                    </div>
                </Modal>
            )}
        </ManagerLayout>
    );
}

/* ═══════════════════════════════════════
   Sub-Components
   ═══════════════════════════════════════ */

function StatCard({ label, value, icon, color }) {
    return (
        <div className="bg-white rounded-xl p-3 border border-dark-100 flex items-center gap-2.5 shadow-sm">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-lg font-black text-dark-900 leading-none mb-0.5">{value}</p>
                <p className="text-dark-400 text-[10px] font-bold tracking-wide uppercase">{label}</p>
            </div>
        </div>
    );
}

function PropertyCard({ property, openMenuId, setOpenMenuId, onTogglePause, onDelete, onBoost, onVerify }) {
    const isDemo = window.location.pathname.startsWith('/demo');
    const isMenuOpen = openMenuId === property._id;
    const config = STATUS_CONFIG[property.status] || STATUS_CONFIG.pending;

    const imageUrl = property.images?.[0]?.url || PLACEHOLDER_IMAGE;
    const locationStr = [property.location?.area, property.location?.city].filter(Boolean).join(', ') || 'Location not set';
    const beds = property.residential?.totalRooms || property.residential?.bhkType?.replace(/\D/g, '') || '-';
    const baths = property.residential?.bathrooms || '-';
    const area = property.commercial?.totalArea || property.residential?.totalArea || '-';
    const rent = property.pricing?.monthlyRent || 0;

    return (
        <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden group hover:shadow-lg transition-all duration-300 relative">
            {/* Image Overlay with Views */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <Link to={(isDemo ? '/demo/manager/properties/' : '/manager/properties/') + property._id}>
                    <img
                        src={imageUrl}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => { e.target.src = PLACEHOLDER_IMAGE; }}
                    />
                </Link>

                {/* Status Badge (Top Left) */}
                <div className="absolute top-3 left-3 z-10">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${config.color} shadow-sm backdrop-blur-sm`}>
                        {config.label}
                    </span>
                </div>

                {/* Right Action Area (Top Right) */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                    {/* Feature Badges */}
                    <div className="flex items-center gap-1">
                        {property.verified && (
                            <span className="p-1.5 rounded-lg bg-blue-500 text-white shadow-sm" title="Verified">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                            </span>
                        )}
                        {property.boosted && (
                            <span className="p-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm" title="Boosted">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            </span>
                        )}
                    </div>

                    {/* 3ndot Menu Button */}
                    <div className="relative">
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : property._id); }}
                            className="w-7 h-7 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center border border-dark-100 hover:bg-white shadow-sm transition-all"
                        >
                            <svg className="w-4 h-4 text-dark-600" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                            </svg>
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 top-9 bg-white rounded-xl shadow-xl border border-dark-100 py-1.5 w-44 z-20 animate-fade-in text-left overflow-hidden">
                                <Link to={isDemo ? `/demo/manager/properties/${property._id}` : `/manager/properties/${property._id}`} className="flex items-center gap-2.5 px-4 py-2 text-sm text-dark-600 hover:bg-dark-50">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    View Details
                                </Link>
                                <Link to={isDemo ? `/demo/manager/edit-property/${property._id}` : `/manager/edit-property/${property._id}`} className="flex items-center gap-2.5 px-4 py-2 text-sm text-dark-600 hover:bg-dark-50">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    Edit Property
                                </Link>
                                <button onClick={() => onTogglePause(property._id)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-dark-600 hover:bg-dark-50">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {property.status === 'paused' ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /> : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 9v6m4-6v6" /><circle cx="12" cy="12" r="9" strokeWidth={1.5} /></>}
                                    </svg>
                                    {property.status === 'paused' ? 'Resume listing' : 'Pause listing'}
                                </button>
                                <button onClick={() => { setOpenMenuId(null); onDelete(); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Views Overlay (Bottom Right) */}
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    {property.views || 0}
                </div>
            </div>

            {/* Card Content */}
            <div className="p-4">
                <div className="flex items-center gap-1.5 text-dark-500 text-[11px] mb-2">
                    <svg className="w-3.5 h-3.5 text-primary-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                    {locationStr}
                </div>

                <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-dark-900 font-bold text-sm leading-tight group-hover:text-primary-600 transition-colors line-clamp-2">
                        <Link to={(isDemo ? '/demo/manager/properties/' : '/manager/properties/') + property._id}>
                            {property.title}
                        </Link>
                    </h3>

                    {!property.verified && property.verificationStatus !== 'requested' && (
                        <button onClick={onVerify} className="flex-shrink-0 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition-colors">
                            Verify
                        </button>
                    )}
                    {property.verificationStatus === 'requested' && (
                        <span className="flex-shrink-0 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[10px] font-bold">
                            Pending Review
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-4 text-dark-500 text-[11px] mb-4 pb-4 border-b border-dark-50">
                    <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>{beds} Bed</span>
                    <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>{baths} Bath</span>
                    <span className="flex items-center gap-1.5 font-bold text-dark-700"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>{area} sqft</span>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">Monthly Rent</p>
                        <p className="text-lg font-black text-dark-900 leading-none">
                            {'\u20B9'}{rent.toLocaleString()}<span className="text-xs font-medium text-dark-500">/mo</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Modal({ children, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
            <div
                className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-dark-100 hover:bg-dark-200 flex items-center justify-center transition-colors"
                >
                    <svg className="w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                {children}
            </div>
        </div>
    );
}
