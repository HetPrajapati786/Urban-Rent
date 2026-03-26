import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import ManagerLayout from '../../layouts/ManagerLayout';
import PropertyMediaGallery from '../../components/PropertyMediaGallery';
import { apiGet, apiPatch, apiDelete, apiPost } from '../../utils/api';

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AMENITIES_DATA = {
    parking: { label: 'Parking', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v10m0-10h4a3 3 0 010 6H8" /><rect x="2" y="2" width="20" height="20" rx="3" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></svg> },
    lift: { label: 'Lift', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={1.5} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v18M8 8l-2 3h4l-2 3M16 10l2-3h-4l2-3" /></svg> },
    waterSupply: { label: 'Water Supply', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21c-3.5 0-6-2.5-6-6 0-4 6-11 6-11s6 7 6 11c0 3.5-2.5 6-6 6z" /></svg> },
    powerBackup: { label: 'Power Backup', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg> },
    cctv: { label: 'CCTV', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
    securityGuard: { label: 'Security Guard', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
    internet: { label: 'Internet', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" /></svg> },
    airConditioning: { label: 'Air Conditioning', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg> },
    fireSafety: { label: 'Fire Safety', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg> },
    washroom: { label: 'Washroom', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h18M3 12v4a4 4 0 004 4h10a4 4 0 004-4v-4M3 12V8a4 4 0 014-4h1m8 16v2m-4-2v2" /></svg> },
};

function SpecItem({ label, value }) {
    if (!value) return null;
    return (
        <div className="flex items-center justify-between py-2 border-b border-dark-50 last:border-0">
            <span className="text-dark-500 text-sm">{label}</span>
            <span className="text-dark-900 font-bold text-sm capitalize">{value.toString()}</span>
        </div>
    );
}

export default function PropertyDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showBoostModal, setShowBoostModal] = useState(false);
    const [boostDuration, setBoostDuration] = useState(7);
    const [boostLoading, setBoostLoading] = useState(false);

    // Termination state
    const [activeTenant, setActiveTenant] = useState(null);
    const [showTerminateModal, setShowTerminateModal] = useState(false);
    const [terminateLoading, setTerminateLoading] = useState(false);
    const [refundAmount, setRefundAmount] = useState('');
    const [deductionReason, setDeductionReason] = useState('');

    const isDemo = window.location.pathname.startsWith('/demo');

    // Define custom icon for Leaflet markers
    const customIcon = new L.Icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // Define STATUS_CONFIG
    const STATUS_CONFIG = {
        active: { label: 'Active', color: 'bg-blue-100 text-blue-700 border-blue-100' },
        paused: { label: 'Paused', color: 'bg-amber-100 text-amber-700 border-amber-100' },
        pending: { label: 'Pending', color: 'bg-blue-100 text-blue-700 border-blue-100' },
        rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-100' },
        rented: { label: 'Rented', color: 'bg-purple-100 text-purple-700 border-purple-100' },
        awaiting_payment: { label: 'Awaiting Payment', color: 'bg-amber-100 text-amber-700 border-amber-100' },
        terminated: { label: 'Terminated', color: 'bg-red-100 text-red-700 border-red-100' },
    };

    useEffect(() => {
        fetchProperty();
    }, [id]);

    const fetchProperty = async () => {
        try {
            setLoading(true);
            const data = await apiGet(`/properties/${id}`);
            setProperty(data.property);

            // If property is rented, fetch the active tenant
            if (data.property?.status === 'rented') {
                try {
                    const appsData = await apiGet('/applications/my');
                    const apps = appsData.applications || [];
                    const activeApp = apps.find(a =>
                        (a.property?._id === id || a.property === id) &&
                        a.status === 'approved'
                    );
                    setActiveTenant(activeApp || null);
                } catch { setActiveTenant(null); }
            } else {
                setActiveTenant(null);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleProcessTermination = async () => {
        const refund = Number(refundAmount) || 0;
        const deposit = activeTenant?.invoice?.securityDeposit || property?.pricing?.securityDeposit || 0;
        if (refund < 0) return alert('Refund amount cannot be negative');
        if (refund > deposit) return alert(`Refund cannot exceed the security deposit of ₹${deposit}`);

        try {
            setTerminateLoading(true);
            await apiPost(`/applications/${activeTenant._id}/terminate/process`, {
                refundAmount: refund,
                deductionReason,
            });
            setShowTerminateModal(false);
            setRefundAmount('');
            setDeductionReason('');
            fetchProperty();
        } catch (err) {
            alert('Failed to process termination: ' + err.message);
        } finally {
            setTerminateLoading(false);
        }
    };

    const handleAction = async (action) => {
        try {
            let endpoint = `/properties/${id}/status`;
            let body = undefined;
            if (action === 'boost') {
                endpoint = `/properties/${id}/boost`;
                body = { duration: boostDuration };
            }
            if (action === 'unboost') endpoint = `/properties/${id}/boost`;
            if (action === 'verify') endpoint = `/properties/${id}/verify`;

            await apiPatch(endpoint, body);
            setShowBoostModal(false);
            fetchProperty();
        } catch (err) {
            alert(`Failed to ${action}: ${err.message}`);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await apiDelete(`/properties/${id}`);
            navigate(isDemo ? '/demo/manager/properties' : '/manager/properties');
        } catch (err) {
            setIsDeleting(false);
            setShowDeleteModal(false);
            // Optionally show an inline error instead
            console.error('Failed to delete:', err.message);
        }
    };

    if (loading) {
        return (
            <ManagerLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                </div>
            </ManagerLayout>
        );
    }

    if (error || !property) {
        return (
            <ManagerLayout>
                <div className="max-w-4xl mx-auto py-12 px-4 text-center">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-dark-900 mb-2">Property Not Found</h2>
                    <p className="text-dark-500 mb-6">{error || "The property you're looking for doesn't exist or has been removed."}</p>
                    <Link to={isDemo ? '/demo/manager/properties' : '/manager/properties'} className="bg-primary-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-700 transition-colors">
                        Back to My Properties
                    </Link>
                </div>
            </ManagerLayout>
        );
    }

    const images = property.images || [];
    const location = property.location;

    return (
        <ManagerLayout
            breadcrumbs={[
                { label: 'Home', href: isDemo ? '/demo/manager' : '/manager/dashboard' },
                { label: 'All Properties', href: isDemo ? '/demo/manager/properties' : '/manager/properties' },
                { label: property.title }
            ]}
        >
            <div className="max-w-7xl mx-auto pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 px-4 sm:px-0">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${property.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                property.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                                    'bg-dark-100 text-dark-700'
                                }`}>
                                {property.status}
                            </span>
                            {property.verified && (
                                <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L3 12h3v8h12v-8h3L12 2z" /></svg>
                                    Verified Property
                                </span>
                            )}
                            {property.boosted && (
                                <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                    Boosted
                                </span>
                            )}
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold text-dark-900">{property.title}</h1>
                        <div className="flex items-center gap-2 text-dark-500">
                            <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                            <span className="text-lg font-medium">
                                {property.location?.area}, {property.location?.city}, {property.location?.state}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => handleAction('status')}
                            className="bg-white border border-dark-200 text-dark-700 px-5 py-2 rounded-xl font-semibold hover:border-dark-300 transition-all active:scale-95 text-sm"
                        >
                            {property.status === 'paused' ? 'Resume Listing' : 'Pause Listing'}
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="bg-red-50 text-red-600 border border-red-100 px-5 py-2 rounded-xl font-semibold hover:bg-red-100 transition-all active:scale-95 text-sm"
                        >
                            Delete
                        </button>
                        <Link
                            to={isDemo ? `/demo/manager/edit-property/${id}` : `/manager/edit-property/${id}`}
                            className="bg-primary-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-md shadow-primary-600/15 active:scale-95 text-sm"
                        >
                            Edit Details
                        </Link>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 px-4 sm:px-0 items-start">
                    {/* Left Column: Media & Details */}
                    <div className="lg:col-span-2 space-y-6 min-w-0">
                        {/* Image Gallery */}
                        <PropertyMediaGallery images={images} video={property.video} title={property.title} />

                        {/* Key Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-white p-3 rounded-xl border border-dark-100 shadow-sm">
                                <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mb-1">Bedrooms</p>
                                <p className="text-base font-black text-dark-900">{property.residential?.totalRooms || '-'}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-dark-100 shadow-sm">
                                <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mb-1">Bathrooms</p>
                                <p className="text-base font-black text-dark-900">{property.residential?.bathrooms || '-'}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-dark-100 shadow-sm">
                                <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mb-1">Super Area</p>
                                <p className="text-base font-black text-dark-900">{property.commercial?.totalArea || property.commercial?.superArea || '-'} <span className="text-[10px] font-medium text-dark-400">sqft</span></p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-dark-100 shadow-sm">
                                <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mb-1">Views</p>
                                <p className="text-base font-black text-dark-900">{property.views || 0}</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white p-6 rounded-2xl border border-dark-100 shadow-sm">
                            <h2 className="text-lg font-black text-dark-900 mb-4 flex items-center gap-2">
                                <span className="w-1 h-5 bg-primary-500 rounded-full"></span>
                                About this property
                            </h2>
                            <p className="text-dark-600 leading-relaxed whitespace-pre-wrap text-sm">
                                {property.description}
                            </p>
                        </div>

                        {/* Amenities */}
                        <div className="bg-white p-6 rounded-2xl border border-dark-100 shadow-sm">
                            <h2 className="text-lg font-black text-dark-900 mb-4 flex items-center gap-2">
                                <span className="w-1 h-5 bg-primary-500 rounded-full"></span>
                                Amenities & Features
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {property.amenities?.map((amenity, idx) => {
                                    const iconData = AMENITIES_DATA[amenity];
                                    return (
                                        <div key={idx} className="flex items-center gap-2.5 p-2 rounded-xl bg-dark-50 border border-dark-100 font-medium text-dark-700 text-xs">
                                            <span className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-sm">
                                                {iconData?.icon || ''}
                                            </span>
                                            {iconData?.label || amenity}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Map Location */}
                        <div className="bg-white p-6 rounded-2xl border border-dark-100 shadow-sm">
                            <h2 className="text-lg font-black text-dark-900 mb-4 flex items-center gap-2">
                                <span className="w-1 h-5 bg-primary-500 rounded-full"></span>
                                Location on Map
                            </h2>
                            <div className="h-[300px] rounded-xl overflow-hidden border border-dark-100 relative z-0">
                                {location.coordinates && location.coordinates.lat && location.coordinates.lng ? (
                                    <MapContainer
                                        center={[location.coordinates.lat, location.coordinates.lng]}
                                        zoom={14}
                                        style={{ height: '100%', width: '100%' }}
                                        scrollWheelZoom={false}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        <Marker position={[location.coordinates.lat, location.coordinates.lng]} icon={customIcon}>
                                            <Popup>{property.title}</Popup>
                                        </Marker>
                                    </MapContainer>
                                ) : (
                                    <div className="w-full h-full bg-dark-50 flex items-center justify-center text-dark-400 flex-col gap-2">
                                        <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A2 2 0 013 15.487V5.461a2 2 0 012.764-1.843L11 6l5.447-2.724A2 2 0 0119 5.093v10.026a2 2 0 01-1.236 1.843L12 20m0 0V6" /></svg>
                                        <p className="text-xs font-semibold">Map location not available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Pricing & Controls */}
                    <div className="lg:col-span-1 space-y-6 self-start">
                        {/* Status Card */}
                        <div className="bg-white rounded-3xl border border-dark-100 p-8 shadow-sm flex flex-col h-fit">
                            <div className="mb-6">
                                <span className="text-dark-400 text-sm block mb-1">Monthly Rent</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-dark-900">{'\u20B9'}{property.pricing?.monthlyRent?.toLocaleString()}</span>
                                    <span className="text-dark-500 font-medium">/month</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center justify-between py-3 border-b border-dark-50">
                                    <span className="text-dark-500 font-medium text-sm">Security Deposit</span>
                                    <span className="text-dark-900 font-bold text-sm">{'\u20B9'}{property.pricing?.securityDeposit?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-dark-50">
                                    <span className="text-dark-500 font-medium text-sm">Maintenance</span>
                                    <span className="text-dark-900 font-bold text-sm">{'\u20B9'}{property.pricing?.maintenanceCharges?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-dark-50">
                                    <span className="text-dark-500 font-medium text-sm">Lease Duration</span>
                                    <span className="text-dark-900 font-bold text-sm">{property.pricing?.minimumLeaseDuration || 0} Months</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-dark-50 rounded-2xl border border-dark-50 text-center">
                                    <span className="text-dark-400 text-[10px] uppercase font-bold tracking-wider block mb-1">Inquiries</span>
                                    <span className="text-xl font-black text-dark-900">{property.inquiries || 0}</span>
                                </div>
                                <div className="p-4 bg-dark-50 rounded-2xl border border-dark-50 text-center">
                                    <span className="text-dark-400 text-[10px] uppercase font-bold tracking-wider block mb-1">Page Views</span>
                                    <span className="text-xl font-black text-dark-900">{property.views || 0}</span>
                                </div>
                            </div>

                            {/* Active Tenant Card (when rented) */}
                            {property.status === 'rented' && activeTenant && (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
                                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3">Current Tenant</h4>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-amber-200 text-amber-800 rounded-xl flex items-center justify-center font-bold text-sm">
                                            {(activeTenant.tenant?.firstName?.[0] || 'T').toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-dark-900 font-bold text-sm">{activeTenant.tenant?.firstName} {activeTenant.tenant?.lastName}</p>
                                            <p className="text-dark-500 text-xs">{activeTenant.tenant?.email}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 text-xs mb-4">
                                        <div className="flex justify-between">
                                            <span className="text-dark-500">Move-in Date</span>
                                            <span className="text-dark-900 font-medium">{activeTenant.moveInDate ? new Date(activeTenant.moveInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-dark-500">Lease Duration</span>
                                            <span className="text-dark-900 font-medium">{activeTenant.leaseDuration || '—'} months</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-dark-500">Security Deposit</span>
                                            <span className="text-dark-900 font-medium">₹{(activeTenant.invoice?.securityDeposit || property.pricing?.securityDeposit || 0).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {activeTenant.termination?.status === 'requested' && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3 flex items-start gap-2">
                                            <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                                            <p className="text-red-700 text-xs font-medium">Tenant has requested early termination</p>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setShowTerminateModal(true)}
                                        className="w-full py-2.5 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 transition-all shadow-md shadow-red-600/15 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                        Terminate Rental
                                    </button>
                                </div>
                            )}

                            <div className="space-y-3">
                                {!property.verified && property.verificationStatus !== 'requested' && (
                                    <button
                                        onClick={() => handleAction('verify')}
                                        className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/15 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                        Get Verified
                                    </button>
                                )}
                                <button
                                    onClick={() => property.boosted ? handleAction('unboost') : setShowBoostModal(true)}
                                    className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${property.boosted
                                        ? 'bg-white border border-rose-500 text-rose-500'
                                        : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-500/15 hover:scale-[1.02]'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                    {property.boosted ? 'Remove Boost' : 'Boost Listing'}
                                </button>
                            </div>
                        </div>

                        {/* Property Specs Card */}
                        <div className="bg-white rounded-3xl border border-dark-100 p-8 shadow-sm">
                            <h3 className="text-xl font-bold text-dark-900 mb-6">Property Overview</h3>
                            <div className="space-y-4">
                                <SpecItem label="Property Type" value={property.propertyType} />
                                <SpecItem label="Listing Type" value={property.listingType} />
                                {property.propertyType && !['Shop', 'Office', 'Factory', 'Warehouse'].includes(property.propertyType) ? (
                                    <>
                                        <SpecItem label="BHK Type" value={property.residential?.bhkType} />
                                        <SpecItem label="Furnishing" value={property.residential?.furnishing} />
                                        <SpecItem label="Bathrooms" value={property.residential?.bathrooms} />
                                        <SpecItem label="Total Floors" value={property.residential?.totalFloors} />
                                    </>
                                ) : (
                                    <>
                                        <SpecItem label="Total Area" value={`${property.commercial?.totalArea} ${property.commercial?.areaUnit}`} />
                                        <SpecItem label="Parking" value={property.commercial?.parkingAvailability ? 'Available' : 'No'} />
                                        <SpecItem label="Power Supply" value={property.commercial?.powerSupplyCapacity} />
                                    </>
                                )}
                                <SpecItem label="Available From" value={property.pricing?.availableFrom ? new Date(property.pricing.availableFrom).toLocaleDateString() : 'Immediate'} />
                            </div>
                        </div>

                        {/* Owner Info Card */}
                        <div className="bg-white rounded-3xl border border-dark-100 p-8 shadow-sm">
                            <h3 className="text-xl font-bold text-dark-900 mb-6">Owner Information</h3>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center font-black text-2xl">
                                    {property.ownership?.ownerName?.charAt(0) || 'O'}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-dark-900">{property.ownership?.ownerName}</h4>
                                    <p className="text-dark-500 text-sm">Property Owner</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-dark-600">
                                    <svg className="w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    <span className="text-sm font-medium">{property.ownership?.ownerContact}</span>
                                </div>
                                <div className="flex items-center gap-3 text-dark-600">
                                    <svg className="w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v10a2 2 0 002 2z" /></svg>
                                    <span className="text-sm font-medium">{property.ownership?.ownerEmail}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm animate-fade-in"
                        onClick={() => !isDeleting && setShowDeleteModal(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
                        {/* Icon */}
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>

                        {/* Content */}
                        <h3 className="text-xl font-black text-dark-900 text-center mb-2">Delete Property</h3>
                        <p className="text-dark-500 text-center text-sm mb-2">
                            Are you sure you want to delete <span className="font-bold text-dark-700">"{property.title}"</span>?
                        </p>
                        <p className="text-red-500 text-center text-xs font-medium mb-8">
                            This action cannot be undone. All data, images, and analytics will be permanently removed.
                        </p>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                                className="flex-1 px-6 py-3 rounded-xl font-bold text-dark-700 bg-dark-50 border-2 border-dark-100 hover:bg-dark-100 transition-all active:scale-95 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Yes, Delete'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Boost Modal */}
            {showBoostModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setShowBoostModal(false)}
                >
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-dark-900">Boost Property</h3>
                                <p className="text-dark-400 text-xs">Choose a boost duration</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <button
                                onClick={() => setBoostDuration(7)}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                                    boostDuration === 7
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-dark-100 hover:border-dark-200'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-dark-900">7 Days</p>
                                        <p className="text-dark-400 text-xs">Quick visibility boost</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-dark-900">10 Credits</p>
                                        <p className="text-dark-400 text-[10px]">≈ ₹99</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => setBoostDuration(30)}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                                    boostDuration === 30
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-dark-100 hover:border-dark-200'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-dark-900">30 Days</p>
                                        <p className="text-dark-400 text-xs">Maximum exposure</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-dark-900">25 Credits</p>
                                        <p className="text-dark-400 text-[10px]">≈ ₹249</p>
                                    </div>
                                </div>
                            </button>
                        </div>

                        <p className="text-dark-400 text-xs mb-4 text-center">
                            Don't have enough credits?{' '}
                            <Link to={isDemo ? '/demo/manager/credits' : '/manager/credits'} className="text-primary-600 font-bold hover:underline">
                                Buy Credits →
                            </Link>
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowBoostModal(false)}
                                className="flex-1 px-6 py-3 rounded-xl font-bold text-dark-700 bg-dark-50 hover:bg-dark-100 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleAction('boost')}
                                className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:opacity-90 transition-all shadow-lg shadow-rose-500/20"
                            >
                                Boost Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Termination Processing Modal */}
            {showTerminateModal && activeTenant && (() => {
                const deposit = activeTenant.invoice?.securityDeposit || property.pricing?.securityDeposit || 0;
                let stayedDays = 0;
                if (activeTenant.moveInDate) {
                    stayedDays = Math.max(0, Math.ceil((new Date() - new Date(activeTenant.moveInDate)) / (1000 * 60 * 60 * 24)));
                }
                const stayedMonths = Math.floor(stayedDays / 30);
                const remainingDays = stayedDays % 30;

                return (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => !terminateLoading && setShowTerminateModal(false)}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-dark-900">Terminate Rental</h3>
                                    <p className="text-dark-400 text-xs">Process early termination and security deposit refund</p>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="bg-dark-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-dark-500">Tenant</span>
                                    <span className="text-dark-900 font-medium">{activeTenant.tenant?.firstName} {activeTenant.tenant?.lastName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-500">Property</span>
                                    <span className="text-dark-900 font-medium">{property.title}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-500">Security Deposit</span>
                                    <span className="text-dark-900 font-bold">₹{deposit.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-500">Min. Lease Period</span>
                                    <span className="text-dark-900 font-medium">{activeTenant.leaseDuration || '—'} months</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-500">Stayed Duration</span>
                                    <span className="text-dark-900 font-medium">{stayedMonths} months, {remainingDays} days</span>
                                </div>
                            </div>

                            {/* Refund Input */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-dark-700 mb-1.5">Refund Amount (₹)</label>
                                <input
                                    type="number"
                                    value={refundAmount}
                                    onChange={e => setRefundAmount(e.target.value)}
                                    placeholder={`Max: ₹${deposit.toLocaleString()}`}
                                    min="0"
                                    max={deposit}
                                    className="w-full px-4 py-2.5 border-2 border-dark-200 rounded-xl text-sm text-dark-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                                />
                                <p className="text-dark-400 text-[10px] mt-1">Enter the amount to refund from the security deposit (0 to ₹{deposit.toLocaleString()})</p>
                            </div>

                            {/* Deduction Reason */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-dark-700 mb-1.5">Deduction Reason (Optional)</label>
                                <textarea
                                    value={deductionReason}
                                    onChange={e => setDeductionReason(e.target.value)}
                                    placeholder="e.g. Damage to walls, unpaid utility bills, cleaning charges..."
                                    rows={2}
                                    className="w-full px-4 py-2.5 border-2 border-dark-200 rounded-xl text-sm text-dark-900 outline-none focus:border-primary-500 resize-none"
                                />
                            </div>

                            {/* Warning */}
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5">
                                <p className="text-red-700 text-xs font-medium flex items-start gap-2">
                                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>
                                    This action cannot be undone. The rental will be terminated, the property will become available again, and the tenant will be notified about the refund.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowTerminateModal(false)}
                                    disabled={terminateLoading}
                                    className="flex-1 py-2.5 text-sm font-medium text-dark-500 bg-dark-50 rounded-xl hover:bg-dark-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleProcessTermination}
                                    disabled={terminateLoading}
                                    className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {terminateLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </>
                                    ) : 'Confirm Refund & Terminate'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </ManagerLayout >
    );
}
