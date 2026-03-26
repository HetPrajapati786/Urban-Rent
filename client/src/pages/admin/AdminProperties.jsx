import { useState, useEffect, useCallback } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { apiGet, apiPatch } from '../../utils/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const STATUS_TABS = [
    { key: 'all', label: 'All', color: 'bg-dark-100 text-dark-700 border-dark-200' },
    { key: 'active', label: 'Active', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { key: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { key: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200' },
];

const STATUS_BADGE = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    paused: 'bg-dark-100 text-dark-600 border-dark-200',
};

export default function AdminProperties() {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const isDemo = location.pathname.startsWith('/demo');

    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(searchParams.get('status') || 'all');
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(null); // property id being actioned
    const [showRejectModal, setShowRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [counts, setCounts] = useState({ pending: 0, active: 0, rejected: 0, all: 0 });
    
    // Map View State
    const [isMapView, setIsMapView] = useState(false);
    const [mapFilters, setMapFilters] = useState({ verifiedOnly: false, unverifiedOnly: false });

    // Map custom icon
    const customIcon = new L.Icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
    });

    const fetchProperties = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('status', activeTab);
            if (search) params.set('search', search);
            params.set('limit', '50');

            const data = await apiGet(`/admin/properties?${params.toString()}`);
            setProperties(data.properties || []);

            // Also fetch counts for tabs
            const statsData = await apiGet('/admin/stats');
            setCounts({
                pending: statsData.pendingProperties,
                active: statsData.activeProperties,
                rejected: statsData.rejectedProperties,
                all: statsData.totalProperties,
            });
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [activeTab, search]);

    useEffect(() => {
        fetchProperties();
    }, [fetchProperties]);

    const handleApprove = async (id) => {
        setActionLoading(id);
        try {
            await apiPatch(`/admin/properties/${id}/approve`);
            fetchProperties();
        } catch (err) {
            alert('Failed to approve: ' + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        if (!showRejectModal) return;
        setActionLoading(showRejectModal);
        try {
            await apiPatch(`/admin/properties/${showRejectModal}/reject`, { reason: rejectReason });
            setShowRejectModal(null);
            setRejectReason('');
            fetchProperties();
        } catch (err) {
            alert('Failed to reject: ' + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearchParams({ status: tab });
    };

    return (
        <AdminLayout
            breadcrumbs={[
                { label: 'Dashboard', href: isDemo ? '/demo/admin' : '/admin/dashboard' },
                { label: 'All Properties' },
            ]}
        >
            <div className="flex flex-col h-full min-h-0 gap-4">
                {/* Header */}
                <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-dark-900">Property Management</h1>
                        <p className="text-dark-400 text-sm mt-0.5">Review, approve, or reject property listings</p>
                    </div>
                    {/* Search */}
                    <div className="relative w-full sm:w-72">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            placeholder="Search by title or location..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-dark-200 rounded-xl text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10"
                        />
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="flex-shrink-0 flex items-center gap-2 flex-wrap">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${activeTab === tab.key
                                ? `${tab.color} shadow-sm`
                                : 'bg-white text-dark-500 border-dark-100 hover:border-dark-300'
                                }`}
                        >
                            {tab.label}
                            <span className="ml-1.5 bg-white/60 px-1.5 py-0.5 rounded-md text-[10px]">
                                {counts[tab.key] ?? 0}
                            </span>
                        </button>
                    ))}
                    
                    <button
                        onClick={() => setIsMapView(!isMapView)}
                        className={`ml-auto px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-colors ${
                            isMapView ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-dark-200 text-dark-700 hover:bg-dark-50'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A2 2 0 013 15.487V5.461a2 2 0 012.764-1.843L11 6l5.447-2.724A2 2 0 0119 5.093v10.026a2 2 0 01-1.236 1.843L12 20m0 0V6" /></svg>
                        {isMapView ? 'List View' : 'Map View'}
                    </button>
                </div>

                {isMapView && (
                    <div className="bg-white p-4 rounded-xl border border-dark-100 flex items-center gap-4 flex-wrap shadow-sm">
                        <span className="text-xs font-bold text-dark-800 flex items-center gap-1">
                            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                            Admin Filters:
                        </span>
                        <label className="flex items-center gap-2 text-sm text-dark-600 cursor-pointer">
                            <input type="checkbox" checked={mapFilters.verifiedOnly} onChange={e => setMapFilters({ ...mapFilters, verifiedOnly: e.target.checked })} className="rounded text-primary-600 focus:ring-primary-500" />
                            Verified Only
                        </label>
                        <label className="flex items-center gap-2 text-sm text-dark-600 cursor-pointer">
                            <input type="checkbox" checked={mapFilters.unverifiedOnly} onChange={e => setMapFilters({ ...mapFilters, unverifiedOnly: e.target.checked })} className="rounded text-primary-600 focus:ring-primary-500" />
                            Unverified Only
                        </label>
                        <span className="ml-auto text-xs text-dark-400 italic">Showing {properties.filter(p => p.location?.coordinates?.lat && p.location?.coordinates?.lng).length} out of {properties.length} properties active on map</span>
                    </div>
                )}

                {/* Properties View - scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
                        </div>
                    ) : properties.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="text-4xl mb-3"></div>
                            <p className="text-dark-500 font-medium">
                                {activeTab === 'pending' ? 'No pending properties!' : `No ${activeTab} properties found`}
                            </p>
                        </div>
                    ) : isMapView ? (
                        <div className="h-[650px] relative">
                            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                                {properties
                                    .filter(p => p.location?.coordinates?.lat && p.location?.coordinates?.lng)
                                    .filter(p => {
                                        if (mapFilters.verifiedOnly && !p.verified) return false;
                                        if (mapFilters.unverifiedOnly && p.verified) return false;
                                        return true;
                                    })
                                    .map(p => (
                                        <Marker key={p._id} position={[p.location.coordinates.lat, p.location.coordinates.lng]} icon={customIcon}>
                                            <Popup>
                                                <div className="p-1 min-w-[200px]">
                                                    {p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="w-full h-24 object-cover rounded-md mb-2" />}
                                                    <h3 className="font-bold text-dark-900 leading-tight">{p.title}</h3>
                                                    <p className="text-dark-500 text-xs mt-1">{p.location?.city}</p>
                                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-dark-100">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[p.status]}`}>{p.status}</span>
                                                        <span className="font-bold text-primary-600">₹{p.pricing?.monthlyRent}</span>
                                                    </div>
                                                    <Link to={isDemo ? `/demo/admin/properties/${p._id}` : `/admin/properties/${p._id}`} className="block w-full text-center mt-3 bg-dark-900 text-white py-1.5 rounded-md text-xs font-bold hover:bg-dark-800">
                                                        View Details
                                                    </Link>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}
                            </MapContainer>
                        </div>
                    ) : (
                        <>
                            {/* Table Header */}
                            <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-dark-50 border-b border-dark-100 text-[10px] font-bold text-dark-400 uppercase tracking-widest">
                                <div className="col-span-4">Property</div>
                                <div className="col-span-2">Manager</div>
                                <div className="col-span-2">Rent</div>
                                <div className="col-span-1">Status</div>
                                <div className="col-span-3 text-right">Actions</div>
                            </div>

                            {/* Rows */}
                            <div className="divide-y divide-dark-50">
                                {properties.map((prop) => {
                                    const isActioning = actionLoading === prop._id;
                                    return (
                                        <div key={prop._id} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 items-center hover:bg-dark-50/50 transition-colors">
                                            {/* Property Info */}
                                            <div className="col-span-4 flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-dark-100 flex-shrink-0">
                                                    <img
                                                        src={prop.images?.[0]?.url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=100&h=100&fit=crop'}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-dark-900 text-sm truncate hover:text-red-600 transition-colors">
                                                        <Link to={`${isDemo ? '/demo/admin' : '/admin'}/properties/${prop._id}`}>{prop.title}</Link>
                                                    </h3>
                                                    <p className="text-dark-400 text-xs truncate">
                                                        {prop.location?.area}, {prop.location?.city}
                                                    </p>
                                                    <p className="text-dark-300 text-[10px]">
                                                        {prop.propertyType} · {new Date(prop.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Manager */}
                                            <div className="col-span-2">
                                                <p className="text-dark-700 text-xs font-semibold">
                                                    {prop.owner?.firstName} {prop.owner?.lastName}
                                                </p>
                                                <p className="text-dark-400 text-[10px] truncate">{prop.owner?.email}</p>
                                            </div>

                                            {/* Rent */}
                                            <div className="col-span-2">
                                                <p className="text-dark-900 font-bold text-sm">₹{prop.pricing?.monthlyRent?.toLocaleString()}</p>
                                                <p className="text-dark-400 text-[10px]">per month</p>
                                            </div>

                                            {/* Status */}
                                            <div className="col-span-1">
                                                <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${STATUS_BADGE[prop.status] || STATUS_BADGE.paused}`}>
                                                    {prop.status}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="col-span-3 flex items-center justify-end gap-2">
                                                {prop.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(prop._id)}
                                                            disabled={isActioning}
                                                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
                                                        >
                                                            {isActioning ? (
                                                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            ) : (
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                            )}
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => setShowRejectModal(prop._id)}
                                                            disabled={isActioning}
                                                            className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {prop.status === 'active' && (
                                                    <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                                                        Approved
                                                    </span>
                                                )}
                                                {prop.status === 'rejected' && (
                                                    <button
                                                        onClick={() => handleApprove(prop._id)}
                                                        disabled={isActioning}
                                                        className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-200 hover:bg-blue-100 transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        Re-approve
                                                    </button>
                                                )}
                                                <Link
                                                    to={`${isDemo ? '/demo/admin' : '/admin'}/properties/${prop._id}`}
                                                    className="px-3 py-1.5 bg-dark-50 text-dark-600 text-xs font-bold rounded-lg border border-dark-200 hover:bg-dark-100 transition-all"
                                                >
                                                    View
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
                </div>
            </div>

            {/* Reject Confirmation Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !actionLoading && setShowRejectModal(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-dark-900 text-center mb-1">Reject Property</h3>
                        <p className="text-dark-400 text-xs text-center mb-4">This property will not appear in tenant listings.</p>

                        <div className="mb-5">
                            <label className="block text-xs font-semibold text-dark-500 uppercase tracking-wider mb-1.5">Reason (optional)</label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="e.g. Incomplete information, unclear photos..."
                                rows={3}
                                className="w-full px-3 py-2.5 border border-dark-200 rounded-xl text-sm outline-none focus:border-red-400 resize-none bg-dark-50"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowRejectModal(null); setRejectReason(''); }}
                                disabled={!!actionLoading}
                                className="flex-1 py-2.5 rounded-xl font-bold text-dark-700 bg-dark-50 border border-dark-200 hover:bg-dark-100 transition-all text-sm disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!!actionLoading}
                                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 text-sm disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? (
                                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Rejecting...</>
                                ) : 'Reject Property'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
