import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import PropertyMediaGallery from '../../components/PropertyMediaGallery';
import { apiGet, apiPatch, apiDelete } from '../../utils/api';

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

const STATUS_BADGE = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
};

export default function AdminPropertyDetail() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const isDemo = location.pathname.startsWith('/demo');

    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [errorModal, setErrorModal] = useState(null);

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
    }, [id]);

    const fetchProperty = async () => {
        try {
            setLoading(true);
            const data = await apiGet(`/admin/properties/${id}`);
            setProperty(data);
        } catch (err) {
            console.error('Fetch property error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            await apiPatch(`/admin/properties/${id}/approve`);
            fetchProperty();
        } catch (err) {
            alert('Failed: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        setActionLoading(true);
        try {
            await apiPatch(`/admin/properties/${id}/reject`);
            fetchProperty();
        } catch (err) {
            alert('Failed: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!window.confirm('Are you sure you want to verify this property? It will receive a Verified badge.')) return;
        setActionLoading(true);
        try {
            await apiPatch(`/admin/properties/${id}/verify`);
            fetchProperty();
        } catch (err) {
            alert('Failed to verify property: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnverify = async () => {
        setActionLoading(true);
        try {
            await apiPatch(`/admin/properties/${id}/unverify`);
            fetchProperty();
        } catch (err) {
            alert('Failed: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to permanently delete this property? This cannot be undone.')) return;
        setActionLoading(true);
        try {
            await apiDelete(`/admin/properties/${id}`);
            navigate(isDemo ? '/demo/admin/properties' : '/admin/properties');
        } catch (err) {
            alert('Failed: ' + err.message);
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    if (!property) {
        return (
            <AdminLayout>
                <div className="text-center py-20">
                    <p className="text-dark-500 font-medium">Property not found</p>
                    <button onClick={() => navigate(-1)} className="mt-4 text-red-600 text-sm font-bold hover:underline">← Go Back</button>
                </div>
            </AdminLayout>
        );
    }

    const p = property;

    return (
        <AdminLayout
            breadcrumbs={[
                { label: 'Dashboard', href: isDemo ? '/demo/admin' : '/admin/dashboard' },
                { label: 'Properties', href: isDemo ? '/demo/admin/properties' : '/admin/properties' },
                { label: p.title },
            ]}
        >
            <div className="space-y-6">
                {/* Back + Actions bar */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-dark-500 hover:text-dark-700 text-sm font-medium transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Back to Properties
                    </button>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${STATUS_BADGE[p.status] || 'bg-dark-100 text-dark-600 border-dark-200'}`}>
                            {p.status}
                        </span>
                        
                        <button 
                            onClick={() => {
                                const clerkId = p.manager?.clerkId || p.owner?.clerkId;
                                if (!clerkId) return setErrorModal('Manager information missing. Cannot impersonate.');
                                sessionStorage.setItem('urbanrent_impersonate', clerkId);
                                sessionStorage.setItem('urbanrent_impersonate_data', JSON.stringify({
                                    name: p.owner?.firstName ? `${p.owner.firstName} ${p.owner.lastName || ''}` : 'Manager',
                                    avatar: p.owner?.avatar || '',
                                    role: 'manager'
                                }));
                                const url = isDemo ? `/demo/manager/edit-property/${p._id}?impersonate=${clerkId}` : `/manager/edit-property/${p._id}?impersonate=${clerkId}`;
                                window.open(url, '_blank');
                            }} 
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-all flex items-center gap-1.5"
                            title="Impersonate Manager and Edit Property"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Edit (Override)
                        </button>

                        {p.status === 'pending' && (
                            <>
                                <button onClick={handleApprove} disabled={actionLoading} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50">
                                    Approve
                                </button>
                                <button onClick={handleReject} disabled={actionLoading} className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50">
                                    Reject
                                </button>
                            </>
                        )}
                        {p.status === 'rejected' && (
                            <button onClick={handleApprove} disabled={actionLoading} className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-200 hover:bg-blue-100 transition-all disabled:opacity-50">
                                Re-approve
                            </button>
                        )}
                        {p.status === 'active' && !p.verified && (
                            <button onClick={handleVerify} disabled={actionLoading} className="px-4 py-2 bg-teal-50 text-teal-700 text-xs font-bold rounded-lg border border-teal-200 hover:bg-teal-100 transition-all disabled:opacity-50">
                                Verify
                            </button>
                        )}
                        {p.status === 'active' && p.verified && (
                            <button onClick={handleUnverify} disabled={actionLoading} className="px-4 py-2 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200 hover:bg-amber-100 transition-all disabled:opacity-50">
                                Unverify
                            </button>
                        )}
                        <button onClick={handleDelete} disabled={actionLoading} className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all disabled:opacity-50">
                            🗑 Delete
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content (left 2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Images & Video */}
                        <PropertyMediaGallery images={p.images || []} video={p.video} title={p.title} />

                        {/* Title + Description */}
                        <div className="bg-white rounded-2xl border border-dark-100 p-6">
                            <h1 className="text-2xl font-black text-dark-900 mb-1">{p.title}</h1>
                            <p className="text-dark-400 text-sm mb-4">
                                {[p.location?.area, p.location?.city, p.location?.state].filter(Boolean).join(', ')}
                                {p.location?.pincode && ` — ${p.location.pincode}`}
                            </p>
                            <p className="text-dark-600 text-sm leading-relaxed">{p.description || 'No description provided.'}</p>
                        </div>

                        {/* Property Specs */}
                        <div className="bg-white rounded-2xl border border-dark-100 p-6">
                            <h2 className="text-lg font-bold text-dark-900 mb-4">Property Details</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <SpecItem label="Type" value={p.propertyType || '-'} />
                                <SpecItem label="Category" value={p.category || '-'} />
                                <SpecItem label="Furnishing" value={p.residential?.furnishingStatus || '-'} />
                                <SpecItem label="BHK" value={p.residential?.bhkType || '-'} />
                                <SpecItem label="Bedrooms" value={p.residential?.totalRooms || '-'} />
                                <SpecItem label="Bathrooms" value={p.residential?.bathrooms || '-'} />
                                <SpecItem label="Balconies" value={p.residential?.balconies || '-'} />
                                <SpecItem label="Floor" value={p.residential?.floorNumber !== undefined ? `${p.residential.floorNumber} of ${p.residential.totalFloors || '?'}` : '-'} />
                                <SpecItem label="Facing" value={p.residential?.facing || '-'} />
                                <SpecItem label="Available From" value={p.availability?.availableFrom ? new Date(p.availability.availableFrom).toLocaleDateString('en-IN') : '-'} />
                                <SpecItem label="Lease Duration" value={p.availability?.leaseDuration || '-'} />
                                <SpecItem label="Preferred Tenants" value={p.availability?.preferredTenants?.join(', ') || '-'} />
                            </div>
                        </div>

                        {/* Amenities */}
                        {p.amenities?.length > 0 && (
                            <div className="bg-white rounded-2xl border border-dark-100 p-6">
                                <h2 className="text-lg font-bold text-dark-900 mb-4">Amenities</h2>
                                <div className="flex flex-wrap gap-2">
                                    {p.amenities.map((a, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-dark-50 text-dark-700 text-xs font-medium rounded-lg border border-dark-100">
                                            {a}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Map */}
                        <div className="bg-white p-6 rounded-2xl border border-dark-100">
                            <h2 className="text-lg font-bold text-dark-900 mb-4">Location Map (Admin View)</h2>
                            <div className="h-[350px] rounded-xl overflow-hidden border border-dark-100" style={{ position: 'relative', zIndex: 1 }}>
                                {p.location?.coordinates?.lat && p.location?.coordinates?.lng ? (
                                    <MapContainer center={[p.location.coordinates.lat, p.location.coordinates.lng]} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                                        <Marker position={[p.location.coordinates.lat, p.location.coordinates.lng]} icon={customIcon}>
                                            <Popup>
                                                <strong>{p.title}</strong><br />
                                                {p.location.area}, {p.location.city}
                                            </Popup>
                                        </Marker>
                                    </MapContainer>
                                ) : (
                                    <div className="w-full h-full bg-dark-50 flex items-center justify-center text-dark-400 flex-col gap-2">
                                        <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A2 2 0 013 15.487V5.461a2 2 0 012.764-1.843L11 6l5.447-2.724A2 2 0 0119 5.093v10.026a2 2 0 01-1.236 1.843L12 20m0 0V6" /></svg>
                                        <p className="text-xs font-semibold">Coordinates not provided</p>
                                        <p className="text-[10px] text-dark-300">{p.location?.fullAddress}</p>
                                    </div>
                                )}
                            </div>
                            {p.location?.fullAddress && (
                                <p className="text-dark-500 text-xs mt-3">
                                    {p.location.fullAddress}, {p.location.pinCode}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Sidebar (right 1/3) */}
                    <div className="space-y-6">
                        {/* Pricing */}
                        <div className="bg-white rounded-2xl border border-dark-100 p-6">
                            <h2 className="text-lg font-bold text-dark-900 mb-4">Pricing</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-dark-500 text-sm">Monthly Rent</span>
                                    <span className="text-xl font-black text-dark-900">₹{p.pricing?.monthlyRent?.toLocaleString() || 0}</span>
                                </div>
                                {p.pricing?.securityDeposit > 0 && (
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-dark-500 text-sm">Security Deposit</span>
                                        <span className="text-dark-900 font-bold">₹{p.pricing.securityDeposit.toLocaleString()}</span>
                                    </div>
                                )}
                                {p.pricing?.maintenanceCharges > 0 && (
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-dark-500 text-sm">Maintenance</span>
                                        <span className="text-dark-900 font-bold">₹{p.pricing.maintenanceCharges.toLocaleString()}/mo</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Current Tenants */}
                        {p.approvedTenants && p.approvedTenants.length > 0 && (
                            <div className="bg-white rounded-2xl border border-primary-200 p-6 shadow-sm">
                                <h2 className="text-lg font-bold text-dark-900 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                                    Current Tenants
                                </h2>
                                <div className="space-y-4">
                                    {p.approvedTenants.map((app, i) => (
                                        <div key={i} className="flex flex-col gap-2 p-3 bg-primary-50 border border-primary-100 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-primary-600 shadow-sm">
                                                    {app.tenant?.firstName?.[0] || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-dark-900 text-sm leading-none">{app.tenant?.firstName} {app.tenant?.lastName}</p>
                                                    <p className="text-xs text-dark-500 mt-1">{app.tenant?.email}</p>
                                                </div>
                                            </div>
                                            {app.tenant?.phone && (
                                                <div className="text-xs text-dark-600 font-medium">Phone: {app.tenant.phone}</div>
                                            )}
                                            <div className="flex justify-between items-center text-[10px] font-bold mt-1 text-primary-700">
                                                <span>Moved in: {new Date(app.createdAt).toLocaleDateString('en-IN')}</span>
                                                <span className="bg-white px-2 py-0.5 rounded-full">Active Lease</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Manager Info */}
                        <div className="bg-white rounded-2xl border border-dark-100 p-6">
                            <h2 className="text-lg font-bold text-dark-900 mb-4">Listed By</h2>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                    {(p.owner?.firstName?.[0] || '?').toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-dark-900 text-sm">{p.owner?.firstName} {p.owner?.lastName}</p>
                                    <p className="text-dark-400 text-xs">{p.owner?.role}</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-dark-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    <span className="truncate">{p.owner?.email}</span>
                                </div>
                                {p.owner?.phone && (
                                    <div className="flex items-center gap-2 text-dark-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                        <span>{p.owner.phone}</span>
                                    </div>
                                )}
                                <p className="text-dark-300 text-[10px] mt-2">
                                    Joined {new Date(p.owner?.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        {/* Ownership Info */}
                        {p.ownership && (
                            <div className="bg-white rounded-2xl border border-dark-100 p-6">
                                <h2 className="text-lg font-bold text-dark-900 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    Owner Details
                                </h2>
                                <div className="space-y-2 text-sm">
                                    {p.ownership.ownerName && (
                                        <div className="flex justify-between">
                                            <span className="text-dark-400">Name</span>
                                            <span className="text-dark-900 font-medium">{p.ownership.ownerName}</span>
                                        </div>
                                    )}
                                    {p.ownership.ownerContact && (
                                        <div className="flex justify-between">
                                            <span className="text-dark-400">Contact</span>
                                            <span className="text-dark-900 font-medium">{p.ownership.ownerContact}</span>
                                        </div>
                                    )}
                                    {p.ownership.ownerEmail && (
                                        <div className="flex justify-between">
                                            <span className="text-dark-400">Email</span>
                                            <span className="text-dark-900 font-medium truncate max-w-[160px]">{p.ownership.ownerEmail}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Verification Documents */}
                        <div className="bg-white rounded-2xl border border-dark-100 p-6">
                            <h2 className="text-lg font-bold text-dark-900 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                Verification Documents
                            </h2>
                            {(() => {
                                const docs = p.ownership?.documents || {};
                                const docEntries = [
                                    { key: 'ownershipProof', label: 'Ownership Proof', },
                                    { key: 'propertyDocument', label: 'Property Document', },
                                    { key: 'electricityBill', label: 'Electricity Bill',},
                                    { key: 'taxReceipt', label: 'Tax Receipt',},
                                ];
                                const uploadedDocs = docEntries.filter(d => docs[d.key]?.url);

                                if (uploadedDocs.length === 0) {
                                    return (
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                                            <p className="text-amber-700 text-sm font-medium">No documents uploaded</p>
                                            <p className="text-amber-500 text-xs mt-1">Manager has not uploaded any verification documents.</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-2">
                                        {docEntries.map(doc => {
                                            const hasDoc = docs[doc.key]?.url;
                                            return (
                                                <div key={doc.key} className={`flex items-center justify-between p-3 rounded-xl border ${hasDoc ? 'bg-emerald-50 border-emerald-200' : 'bg-dark-50 border-dark-100'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base">{doc.icon}</span>
                                                        <span className={`text-xs font-medium ${hasDoc ? 'text-emerald-800' : 'text-dark-400'}`}>{doc.label}</span>
                                                    </div>
                                                    {hasDoc ? (
                                                        <a
                                                            href={docs[doc.key].url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-primary-600 text-xs font-bold hover:text-primary-700 transition-colors"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                            View
                                                        </a>
                                                    ) : (
                                                        <span className="text-dark-300 text-[10px] font-medium">Not uploaded</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}

                            {/* Verification Status */}
                            <div className="mt-4 pt-4 border-t border-dark-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-dark-400 text-xs font-medium">Verification Status</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                        p.verificationStatus === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        p.verificationStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                        'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                        {p.verificationStatus === 'verified' ? 'Verified' :
                                         p.verificationStatus === 'rejected' ? 'Rejected' :
                                         '⏳ Pending Review'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Meta */}
                        <div className="bg-white rounded-2xl border border-dark-100 p-6">
                            <h2 className="text-lg font-bold text-dark-900 mb-4">Meta</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-dark-400">Views</span>
                                    <span className="text-dark-900 font-bold">{p.views || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-400">Created</span>
                                    <span className="text-dark-700">{new Date(p.createdAt).toLocaleDateString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-400">Last Updated</span>
                                    <span className="text-dark-700">{new Date(p.updatedAt).toLocaleDateString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-400">Verified</span>
                                    <span className="text-dark-700">{p.verified ? 'Yes' : 'No'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-400">Boosted</span>
                                    <span className="text-dark-700">{p.boosted ? 'Yes' : 'No'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Modal */}
            {errorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setErrorModal(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-dark-900 mb-2">Impersonation Failed</h3>
                        <p className="text-dark-500 text-sm mb-6 pb-2">
                            {errorModal}
                        </p>
                        <button
                            onClick={() => setErrorModal(null)}
                            className="w-full py-3 rounded-xl font-bold text-white bg-dark-900 hover:bg-dark-800 transition-all text-sm active:scale-[0.98]"
                        >
                            Understood
                        </button>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

function SpecItem({ label, value }) {
    return (
        <div className="bg-dark-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-dark-900 font-semibold text-sm capitalize">{value}</p>
        </div>
    );
}
