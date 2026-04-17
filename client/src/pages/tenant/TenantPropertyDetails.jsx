import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { SignInButton } from '@clerk/clerk-react';
import TenantLayout from '../../layouts/TenantLayout';
import PropertyMediaGallery from '../../components/PropertyMediaGallery';
import TenantPropertyCard from '../../components/tenant/TenantPropertyCard';
import PropertyReviews from '../../components/tenant/PropertyReviews';
import { apiGet, apiPost } from '../../utils/api';
import { isImpersonating as isImpersonating_fn } from '../../utils/impersonation';

// Fix default Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AMENITIES_DATA = {
    parking: { label: 'Parking', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v10m0-10h4a3 3 0 010 6H8" /><rect x="2" y="2" width="20" height="20" rx="3" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></svg> },
    lift: { label: 'Lift/Elevator', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={1.5} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v18" /></svg> },
    waterSupply: { label: '24/7 Water', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21c-3.5 0-6-2.5-6-6 0-4 6-11 6-11s6 7 6 11c0 3.5-2.5 6-6 6z" /></svg> },
    powerBackup: { label: 'Power Backup', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg> },
    cctv: { label: 'CCTV', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
    securityGuard: { label: 'Security', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
    internet: { label: 'Wi-Fi', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" /></svg> },
    airConditioning: { label: 'AC', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg> },
    fireSafety: { label: 'Fire Safety', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg> },
    washroom: { label: 'Washroom', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h18M3 12v4a4 4 0 004 4h10a4 4 0 004-4v-4" /></svg> },
};

function InfoRow({ label, value }) {
    if (!value) return null;
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-dark-50 last:border-0">
            <span className="text-dark-400 text-sm">{label}</span>
            <span className="text-dark-900 font-bold text-sm capitalize">{value.toString()}</span>
        </div>
    );
}

export default function TenantPropertyDetails() {
    const { id } = useParams();
    const location = useLocation();
    const isDemo = location.pathname.startsWith('/demo');
    const isImpersonating = isImpersonating_fn();
    const isRestrictedDemo = isDemo && !isImpersonating;

    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [suggestions, setSuggestions] = useState([]);

    const [isFav, setIsFav] = useState(false);
    const [localFavs, setLocalFavs] = useState([]);

    // Apply modal state
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [applyForm, setApplyForm] = useState({ 
        message: '', 
        moveInDate: '', 
        leaseDuration: '',
        maritalStatus: 'Single',
        employmentStatus: 'Employed',
        companyName: '',
        familySize: 1,
        pets: false,
        businessType: '',
        yearsInBusiness: 1,
        reasonForMoving: ''
    });
    const [applying, setApplying] = useState(false);
    const [applySuccess, setApplySuccess] = useState(false);
    const [applyError, setApplyError] = useState('');

    // Contact modal state
    const [showContactModal, setShowContactModal] = useState(false);

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

    useEffect(() => {
        fetchProperty();
        // Check favourite status
        const favs = JSON.parse(localStorage.getItem('urbanrent_favourites') || '[]');
        setIsFav(favs.includes(id));
        setLocalFavs(favs);
    }, [id]);

    // Track property view (once per page load, tenant only)
    useEffect(() => {
        if (!isDemo && id) {
            apiPost(`/properties/${id}/view`).catch(() => {});
        }
    }, [id, isDemo]);

    const fetchProperty = async () => {
        try {
            setLoading(true);
            const data = await apiGet(`/properties/${id}`);
            setProperty(data.property);
            
            // Fetch suggestions (excluding current)
            try {
                const limit = 4;
                const res = await apiGet(`/properties?status=active&limit=${limit}`);
                const others = (res.properties || []).filter(p => p._id !== id).slice(0, 2);
                setSuggestions(others);
            } catch(e) { console.error('Suggestions:', e); }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleFavouriteCard = (propertyId) => {
        const favs = JSON.parse(localStorage.getItem('urbanrent_favourites') || '[]');
        let updated;
        if (favs.includes(propertyId)) {
            updated = favs.filter(f => f !== propertyId);
        } else {
            updated = [...favs, propertyId];
        }
        localStorage.setItem('urbanrent_favourites', JSON.stringify(updated));
        setLocalFavs(updated);
    };

    const toggleFavourite = () => {
        if (isRestrictedDemo) return; // Wait, actually let's wrap the favourite button in SignInButton instead if it's restricted, or keep local. Let's keep favourite working locally since it doesn't do API calls. Wait, the user said "other features as well should not work". Let's restrict it if needed, or deal with CTA buttons first.
        const favs = JSON.parse(localStorage.getItem('urbanrent_favourites') || '[]');
        let updated;
        if (favs.includes(id)) {
            updated = favs.filter(f => f !== id);
        } else {
            updated = [...favs, id];
        }
        localStorage.setItem('urbanrent_favourites', JSON.stringify(updated));
        setIsFav(!isFav);
        setLocalFavs(updated);
    };

    const handleApply = async (e) => {
        e.preventDefault();
        setApplying(true);
        setApplyError('');
        try {
            await apiPost('/applications', {
                propertyId: id,
                message: applyForm.message,
                moveInDate: applyForm.moveInDate || undefined,
                leaseDuration: applyForm.leaseDuration ? parseInt(applyForm.leaseDuration) : undefined,
                formDetails: {
                    maritalStatus: applyForm.maritalStatus,
                    employmentStatus: applyForm.employmentStatus,
                    companyName: applyForm.companyName,
                    familySize: Number(applyForm.familySize),
                    pets: applyForm.pets,
                    businessType: applyForm.businessType,
                    yearsInBusiness: Number(applyForm.yearsInBusiness),
                    reasonForMoving: applyForm.reasonForMoving
                }
            });
            setApplySuccess(true);
        } catch (err) {
            setApplyError(err.message);
        } finally {
            setApplying(false);
        }
    };

    /* ── Loading ── */
    if (loading) {
        return (
            <TenantLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                </div>
            </TenantLayout>
        );
    }

    /* ── Error ── */
    if (error || !property) {
        return (
            <TenantLayout>
                <div className="max-w-4xl mx-auto py-12 px-4 text-center">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-dark-900 mb-2">Property Not Found</h2>
                    <p className="text-dark-500 mb-6">{error || "This property doesn't exist or has been removed."}</p>
                    <Link to={isDemo ? '/demo/tenant/properties' : '/tenant/properties'} className="bg-primary-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-700 transition-colors">
                        Browse Properties
                    </Link>
                </div>
            </TenantLayout>
        );
    }

    const images = property.images || [];
    const loc = property.location;
    const isResidential = !['Shop', 'Office', 'Factory', 'Warehouse'].includes(property.propertyType);
    const ownerName = property.owner?.firstName
        ? `${property.owner.firstName} ${property.owner.lastName || ''}`.trim()
        : property.ownership?.ownerName || 'Property Manager';

    return (
        <TenantLayout
            breadcrumbs={[
                { label: 'Home', href: isDemo ? '/demo/tenant' : '/tenant/dashboard' },
                { label: 'Properties', href: isDemo ? '/demo/tenant/properties' : '/tenant/properties' },
                { label: property.title },
            ]}
        >
            <div className="max-w-7xl mx-auto pb-12">
                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            {property.verified && (
                                <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                                    Verified
                                </span>
                            )}
                            {property.boosted && (
                                <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                    Featured
                                </span>
                            )}
                            <span className="bg-primary-50 text-primary-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-primary-100">
                                {property.propertyType}
                            </span>
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold text-dark-900">{property.title}</h1>
                        <div className="flex items-center gap-2 text-dark-500">
                            <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                            <span className="text-sm font-medium">
                                {loc?.area}, {loc?.city}, {loc?.state}
                            </span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3">
                        {isRestrictedDemo ? (
                            <SignInButton mode="modal">
                                <button className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all active:scale-90 ${isFav ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-white border-dark-200 text-dark-400 hover:border-rose-300 hover:text-rose-400'}`}>
                                    <svg className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </button>
                            </SignInButton>
                        ) : (
                            <button
                                onClick={toggleFavourite}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all active:scale-90 ${isFav ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-white border-dark-200 text-dark-400 hover:border-rose-300 hover:text-rose-400'}`}
                            >
                                <svg className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={() => {
                                const text = `Check out this property: ${property.title} - ${loc?.area}, ${loc?.city}`;
                                navigator.share?.({ title: property.title, text, url: window.location.href }) || navigator.clipboard.writeText(window.location.href);
                            }}
                            className="w-9 h-9 rounded-lg flex items-center justify-center border border-dark-200 bg-white text-dark-400 hover:border-primary-300 hover:text-primary-500 transition-all active:scale-90"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    {/* ── Left Column: Media & Details ── */}
                    <div className="lg:col-span-2 space-y-6 min-w-0">
                        {/* Image Gallery */}
                        <PropertyMediaGallery images={images} video={property.video} title={property.title} />

                        {/* Key Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {isResidential && (
                                <>
                                    <div className="bg-white p-4 rounded-xl border border-dark-100 text-center">
                                        <p className="text-2xl font-black text-dark-900">{property.residential?.totalRooms || '-'}</p>
                                        <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-1">Bedrooms</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-dark-100 text-center">
                                        <p className="text-2xl font-black text-dark-900">{property.residential?.bathrooms || '-'}</p>
                                        <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-1">Bathrooms</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-dark-100 text-center">
                                        <p className="text-2xl font-black text-dark-900">{property.residential?.balconies || '-'}</p>
                                        <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-1">Balconies</p>
                                    </div>
                                </>
                            )}
                            <div className="bg-white p-4 rounded-xl border border-dark-100 text-center">
                                <p className="text-2xl font-black text-dark-900">{property.commercial?.totalArea || '-'}</p>
                                <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-1">{property.commercial?.areaUnit || 'sq ft'}</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white p-6 rounded-2xl border border-dark-100">
                            <h2 className="text-lg font-black text-dark-900 mb-3 flex items-center gap-2">
                                <span className="w-1 h-5 bg-primary-500 rounded-full" />
                                About this Property
                            </h2>
                            <p className="text-dark-600 leading-relaxed whitespace-pre-wrap text-sm">{property.description}</p>
                        </div>

                        {/* Property Specs */}
                        <div className="bg-white p-6 rounded-2xl border border-dark-100">
                            <h2 className="text-lg font-black text-dark-900 mb-3 flex items-center gap-2">
                                <span className="w-1 h-5 bg-primary-500 rounded-full" />
                                Property Details
                            </h2>
                            <div className="grid md:grid-cols-2 gap-x-8">
                                <div>
                                    <InfoRow label="Property Type" value={property.propertyType} />
                                    <InfoRow label="Listing Type" value={property.listingType} />
                                    {isResidential && (
                                        <>
                                            <InfoRow label="BHK Type" value={property.residential?.bhkType} />
                                            <InfoRow label="Furnishing" value={property.residential?.furnishing} />
                                            <InfoRow label="Floor Number" value={property.residential?.floorNumber} />
                                            <InfoRow label="Total Floors" value={property.residential?.totalFloors} />
                                        </>
                                    )}
                                </div>
                                <div>
                                    {!isResidential && (
                                        <>
                                            <InfoRow label="Total Area" value={`${property.commercial?.totalArea} ${property.commercial?.areaUnit}`} />
                                            <InfoRow label="Parking" value={property.commercial?.parkingAvailability ? 'Available' : 'No'} />
                                            <InfoRow label="Power Supply" value={property.commercial?.powerSupplyCapacity} />
                                        </>
                                    )}
                                    <InfoRow label="Available From" value={property.pricing?.availableFrom ? new Date(property.pricing.availableFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Immediate'} />
                                    <InfoRow label="Pets Allowed" value={property.additional?.petAllowed ? 'Yes' : 'No'} />
                                    <InfoRow label="Smoking Allowed" value={property.additional?.smokingAllowed ? 'Yes' : 'No'} />
                                    {property.additional?.nearbyLandmarks && (
                                        <InfoRow label="Nearby Landmarks" value={property.additional.nearbyLandmarks} />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Amenities */}
                        {property.amenities?.length > 0 && (
                            <div className="bg-white p-6 rounded-2xl border border-dark-100">
                                <h2 className="text-lg font-black text-dark-900 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-5 bg-primary-500 rounded-full" />
                                    Amenities & Features
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {property.amenities.map((amenity, idx) => {
                                        const ad = AMENITIES_DATA[amenity];
                                        return (
                                            <div key={idx} className="flex items-center gap-2.5 p-3 rounded-xl bg-dark-50 border border-dark-100 text-dark-700 text-xs font-medium">
                                                <span className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-primary-600">
                                                    {ad?.icon || ''}
                                                </span>
                                                {ad?.label || amenity}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Map */}
                        <div className="bg-white p-6 rounded-2xl border border-dark-100">
                            <h2 className="text-lg font-black text-dark-900 mb-4 flex items-center gap-2">
                                <span className="w-1 h-5 bg-primary-500 rounded-full" />
                                Location on Map
                            </h2>
                            <div className="h-[350px] rounded-xl overflow-hidden border border-dark-100" style={{ position: 'relative', zIndex: 1 }}>
                                {loc?.coordinates?.lat && loc?.coordinates?.lng ? (
                                    <MapContainer center={[loc.coordinates.lat, loc.coordinates.lng]} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                                        <Marker position={[loc.coordinates.lat, loc.coordinates.lng]} icon={customIcon}>
                                            <Popup>
                                                <strong>{property.title}</strong><br />
                                                {loc.area}, {loc.city}
                                            </Popup>
                                        </Marker>
                                    </MapContainer>
                                ) : (
                                    <div className="w-full h-full bg-dark-50 flex items-center justify-center text-dark-400 flex-col gap-2">
                                        <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A2 2 0 013 15.487V5.461a2 2 0 012.764-1.843L11 6l5.447-2.724A2 2 0 0119 5.093v10.026a2 2 0 01-1.236 1.843L12 20m0 0V6" /></svg>
                                        <p className="text-xs font-semibold">Map location not available</p>
                                        <p className="text-[10px] text-dark-300">{loc?.fullAddress}</p>
                                    </div>
                                )}
                            </div>
                            {loc?.fullAddress && (
                                <p className="text-dark-500 text-xs mt-3 flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5 text-dark-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                    </svg>
                                    {loc.fullAddress}, {loc.pinCode}
                                </p>
                            )}
                        </div>

                        {/* Interactive Ratings & Reviews Module */}
                        {!isDemo && <PropertyReviews propertyId={property._id} />}
                    </div>

                    {/* ── Right Column: Pricing & CTA ── */}
                    <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-4 self-start">
                        {/* Price Card */}
                        <div className="bg-white rounded-2xl border border-dark-100 p-5 shadow-sm">
                            <div className="mb-4">
                                <span className="text-dark-400 text-xs font-medium block mb-1">Monthly Rent</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-dark-900">₹{property.pricing?.monthlyRent?.toLocaleString()}</span>
                                    <span className="text-dark-400 font-medium text-sm">/month</span>
                                </div>
                            </div>

                            <div className="space-y-0 mb-5">
                                <div className="flex items-center justify-between py-2 border-b border-dark-50">
                                    <span className="text-dark-400 text-[13px]">Security Deposit</span>
                                    <span className="text-dark-900 font-semibold text-[13px]">₹{property.pricing?.securityDeposit?.toLocaleString() || '0'}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-dark-50">
                                    <span className="text-dark-400 text-[13px]">Maintenance</span>
                                    <span className="text-dark-900 font-semibold text-[13px]">₹{property.pricing?.maintenanceCharges?.toLocaleString() || '0'}</span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-dark-400 text-[13px]">Min. Lease</span>
                                    <span className="text-dark-900 font-semibold text-[13px]">{property.pricing?.minimumLeaseDuration || '-'} months</span>
                                </div>
                            </div>

                            {/* CTA Buttons */}
                            <div className="space-y-3">
                                {property.status === 'rented' ? (
                                    <>
                                        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-left shadow-sm mb-3 text-[11px] text-indigo-800 flex gap-2 items-start">
                                            <svg className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            <div>
                                                <strong className="font-bold">Property Currently Occupied.</strong>
                                                <br />
                                                {property.leaseEndsAt 
                                                    ? `Expected to be available around ${new Date(property.leaseEndsAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}. `
                                                    : 'Currently rented. '}
                                                Apply now to secure your spot when it becomes available.
                                            </div>
                                        </div>
                                        {isRestrictedDemo ? (
                                            <SignInButton mode="modal">
                                                <button className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/15 active:scale-[0.98] flex items-center justify-center gap-2 text-sm">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    Advance Apply
                                                </button>
                                            </SignInButton>
                                        ) : (
                                            <button
                                                onClick={() => setShowApplyModal(true)}
                                                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/15 active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                Advance Apply
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {property.status === 'awaiting_payment' && (
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-3 flex items-start gap-2 shadow-sm text-left">
                                                <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                <div className="text-amber-800 text-[11px] leading-tight">
                                                    <span className="font-bold">Waitlist Open:</span> Another tenant's payment is pending. You can still apply, and you'll be considered if their 7-day payment window expires.
                                                </div>
                                            </div>
                                        )}
                                        {isRestrictedDemo ? (
                                            <SignInButton mode="modal">
                                                <button className={`w-full py-2.5 text-white rounded-xl font-semibold transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 text-sm ${property.status === 'awaiting_payment' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/15' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/15'}`}>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    {property.status === 'awaiting_payment' ? 'Apply (Join Waitlist)' : 'Apply for Rent'}
                                                </button>
                                            </SignInButton>
                                        ) : (
                                            <button
                                                onClick={() => setShowApplyModal(true)}
                                                className={`w-full py-2.5 text-white rounded-xl font-semibold transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 text-sm ${property.status === 'awaiting_payment' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/15' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/15'}`}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                {property.status === 'awaiting_payment' ? 'Apply (Join Waitlist)' : 'Apply for Rent'}
                                            </button>
                                        )}
                                    </>
                                )}
                                {isRestrictedDemo ? (
                                    <SignInButton mode="modal">
                                        <button className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/15 active:scale-[0.98] flex items-center justify-center gap-2 text-sm">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            Contact Manager
                                        </button>
                                    </SignInButton>
                                ) : (
                                    <button
                                        onClick={() => setShowContactModal(true)}
                                        className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/15 active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        Contact Manager
                                    </button>
                                )}
                                {isRestrictedDemo ? (
                                    <SignInButton mode="modal">
                                        <button className={`w-full py-2.5 rounded-xl font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm border ${isFav ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-dark-200 text-dark-600 hover:border-rose-300 hover:text-rose-500'}`}>
                                            <svg className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                            {isFav ? 'Saved to Favourites' : 'Save to Favourites'}
                                        </button>
                                    </SignInButton>
                                ) : (
                                    <button
                                        onClick={toggleFavourite}
                                        className={`w-full py-2.5 rounded-xl font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm border ${isFav
                                            ? 'bg-rose-50 border-rose-200 text-rose-600'
                                            : 'bg-white border-dark-200 text-dark-600 hover:border-rose-300 hover:text-rose-500'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                        {isFav ? 'Saved to Favourites' : 'Save to Favourites'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Property Manager Card */}
                        <div className="bg-white rounded-2xl border border-dark-100 p-5">
                            <h3 className="text-base font-bold text-dark-900 mb-4">Listed by</h3>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center font-black text-lg">
                                    {ownerName.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-dark-900 text-sm">{ownerName}</h4>
                                    <p className="text-dark-400 text-xs">Property Manager</p>
                                </div>
                                {property.verified && (
                                    <span className="ml-auto bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-bold">Verified</span>
                                )}
                            </div>
                            {isRestrictedDemo ? (
                                <SignInButton mode="modal">
                                    <button className="w-full py-2.5 border-2 border-primary-200 text-primary-600 rounded-xl font-semibold text-sm hover:bg-primary-50 transition-colors">
                                        Send Message
                                    </button>
                                </SignInButton>
                            ) : (
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('open-chat', { detail: property.owner }))}
                                    className="w-full py-2.5 border-2 border-primary-200 text-primary-600 rounded-xl font-semibold text-sm hover:bg-primary-50 transition-colors"
                                >
                                    Send Message
                                </button>
                            )}
                        </div>

                        {/* Additional Preferences */}
                        {property.additional?.preferredTenantType?.length > 0 && (
                            <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
                                <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Preferred Tenants
                                </h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {property.additional.preferredTenantType.map((t, i) => (
                                        <span key={i} className="bg-white text-amber-700 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-amber-200">{t}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Suggestions */}
                        {suggestions.length > 0 && (
                            <div className="pt-6">
                                <h3 className="text-base font-bold text-dark-900 mb-4 px-1">You Might Also Like</h3>
                                <div className="space-y-4">
                                    {suggestions.map(sugg => (
                                        <div key={sugg._id} className="origin-top relative overflow-hidden ring-1 ring-dark-100 rounded-2xl shadow-sm hover:shadow-xl transition-shadow">
                                            <TenantPropertyCard 
                                                property={sugg} 
                                                isFavourite={localFavs.includes(sugg._id)}
                                                onToggleFav={toggleFavouriteCard}
                                                isDemo={isDemo}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ══════ Apply Modal ══════ */}
            {showApplyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !applying && setShowApplyModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
                        <button onClick={() => !applying && setShowApplyModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-dark-100 hover:bg-dark-200 flex items-center justify-center transition-colors">
                            <svg className="w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        {applySuccess ? (
                            /* Success state */
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-dark-900 mb-2">Application Sent!</h3>
                                <p className="text-dark-500 text-sm mb-6">The property manager will review your application and get back to you.</p>
                                <button onClick={() => { setShowApplyModal(false); setApplySuccess(false); }} className="bg-primary-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors">
                                    Done
                                </button>
                            </div>
                        ) : (
                            /* Form */
                            <form onSubmit={handleApply}>
                                <h3 className="text-lg font-bold text-dark-900 mb-1">Apply for This Property</h3>
                                <p className="text-dark-400 text-xs mb-5">{property.title}</p>

                                {applyError && (
                                    <div className="bg-red-50 text-red-600 text-xs font-medium px-4 py-2.5 rounded-xl mb-4 border border-red-100">
                                        {applyError}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-1">Move-in Date</label>
                                            <input type="date" value={applyForm.moveInDate} onChange={e => setApplyForm({ ...applyForm, moveInDate: e.target.value })}
                                                className="w-full px-3 py-2 border border-dark-200 rounded-xl text-sm outline-none focus:border-primary-500 bg-dark-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-1">Lease (months)</label>
                                            <input type="number" min={1} value={applyForm.leaseDuration} onChange={e => setApplyForm({ ...applyForm, leaseDuration: e.target.value })}
                                                placeholder="e.g. 12" className="w-full px-3 py-2 border border-dark-200 rounded-xl text-sm outline-none focus:border-primary-500 bg-dark-50"
                                            />
                                        </div>
                                    </div>

                                    {/* Verification Details */}
                                    {isResidential ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-1">Applicant Type</label>
                                                <select
                                                    value={applyForm.maritalStatus}
                                                    onChange={e => setApplyForm({...applyForm, maritalStatus: e.target.value})}
                                                    className="w-full px-3 py-2 border border-dark-200 rounded-xl text-sm outline-none focus:border-primary-500 bg-dark-50"
                                                >
                                                    <option value="Single">Single / Bachelor</option>
                                                    <option value="Couple">Married Couple / Couple</option>
                                                    <option value="Family">Family with Children</option>
                                                    <option value="Group">Group of Friends / Bachelors</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-1">Employment</label>
                                                <select
                                                    value={applyForm.employmentStatus}
                                                    onChange={e => setApplyForm({...applyForm, employmentStatus: e.target.value})}
                                                    className="w-full px-3 py-2 border border-dark-200 rounded-xl text-sm outline-none focus:border-primary-500 bg-dark-50"
                                                >
                                                    <option value="Employed">Employed</option>
                                                    <option value="Self-Employed/Business">Self-Employed/Business</option>
                                                    <option value="Student">Student</option>
                                                    <option value="Unemployed">Unemployed</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-1">Company / College</label>
                                                <input type="text" placeholder="Where do you work/study?" value={applyForm.companyName} onChange={e => setApplyForm({ ...applyForm, companyName: e.target.value })}
                                                    className="w-full px-3 py-2 border border-dark-200 rounded-xl text-sm outline-none focus:border-primary-500 bg-dark-50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-1">
                                                    {applyForm.maritalStatus === 'Family' ? 'Family Size' : 'Number of Occupants'}
                                                </label>
                                                <input type="number" min={1} value={applyForm.familySize} onChange={e => setApplyForm({ ...applyForm, familySize: e.target.value })}
                                                    className="w-full px-3 py-2 border border-dark-200 rounded-xl text-sm outline-none focus:border-primary-500 bg-dark-50"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="col-span-2">
                                                <label className="block text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-1">Business Name</label>
                                                <input type="text" placeholder="Name of your company/business" value={applyForm.companyName} onChange={e => setApplyForm({ ...applyForm, companyName: e.target.value })}
                                                    className="w-full px-3 py-2 border border-dark-200 rounded-xl text-sm outline-none focus:border-primary-500 bg-dark-50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-1">Business Type</label>
                                                <input type="text" placeholder="e.g. Retail, Tech, Food" value={applyForm.businessType} onChange={e => setApplyForm({ ...applyForm, businessType: e.target.value })}
                                                    className="w-full px-3 py-2 border border-dark-200 rounded-xl text-sm outline-none focus:border-primary-500 bg-dark-50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-1">Years in Business</label>
                                                <input type="number" min={0} value={applyForm.yearsInBusiness} onChange={e => setApplyForm({ ...applyForm, yearsInBusiness: e.target.value })}
                                                    className="w-full px-3 py-2 border border-dark-200 rounded-xl text-sm outline-none focus:border-primary-500 bg-dark-50"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Final Row */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-1">Additional Notes</label>
                                        <textarea
                                            value={applyForm.message}
                                            onChange={e => setApplyForm({ ...applyForm, message: e.target.value })}
                                            placeholder={isResidential ? "Any additional details (e.g. Do you have pets? Reason for moving?)" : "Tell the manager about your business requirements"}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-dark-200 rounded-xl text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 resize-none bg-dark-50"
                                        />
                                    </div>
                                </div>

                                <button type="submit" disabled={applying}
                                    className="w-full mt-5 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {applying ? (
                                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                                    ) : (
                                        'Submit Application'
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* ══════ Contact Modal ══════ */}
            {showContactModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowContactModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowContactModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-dark-100 hover:bg-dark-200 flex items-center justify-center transition-colors">
                            <svg className="w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="text-center mb-5">
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-dark-900">Contact {ownerName}</h3>
                            <p className="text-dark-400 text-xs mt-1">Reach out directly to the property manager</p>
                        </div>

                        <div className="space-y-3 mb-5">
                            {property.ownership?.ownerContact && (
                                <a
                                    href={`tel:${property.ownership.ownerContact}`}
                                    className="flex items-center gap-3 p-3.5 rounded-xl border border-dark-100 hover:bg-dark-50 transition-colors"
                                >
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-dark-900 font-bold text-sm">Call</p>
                                        <p className="text-dark-400 text-xs">{property.ownership.ownerContact}</p>
                                    </div>
                                </a>
                            )}
                            {property.ownership?.ownerEmail && (
                                <a
                                    href={`mailto:${property.ownership.ownerEmail}?subject=Inquiry: ${property.title}`}
                                    className="flex items-center gap-3 p-3.5 rounded-xl border border-dark-100 hover:bg-dark-50 transition-colors"
                                >
                                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-dark-900 font-bold text-sm">Email</p>
                                        <p className="text-dark-400 text-xs">{property.ownership.ownerEmail}</p>
                                    </div>
                                </a>
                            )}
                            <button
                                onClick={() => {
                                    setShowContactModal(false);
                                    window.dispatchEvent(new CustomEvent('open-chat', { detail: property.owner }));
                                }}
                                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-dark-100 hover:bg-dark-50 transition-colors text-left"
                            >
                                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                </div>
                                <div>
                                    <p className="text-dark-900 font-bold text-sm">Live Chat</p>
                                    <p className="text-dark-400 text-xs">Send a direct message</p>
                                </div>
                            </button>
                        </div>

                        <div className="border-t border-dark-100 pt-4">
                            <p className="text-dark-400 text-[11px] text-center">
                                Live messaging feature coming soon! For now, reach out via the options above.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </TenantLayout>
    );
}
