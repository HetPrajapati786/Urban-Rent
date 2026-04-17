import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';
import TenantPropertyCard from '../../components/tenant/TenantPropertyCard';
import { apiGet, apiPost } from '../../utils/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const boostedIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});
const verifiedIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const BHK_OPTIONS = ['Any', '1 RK', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '4+ BHK'];
const PROPERTY_TYPES = ['Any', 'House', 'Apartment', 'Shop', 'Office', 'Factory', 'Warehouse'];
const AMENITIES = [
    { id: 'parking', label: 'Parking' },
    { id: 'lift', label: 'Lift' },
    { id: 'waterSupply', label: 'Water Supply' },
    { id: 'powerBackup', label: 'Power Backup' },
    { id: 'cctv', label: 'CCTV' },
    { id: 'securityGuard', label: 'Security Guard' },
    { id: 'internet', label: 'Internet' },
    { id: 'airConditioning', label: 'A/C' },
    { id: 'fireSafety', label: 'Fire Safety' },
    { id: 'washroom', label: 'Washroom' },
];

const PROP_ICONS = {
    'Any': <svg className="w-5 h-5 mb-1 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    'House': <svg className="w-5 h-5 mb-1 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    'Apartment': <svg className="w-5 h-5 mb-1 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    'Shop': <svg className="w-5 h-5 mb-1 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
    'Office': <svg className="w-5 h-5 mb-1 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    'Factory': <svg className="w-5 h-5 mb-1 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    'Warehouse': <svg className="w-5 h-5 mb-1 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
};

// Auto-fit map to filtered properties
function FitBounds({ properties }) {
    const map = useMap();
    useEffect(() => {
        const pts = properties.filter(p => p.location?.coordinates?.lat && p.location?.coordinates?.lng);
        if (pts.length === 0) return;
        const bounds = L.latLngBounds(pts.map(p => [p.location.coordinates.lat, p.location.coordinates.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }, [properties, map]);
    return null;
}

// Safe storage getter
const getStorage = (key, defaultVal) => {
    try {
        const val = sessionStorage.getItem(key);
        return val !== null ? JSON.parse(val) : defaultVal;
    } catch {
        return defaultVal;
    }
};

export default function TenantSearch() {
    const location = useLocation();
    const isDemo = location.pathname.startsWith('/demo');

    const [properties, setProperties] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [favourites, setFavourites] = useState(new Set());
    const [showMap, setShowMap] = useState(false);
    const [sortBy, setSortBy] = useState('default');

    // Filters (Persisted via sessionStorage)
    const [q, setQ] = useState(() => getStorage('ts_q', ''));
    const [city, setCity] = useState(() => getStorage('ts_city', ''));
    const [bhk, setBhk] = useState(() => getStorage('ts_bhk', 'Any'));
    const [propType, setPropType] = useState(() => getStorage('ts_propType', 'Any'));
    const [minRent, setMinRent] = useState(() => getStorage('ts_minRent', ''));
    const [maxRent, setMaxRent] = useState(() => getStorage('ts_maxRent', ''));
    const [selectedAmenities, setSelectedAmenities] = useState(() => getStorage('ts_amenities', []));
    const [verifiedOnly, setVerifiedOnly] = useState(() => getStorage('ts_verified', false));

    // Persist filters when they change
    useEffect(() => {
        sessionStorage.setItem('ts_q', JSON.stringify(q));
        sessionStorage.setItem('ts_city', JSON.stringify(city));
        sessionStorage.setItem('ts_bhk', JSON.stringify(bhk));
        sessionStorage.setItem('ts_propType', JSON.stringify(propType));
        sessionStorage.setItem('ts_minRent', JSON.stringify(minRent));
        sessionStorage.setItem('ts_maxRent', JSON.stringify(maxRent));
        sessionStorage.setItem('ts_amenities', JSON.stringify(selectedAmenities));
        sessionStorage.setItem('ts_verified', JSON.stringify(verifiedOnly));
    }, [q, city, bhk, propType, minRent, maxRent, selectedAmenities, verifiedOnly]);

    // Init from ?q= param
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const qParam = params.get('q') || '';
        if (qParam) setQ(qParam);
    }, [location.search]);

    const fetchProperties = useCallback(async () => {
        try {
            setLoading(true);
            const data = await apiGet('/properties?status=active');
            const list = (data.properties || data || []).filter(p => p.status !== 'rented');
            setProperties(list);
        } catch {
            setProperties([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProperties();
        // Load favourites
        try {
            apiGet('/users/favourites').then(d => setFavourites(new Set((d.savedIds || []).map(String))));
        } catch {
            const saved = localStorage.getItem('ur_favourites');
            if (saved) setFavourites(new Set(JSON.parse(saved)));
        }
    }, [fetchProperties]);

    // Apply filters
    useEffect(() => {
        let result = [...properties];

        if (q.trim()) {
            const lq = q.toLowerCase();
            result = result.filter(p =>
                (p.title || '').toLowerCase().includes(lq) ||
                (p.location?.city || '').toLowerCase().includes(lq) ||
                (p.location?.area || '').toLowerCase().includes(lq) ||
                (p.propertyType || '').toLowerCase().includes(lq) ||
                (p.description || '').toLowerCase().includes(lq)
            );
        }
        if (city.trim()) {
            result = result.filter(p =>
                (p.location?.city || '').toLowerCase().includes(city.toLowerCase()) ||
                (p.location?.area || '').toLowerCase().includes(city.toLowerCase())
            );
        }
        if (propType !== 'Any') {
            result = result.filter(p => p.propertyType === propType);
        }
        if (bhk !== 'Any') {
            result = result.filter(p => {
                const bType = p.residential?.bhkType || '';
                if (bhk === '4+ BHK') return parseInt(bType) >= 4;
                return bType === bhk;
            });
        }
        if (minRent) result = result.filter(p => (p.pricing?.monthlyRent || 0) >= parseInt(minRent));
        if (maxRent) result = result.filter(p => (p.pricing?.monthlyRent || 0) <= parseInt(maxRent));
        if (verifiedOnly) result = result.filter(p => p.verified);
        if (selectedAmenities.length > 0) {
            result = result.filter(p =>
                selectedAmenities.every(a => (p.amenities || []).includes(a))
            );
        }

        // Sort
        if (sortBy === 'priceAsc') result.sort((a, b) => (a.pricing?.monthlyRent || 0) - (b.pricing?.monthlyRent || 0));
        else if (sortBy === 'priceDesc') result.sort((a, b) => (b.pricing?.monthlyRent || 0) - (a.pricing?.monthlyRent || 0));
        else if (sortBy === 'newest') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        else if (sortBy === 'views') result.sort((a, b) => (b.views || 0) - (a.views || 0));

        setFiltered(result);
    }, [q, city, propType, bhk, minRent, maxRent, verifiedOnly, selectedAmenities, sortBy, properties]);

    const toggleAmenity = (a) => {
        setSelectedAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
    };

    const handleToggleFav = async (id) => {
        try {
            await apiPost(`/users/favourites/${id}`);
        } catch { }
        setFavourites(prev => {
            const copy = new Set(prev);
            copy.has(id) ? copy.delete(id) : copy.add(id);
            localStorage.setItem('ur_favourites', JSON.stringify([...copy]));
            return copy;
        });
    };

    const clearFilters = () => {
        setQ(''); setCity(''); setBhk('Any'); setPropType('Any');
        setMinRent(''); setMaxRent('');
        setSelectedAmenities([]); setVerifiedOnly(false);
        setSortBy('default');
    };

    const activeFiltersCount = [
        q, city, bhk !== 'Any' ? bhk : '', propType !== 'Any' ? propType : '',
        minRent, maxRent, verifiedOnly ? '1' : '', ...selectedAmenities,
    ].filter(Boolean).length;

    // Properties with coordinates for map
    const mappableProps = filtered.filter(p => p.location?.coordinates?.lat && p.location?.coordinates?.lng);
    const mapCenter = mappableProps.length > 0
        ? [mappableProps[0].location.coordinates.lat, mappableProps[0].location.coordinates.lng]
        : [20.5937, 78.9629]; // India center

    return (
        <TenantLayout 
            searchValue={q}
            onSearchChange={setQ}
            breadcrumbs={[
            { label: 'Home', href: isDemo ? '/demo/tenant' : '/tenant/dashboard' },
            { label: 'Search' },
        ]}>
            <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
                {/* ── Sidebar Filters ── */}
                <aside className="lg:w-[320px] flex-shrink-0 h-full">
                    <div className="bg-white rounded-3xl border border-dark-100 flex flex-col shadow-sm h-full" style={{ overflow: 'hidden' }}>
                        {/* Scrollable filter content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 pb-2">
                        {/* Location */}
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-dark-900 mb-2.5">Location</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                    <svg className="w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <input value={city} onChange={e => setCity(e.target.value)}
                                    placeholder="Los Angeles, Mumbai..."
                                    className="w-full pl-10 pr-3 py-3 border border-dark-200 rounded-2xl text-sm font-medium outline-none focus:border-dark-900 focus:ring-1 focus:ring-dark-900 bg-white placeholder-dark-300 transition-all hover:border-dark-300"
                                />
                            </div>
                        </div>

                        {/* Property Type Grid */}
                        <div className="mb-6 pt-5 border-t border-dark-100">
                            <label className="block text-xs font-bold text-dark-900 mb-3">Property Type</label>
                            <div className="grid grid-cols-2 gap-2.5">
                                {PROPERTY_TYPES.map(opt => (
                                    <button key={opt} onClick={() => setPropType(opt)}
                                        className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl border-2 transition-all active:scale-95 ${propType === opt ? 'border-dark-900 bg-dark-50 text-dark-900' : 'border-dark-100 text-dark-500 hover:border-dark-200 hover:bg-dark-50'}`}
                                    >
                                        <div className={propType === opt ? "text-dark-900" : "text-dark-500"}>
                                            {PROP_ICONS[opt]}
                                        </div>
                                        <span className="text-[11px] font-bold mt-1">{opt}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Rent Range */}
                        <div className="mb-6 pt-5 border-t border-dark-100">
                            <label className="block text-xs font-bold text-dark-900 mb-3">Price Range (Monthly)</label>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 text-xs font-bold">₹</span>
                                    <input type="number" value={minRent} onChange={e => setMinRent(e.target.value)}
                                        placeholder="Min"
                                        className="w-full pl-7 pr-3 py-2.5 border border-dark-200 rounded-xl text-sm font-medium outline-none focus:border-dark-900 focus:ring-1 focus:ring-dark-900 bg-white placeholder-dark-300"
                                    />
                                </div>
                                <div className="text-dark-300 flex items-center">-</div>
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 text-xs font-bold">₹</span>
                                    <input type="number" value={maxRent} onChange={e => setMaxRent(e.target.value)}
                                        placeholder="Max"
                                        className="w-full pl-7 pr-3 py-2.5 border border-dark-200 rounded-xl text-sm font-medium outline-none focus:border-dark-900 focus:ring-1 focus:ring-dark-900 bg-white placeholder-dark-300"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* BHK Select */}
                        <div className="mb-6 pt-5 border-t border-dark-100">
                            <label className="block text-xs font-bold text-dark-900 mb-3">Bedrooms</label>
                            <select 
                                value={bhk} 
                                onChange={e => setBhk(e.target.value)}
                                className="w-full px-3 py-3 border border-dark-200 rounded-xl text-sm font-semibold outline-none focus:border-dark-900 focus:ring-1 focus:ring-dark-900 bg-white cursor-pointer"
                            >
                                {BHK_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt === 'Any' ? 'Any beds' : opt}</option>
                                ))}
                            </select>
                        </div>

                        {/* Amenities */}
                        <div className="mb-6 pt-5 border-t border-dark-100">
                            <label className="block text-xs font-bold text-dark-900 mb-3">Amenities</label>
                            <div className="flex flex-wrap gap-2">
                                {AMENITIES.map(a => (
                                    <button key={a.id} onClick={() => toggleAmenity(a.id)}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-bold transition-all active:scale-95 ${selectedAmenities.includes(a.id)
                                            ? 'border-dark-900 bg-dark-900 text-white'
                                            : 'border-dark-200 bg-white text-dark-600 hover:border-dark-300 hover:bg-dark-50'
                                        }`}
                                    >
                                        {a.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        </div>

                        {/* Actions - sticky at bottom, always visible */}
                        <div className="flex-shrink-0 px-5 py-4 border-t border-dark-100 bg-white rounded-b-3xl flex gap-3">
                            <button onClick={() => {
                                // Simulate Apply button behavior by scrolling up to results logic
                                const resultsEl = document.getElementById('search-results-container');
                                if (resultsEl) resultsEl.scrollTo({ top: 0, behavior: 'smooth' });
                            }} className="flex-[2] py-3.5 bg-dark-900 text-white rounded-xl font-bold text-sm tracking-wide shadow-md hover:bg-dark-800 active:scale-95 transition-all">
                                APPLY
                            </button>
                            <button onClick={clearFilters} className="flex-1 py-3.5 bg-white border border-dark-200 text-dark-600 rounded-xl font-bold text-sm hover:bg-dark-50 hover:border-dark-300 hover:text-dark-900 active:scale-95 transition-all">
                                Reset Filters
                            </button>
                        </div>
                    </div>
                </aside>

                {/* ── Results ── */}
                <div className="flex-1 min-w-0 flex flex-col h-full min-h-0">
                    {/* Toolbar - stays fixed */}
                    <div className="flex-shrink-0 flex items-center justify-between mb-4 flex-wrap gap-3">
                        <h1 className="text-lg font-bold text-dark-900">
                            {loading ? 'Searching...' : `${filtered.length} ${filtered.length === 1 ? 'result' : 'results'} found`}
                        </h1>
                        <div className="flex items-center gap-3">
                            {/* Sort */}
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                                className="px-3 py-2 border border-dark-200 rounded-xl text-sm outline-none focus:border-primary-500 bg-white text-dark-700"
                            >
                                <option value="default">Sort: Default</option>
                                <option value="priceAsc">Price: Low to High</option>
                                <option value="priceDesc">Price: High to Low</option>
                                <option value="newest">Newest First</option>
                                <option value="views">Most Viewed</option>
                            </select>

                            {/* Map toggle */}
                            <button
                                onClick={() => setShowMap(v => !v)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${showMap ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-dark-600 border-dark-200 hover:border-primary-400'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                {showMap ? 'Hide Map' : 'Show Map'}
                            </button>
                        </div>
                    </div>

                    {/* Scrollable content area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pr-1" id="search-results-container">

                    {/* ── Leaflet Map ── */}
                    {showMap && (
                        <div className="mb-6 rounded-2xl overflow-hidden border border-dark-100 shadow-sm" style={{ height: '360px' }}>
                            {mappableProps.length === 0 ? (
                                <div className="h-full flex items-center justify-center bg-dark-50">
                                    <div className="text-center">
                                        <svg className="w-10 h-10 text-dark-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                        </svg>
                                        <p className="text-dark-400 text-sm">No properties with map coordinates found.</p>
                                        <p className="text-dark-300 text-xs mt-1">Managers need to pin their location on the map when listing.</p>
                                    </div>
                                </div>
                            ) : (
                                <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    />
                                    <FitBounds properties={mappableProps} />
                                    {mappableProps.map(p => (
                                        <Marker
                                            key={p._id}
                                            position={[p.location.coordinates.lat, p.location.coordinates.lng]}
                                            icon={p.verified ? verifiedIcon : p.boosted ? boostedIcon : new L.Icon.Default()}
                                        >
                                            <Popup>
                                                <div className="w-[320px] overflow-hidden rounded-xl bg-white shadow-lg" style={{ margin: '-14px -20px -14px -20px' }}>
                                                    <Link 
                                                        to={isDemo ? `/demo/tenant/properties/${p._id}` : `/tenant/properties/${p._id}`}
                                                        className="flex items-stretch group"
                                                    >
                                                        {/* Image on Left - matches stretching height */}
                                                        <div className="relative w-[120px] flex-shrink-0 bg-dark-50 overflow-hidden">
                                                            {p.images?.[0]?.url ? (
                                                                <img src={p.images[0].url} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                            ) : (
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <svg className="w-8 h-8 text-dark-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                </div>
                                                            )}
                                                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                                                                {p.verified && <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded shadow-sm leading-none z-10">VERIFIED</span>}
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Info on Right */}
                                                        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                                                            <div>
                                                                <p className="font-bold text-sm text-dark-900 leading-tight group-hover:text-primary-600 transition-colors line-clamp-1 mb-1">{p.title}</p>
                                                                <div className="flex items-center gap-1 text-dark-400">
                                                                    <svg className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                                                                    <span className="text-xs truncate">{p.location?.area}, {p.location?.city}</span>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex items-end justify-between mt-3">
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider leading-none">Rent</span>
                                                                    <span className="text-primary-600 font-black text-sm leading-none">₹{(p.pricing?.monthlyRent || 0).toLocaleString()}</span>
                                                                </div>
                                                                <span className="flex-shrink-0 bg-primary-50 text-primary-600 rounded-full p-1.5 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            )}
                        </div>
                    )}

                    {/* Loading skeletons */}
                    {loading && (
                        <div className="grid sm:grid-cols-2 gap-5">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-white rounded-2xl border border-dark-100 overflow-hidden animate-pulse">
                                    <div className="aspect-[4/3] bg-dark-100" />
                                    <div className="p-4 space-y-2">
                                        <div className="h-3 bg-dark-100 rounded w-1/2" />
                                        <div className="h-4 bg-dark-100 rounded w-3/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && filtered.length === 0 && (
                        <div className="bg-white rounded-2xl border border-dark-100 p-12 text-center">
                            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-dark-900 mb-2">No Results</h3>
                            <p className="text-dark-400 text-sm mb-4">Try broadening your search or clearing some filters.</p>
                            <button onClick={clearFilters} className="text-sm text-primary-600 font-semibold hover:underline">Clear all filters</button>
                        </div>
                    )}

                    {/* Results grid */}
                    {!loading && filtered.length > 0 && (
                        <div className="grid sm:grid-cols-2 gap-5 pb-4">
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
                    )}
                    </div>
                </div>
            </div>
        </TenantLayout>
    );
}
