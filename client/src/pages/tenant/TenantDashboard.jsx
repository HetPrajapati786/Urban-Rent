import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser, SignedIn } from '@clerk/clerk-react';
import TenantLayout from '../../layouts/TenantLayout';
import TenantPropertyCard from '../../components/tenant/TenantPropertyCard';
import { apiGet, apiPost } from '../../utils/api';

const DEMO_STATS = [
    { 
        label: 'Saved', 
        value: '3', 
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        ), 
        color: 'bg-rose-50 text-rose-600' 
    },
    { 
        label: 'Applications', 
        value: '1', 
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ), 
        color: 'bg-emerald-50 text-emerald-600' 
    },
    { 
        label: 'Messages', 
        value: '2', 
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
        ), 
        color: 'bg-amber-50 text-amber-600' 
    },
];

const QUICK_LINKS = [
    {
        label: 'Browse Properties',
        desc: 'Explore all available listings',
        path: 'properties',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
        bg: 'bg-blue-50 text-blue-600',
    },
    {
        label: 'Search',
        desc: 'Filter by location, price & more',
        path: 'search',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        ),
        bg: 'bg-primary-50 text-primary-600',
    },
    {
        label: 'Favourites',
        desc: 'Properties you have saved',
        path: 'favourites',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        ),
        bg: 'bg-rose-50 text-rose-600',
    },
    {
        label: 'Applications',
        desc: 'Track your rental applications',
        path: 'applications',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        bg: 'bg-emerald-50 text-emerald-600',
    },
];

const SuggestedPropertyPanel = ({ property, onClose, isDemo }) => {
    if (!property) return null;
    const base = isDemo ? '/demo/tenant' : '/tenant';

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] bg-white rounded-xl shadow-2xl shadow-dark-900/10 border border-primary-100 p-3 z-50 animate-slide-up flex gap-4 pr-10">
            <button onClick={onClose} className="absolute top-2 right-2 p-1.5 text-dark-400 hover:text-dark-700 hover:bg-dark-50 rounded-lg transition-colors z-10">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-lg overflow-hidden relative">
                {property.images?.[0]?.url ? (
                    <img src={property.images[0].url} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-dark-100" />
                )}
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-white/95 backdrop-blur-sm rounded text-[9px] font-bold text-primary-600 uppercase tracking-widest shadow-sm">
                    Suggested
                </div>
            </div>
            
            <div className="flex flex-col justify-center flex-1 min-w-0 py-1">
                <h4 className="font-bold text-dark-900 text-sm truncate mb-0.5">{property.title}</h4>
                <p className="text-xs text-dark-500 mb-3 truncate">{property.location?.area}, {property.location?.city}</p>
                
                <div className="flex items-center justify-between mt-auto">
                    <span className="font-black text-primary-600 text-sm">₹{property.pricing?.monthlyRent?.toLocaleString()}</span>
                    <Link to={`${base}/properties/${property._id}`} className="text-xs font-bold text-white bg-dark-900 px-4 py-1.5 rounded-lg hover:bg-dark-800 transition-colors">
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default function TenantDashboard() {
    const { user } = useUser();
    const location = useLocation();
    const isDemo = location.pathname.startsWith('/demo');
    const base = isDemo ? '/demo/tenant' : '/tenant';

    const [applications, setApplications] = useState([]);
    const [stats, setStats] = useState(DEMO_STATS);
    const [suggestedProperty, setSuggestedProperty] = useState(null);
    const [showSuggestion, setShowSuggestion] = useState(true);
    const [loading, setLoading] = useState(true);

    const [decliningId, setDecliningId] = useState(null);
    const [activeTab, setActiveTab] = useState('active');
    const [terminatingId, setTerminatingId] = useState(null);
    const [showTerminateModal, setShowTerminateModal] = useState(null);

    const loadDashboardData = useCallback(async () => {
        try {
            // Fetch user's applications which include invoice details
            const appsData = await apiGet('/applications/my');
            const apps = appsData.applications || [];
            setApplications(apps);

            // Fetch a random property for suggestion
            const propsData = await apiGet('/properties?status=active');
            const props = propsData.properties || [];
            
            // Exclude properties the user has already applied for
            const rentedPropertyIds = new Set(apps.map(a => a.property?._id || a.property));
            const availableProps = props.filter(p => !rentedPropertyIds.has(p._id));
            
            if (availableProps.length > 0) {
                setSuggestedProperty(availableProps[Math.floor(Math.random() * availableProps.length)]);
            }

            // Update stats
            try {
                const favData = await apiGet('/users/favourites');
                setStats([
                    { label: 'Saved', value: favData.savedIds?.length || 0, icon: DEMO_STATS[0].icon, color: DEMO_STATS[0].color },
                    { label: 'Applications', value: apps.length, icon: DEMO_STATS[1].icon, color: DEMO_STATS[1].color },
                    { label: 'Messages', value: 0, icon: DEMO_STATS[2].icon, color: DEMO_STATS[2].color }, // Optional backend message count logic can be placed here
                ]);
            } catch { }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDeclineInvoice = async (invoiceId) => {
        if (!window.confirm('Are you sure you want to decline this invoice? You will lose your reserved spot and the property will become available to others.')) return;
        try {
            setDecliningId(invoiceId);
            await apiPost(`/invoices/${invoiceId}/decline`);
            await loadDashboardData();
        } catch (err) {
            alert('Failed to decline: ' + err.message);
        } finally {
            setDecliningId(null);
        }
    };

    useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

    const handleRequestTermination = async (appId) => {
        try {
            setTerminatingId(appId);
            await apiPost(`/applications/${appId}/terminate/request`);
            setShowTerminateModal(null);
            await loadDashboardData();
        } catch (err) {
            alert('Failed to request termination: ' + err.message);
        } finally {
            setTerminatingId(null);
        }
    };

    const paidStays = applications.filter(a => a.status === 'approved' && a.invoice?.status === 'paid');
    const awaitingPaymentStays = applications.filter(a => a.status === 'approved' && a.invoice?.status !== 'paid');
    
    const displayStays = activeTab === 'active' ? paidStays : awaitingPaymentStays;

    if (loading) {
        return (
            <TenantLayout>
                <div className="flex justify-center items-center min-h-[50vh]">
                    <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                </div>
            </TenantLayout>
        );
    }

    return (
        <TenantLayout
            breadcrumbs={[{ label: 'Home' }]}
        >
            {/* Welcome Banner */}
            <div className="relative bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl p-6 sm:p-8 mb-8 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -right-10 -top-10 w-64 h-64 bg-white rounded-full" />
                    <div className="absolute -right-5 -bottom-20 w-48 h-48 bg-white rounded-full" />
                </div>
                <div className="relative">
                    <p className="text-primary-100 text-sm font-medium mb-1">Welcome back</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                        {user?.firstName || 'Tenant'}!
                    </h1>
                    <p className="text-primary-100 text-sm max-w-md mb-5">
                        Your rental journey starts here. Browse verified properties, save your favourites, and apply with ease.
                    </p>
                    <Link
                        to={`${base}/properties`}
                        className="inline-flex items-center gap-2 bg-white text-primary-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-50 transition-colors shadow-md"
                    >
                        Browse Properties
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 border border-dark-100 hover:shadow-md transition-shadow">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3 ${stat.color}`}>
                            {stat.icon}
                        </div>
                        <p className="text-2xl font-bold text-dark-900">{stat.value}</p>
                        <p className="text-dark-400 text-xs mt-1 font-medium">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Active Stays Widget */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                    <h2 className="text-lg font-bold text-dark-900">Your Rentals</h2>
                    
                    <div className="flex items-center gap-2 p-1 bg-dark-50 rounded-xl border border-dark-100 max-w-xs self-start sm:self-auto">
                        <button 
                            onClick={() => setActiveTab('active')}
                            className={`flex-1 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'active' ? 'bg-white text-primary-600 shadow-sm' : 'text-dark-500 hover:text-dark-900'}`}
                        >
                            Active Stays ({paidStays.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('awaiting')}
                            className={`flex-1 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'awaiting' ? 'bg-white text-amber-600 shadow-sm' : 'text-dark-500 hover:text-dark-900'}`}
                        >
                            Awaiting Payment ({awaitingPaymentStays.length})
                        </button>
                    </div>
                </div>

                {displayStays.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dark-100 p-8 text-center">
                        <div className="w-12 h-12 bg-dark-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-dark-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                        </div>
                        <p className="text-dark-500 text-sm mb-4">
                            {activeTab === 'active' 
                                ? "You don't have any active stays yet." 
                                : "You don't have any applications awaiting payment."}
                        </p>
                        <Link to={`${base}/properties`} className="text-sm font-semibold text-primary-600 border border-primary-200 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors">Find a Home</Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-5">
                        {displayStays.map(app => {
                            const isInvoicePaid = app.invoice?.status === 'paid';
                            const dueDate = new Date(app.invoice?.dueDate || Date.now());
                            const isOverdue = !isInvoicePaid && dueDate < new Date();

                            // Calculate stay duration (approximate from moveInDate)
                            let stayText = "Just Moved In";
                            if (app.moveInDate && app.leaseDuration) {
                                const moveIn = new Date(app.moveInDate);
                                const end = new Date(moveIn);
                                end.setMonth(end.getMonth() + app.leaseDuration);
                                const diffDays = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
                                
                                if (diffDays > 0) {
                                    stayText = `${Math.floor(diffDays / 30)} mo, ${diffDays % 30} days left on lease`;
                                } else {
                                    stayText = "Lease Expired";
                                }
                            }

                            return (
                                <div key={app._id} className={`bg-white rounded-2xl border overflow-hidden flex flex-row group transition-all relative h-36 ${!isInvoicePaid ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.15)] bg-amber-50/10' : 'border-dark-100 hover:shadow-lg hover:border-primary-200'}`}>
                                    <div className="w-44 flex-shrink-0 bg-dark-50 relative overflow-hidden">
                                        {app.property?.images?.[0]?.url ? (
                                            <img src={app.property.images[0].url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg className="w-8 h-8 text-dark-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" ><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                            </div>
                                        )}
                                        {isInvoicePaid ? (
                                            <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-lg leading-none shadow-sm backdrop-blur-sm">ACTIVE</div>
                                        ) : (
                                            <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-lg leading-none shadow-sm backdrop-blur-sm uppercase tracking-wider">Awaiting Payment</div>
                                        )}
                                        {!isInvoicePaid && (
                                            <>
                                                <div className="absolute inset-0 bg-amber-500/10 z-0 pointer-events-none mix-blend-multiply border-r border-amber-400/30"></div>
                                                <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                                    <svg className="w-8 h-8 text-amber-400 mb-2 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                                    <span className="text-white font-bold text-[11px] mb-1 tracking-wide uppercase">Payment Pending</span>
                                                    <span className="text-white/90 text-[10px] leading-snug max-w-[95%]">Reserved for you. Complete payment within 7 days before it passes to the waitlist.</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <Link to={`${base}/properties/${app.property?._id}`} className="block">
                                                <h3 className="font-bold text-dark-900 group-hover:text-primary-600 transition-colors truncate mb-1 text-lg">
                                                    {app.property?.title}
                                                </h3>
                                            </Link>
                                            <p className="text-sm text-dark-500 mb-4">{app.property?.location?.area}, {app.property?.location?.city}</p>
                                        </div>
                                        
                                        {/* Reduced Card Heights (No Extra Banners required anymore) */}
                                        
                                        <div className="space-y-3 bg-dark-50/50 p-3 rounded-xl border border-dark-100">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-dark-500 font-medium">Rent Progress</span>
                                                <span className="text-dark-900 font-semibold text-xs bg-white px-2 py-0.5 rounded-md border border-dark-100 shadow-sm">{stayText}</span>
                                            </div>
                                            
                                            <div className="flex items-center justify-between text-sm pt-2 border-t border-dark-100">
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    <span className="text-dark-500">Next Rent:</span>
                                                    <span className="text-dark-900">₹{(app.property?.pricing?.monthlyRent || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isInvoicePaid ? (
                                                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                                                            Paid
                                                        </span>
                                                    ) : isOverdue ? (
                                                        <span className="text-xs font-bold text-red-600">Overdue: {dueDate.toLocaleDateString()}</span>
                                                    ) : (
                                                        <span className="text-xs font-bold text-amber-600">Due: {dueDate.toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pay / Decline actions for pending invoice */}
                                        {!isInvoicePaid && app.invoice?._id && (
                                            <div className="mt-3 flex gap-2">
                                                <Link
                                                    to={`${base}/applications`}
                                                    className="flex-1 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg text-center hover:bg-amber-600 transition-all"
                                                >
                                                    Pay Invoice
                                                </Link>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeclineInvoice(app.invoice._id); }}
                                                    disabled={decliningId === app.invoice._id}
                                                    className="flex-1 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50"
                                                >
                                                    {decliningId === app.invoice._id ? 'Declining...' : 'Decline Invoice'}
                                                </button>
                                            </div>
                                        )}

                                        {/* Early Termination for active stays */}
                                        {isInvoicePaid && (
                                            <div className="mt-3">
                                                {app.termination?.status === 'processed' ? (
                                                    <div className="flex items-center gap-2 text-xs bg-dark-50 border border-dark-200 rounded-lg px-3 py-2">
                                                        <svg className="w-3.5 h-3.5 text-dark-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                                                        <span className="text-dark-600 font-medium">Terminated — Refund: ₹{(app.termination.refundAmount || 0).toLocaleString()}</span>
                                                    </div>
                                                ) : app.termination?.status === 'requested' ? (
                                                    <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                                        <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                                        <span className="text-amber-700 font-medium">Termination Requested — Awaiting Manager Review</span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setShowTerminateModal(app); }}
                                                        className="w-full py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-all"
                                                    >
                                                        Request Early Termination
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Quick Links */}
            <div className="mb-8">
                <h2 className="text-lg font-bold text-dark-900 mb-4">Quick Actions</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {QUICK_LINKS.map((ql, i) => (
                        <Link
                            key={i}
                            to={`${base}/${ql.path}`}
                            className="group bg-white rounded-xl p-5 border border-dark-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${ql.bg} group-hover:scale-110 transition-transform`}>
                                {ql.icon}
                            </div>
                            <h3 className="font-semibold text-dark-900 mb-1">{ql.label}</h3>
                            <p className="text-dark-400 text-sm">{ql.desc}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Suggestion Panel */}
            {showSuggestion && <SuggestedPropertyPanel property={suggestedProperty} onClose={() => setShowSuggestion(false)} isDemo={isDemo} />}

            {/* Early Termination Confirmation Modal */}
            {showTerminateModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => !terminatingId && setShowTerminateModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-dark-900">Request Early Termination</h3>
                                <p className="text-dark-400 text-xs">This will notify the property manager</p>
                            </div>
                        </div>

                        <div className="bg-dark-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-dark-500">Property</span>
                                <span className="text-dark-900 font-medium">{showTerminateModal.property?.title}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-dark-500">Security Deposit</span>
                                <span className="text-dark-900 font-medium">₹{(showTerminateModal.invoice?.breakdown?.securityDeposit || showTerminateModal.property?.pricing?.securityDeposit || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-dark-500">Lease Duration</span>
                                <span className="text-dark-900 font-medium">{showTerminateModal.leaseDuration || '—'} months</span>
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5">
                            <p className="text-red-700 text-xs font-medium flex items-start gap-2">
                                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01"/></svg>
                                By requesting termination, the manager will review your request and process any applicable security deposit refund. The refund amount is at the manager's discretion based on property condition and lease terms.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowTerminateModal(null)}
                                disabled={terminatingId}
                                className="flex-1 py-2.5 text-sm font-medium text-dark-500 bg-dark-50 rounded-xl hover:bg-dark-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleRequestTermination(showTerminateModal._id)}
                                disabled={terminatingId}
                                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {terminatingId ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Requesting...
                                    </>
                                ) : 'Confirm Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </TenantLayout>
    );
}
