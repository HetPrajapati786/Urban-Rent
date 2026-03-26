import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { apiGet, apiPatch } from '../../utils/api';

export default function ManagerDashboard() {
    const { user } = useUser();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [respondingId, setRespondingId] = useState(null);

    const isDemo = window.location.pathname.startsWith('/demo');

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const data = await apiGet('/dashboard/manager');
                setDashboard(data);
            } catch (err) {
                console.error('Dashboard fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const handleRespond = async (applicationId, status) => {
        setRespondingId(applicationId);
        try {
            await apiPatch(`/applications/${applicationId}/respond`, { status });
            // Refresh dashboard
            const data = await apiGet('/dashboard/manager');
            setDashboard(data);
        } catch (err) {
            console.error('Respond error:', err);
        } finally {
            setRespondingId(null);
        }
    };

    const stats = dashboard?.stats || {};
    const recentApplications = dashboard?.recentApplications || [];
    const properties = dashboard?.properties || [];

    const statCards = [
        {
            label: 'Total Properties',
            value: stats.totalProperties || 0,
            sub: `${stats.activeListings || 0} active, ${stats.pendingListings || 0} pending`,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            color: 'bg-blue-50 text-blue-600',
            accent: 'border-blue-200',
        },
        {
            label: 'Pending Requests',
            value: stats.pendingApplicationsCount || 0,
            sub: `${stats.totalApplications || 0} total applications`,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            ),
            color: 'bg-amber-50 text-amber-600',
            accent: 'border-amber-200',
        },
        {
            label: 'Total Views',
            value: (stats.totalViews || 0).toLocaleString(),
            sub: `${stats.totalInquiries || 0} inquiries`,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            ),
            color: 'bg-purple-50 text-purple-600',
            accent: 'border-purple-200',
        },
        {
            label: 'Verified',
            value: stats.verifiedProperties || 0,
            sub: `${stats.boostedProperties || 0} boosted`,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
            color: 'bg-teal-50 text-teal-600',
            accent: 'border-teal-200',
        },
        {
            label: 'Active Tenants',
            value: stats.approvedTenantsCount || 0,
            sub: 'Approved applications',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            color: 'bg-rose-50 text-rose-600',
            accent: 'border-rose-200',
        },
    ];

    const getStatusBadge = (status) => {
        const styles = {
            active: 'bg-blue-50 text-blue-700 border-blue-200',
            pending: 'bg-amber-50 text-amber-700 border-amber-200',
            paused: 'bg-gray-100 text-gray-600 border-gray-200',
            rejected: 'bg-red-50 text-red-600 border-red-200',
        };
        return styles[status] || styles.pending;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    if (loading) {
        return (
            <ManagerLayout breadcrumbs={[{ label: 'Home', href: '/manager/dashboard' }, { label: 'Dashboard' }]}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-dark-500 text-sm">Loading dashboard...</p>
                    </div>
                </div>
            </ManagerLayout>
        );
    }

    return (
        <ManagerLayout
            breadcrumbs={[
                { label: 'Home', href: '/manager/dashboard' },
                { label: 'Dashboard' },
            ]}
        >
            {/* Welcome */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-dark-900 mb-1">
                    Welcome back, {user?.firstName || 'Manager'}
                </h1>
                <p className="text-dark-500">
                    Here's an overview of your properties and activity.
                </p>
            </div>

            {/* ─── Stats Grid ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {statCards.map((card, i) => (
                    <div key={i} className={`bg-white rounded-2xl p-5 border ${card.accent} hover:shadow-md transition-all duration-300`}>
                        <div className="flex items-start justify-between mb-3">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.color}`}>
                                {card.icon}
                            </div>
                        </div>
                        <p className="text-2xl font-black text-dark-900">{card.value}</p>
                        <p className="text-dark-400 text-xs font-medium mt-0.5">{card.label}</p>
                        <p className="text-dark-400 text-[11px] mt-1">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* ─── Main Grid: Applications + Quick Actions ─── */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
                {/* Recent Applications */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-dark-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-dark-100 flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-dark-900">Recent Requests</h2>
                            <p className="text-dark-400 text-xs mt-0.5">{recentApplications.length} pending</p>
                        </div>
                        <Link
                            to={isDemo ? '/demo/manager/applications' : '/manager/applications'}
                            className="text-primary-600 text-xs font-semibold hover:text-primary-700"
                        >
                            View All →
                        </Link>
                    </div>

                    {recentApplications.length > 0 ? (
                        <div className="divide-y divide-dark-50">
                            {recentApplications.map((app) => (
                                <div key={app._id} className="px-6 py-4 flex items-center gap-4 hover:bg-dark-25 transition-colors">
                                    {/* Tenant avatar */}
                                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-primary-700 font-bold text-sm">
                                        {app.tenant?.firstName?.[0] || '?'}{app.tenant?.lastName?.[0] || ''}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-dark-800 truncate">
                                            {app.tenant?.firstName} {app.tenant?.lastName}
                                        </p>
                                        <p className="text-xs text-dark-400 truncate">
                                            {app.property?.title || 'Property'} • Move-in: {formatDate(app.moveInDate)}
                                        </p>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleRespond(app._id, 'approved')}
                                            disabled={respondingId === app._id}
                                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleRespond(app._id, 'rejected')}
                                            disabled={respondingId === app._id}
                                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-6 py-12 text-center">
                            <div className="w-12 h-12 bg-dark-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-dark-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <p className="text-dark-400 text-sm">No pending requests</p>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl border border-dark-100 p-5">
                    <h2 className="font-bold text-dark-900 mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                        {[
                            {
                                title: 'Add Property',
                                desc: 'List a new property',
                                href: isDemo ? '/demo/manager/add-property' : '/manager/add-property',
                                icon: (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                                    </svg>
                                ),
                                color: 'bg-blue-50 text-blue-600',
                            },
                            {
                                title: 'All Properties',
                                desc: 'Manage your listings',
                                href: isDemo ? '/demo/manager/properties' : '/manager/properties',
                                icon: (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                ),
                                color: 'bg-blue-50 text-blue-600',
                            },
                            {
                                title: 'Applications',
                                desc: 'View tenant requests',
                                href: isDemo ? '/demo/manager/applications' : '/manager/applications',
                                icon: (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                ),
                                color: 'bg-purple-50 text-purple-600',
                            },
                        ].map((action, i) => (
                            <Link
                                key={i}
                                to={action.href}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-25 transition-colors group"
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                                    {action.icon}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-dark-800">{action.title}</p>
                                    <p className="text-xs text-dark-400">{action.desc}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── My Properties — Horizontal Cards ─── */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-dark-900">My Properties</h2>
                        <p className="text-dark-400 text-xs">{properties.length} total properties</p>
                    </div>
                    <Link
                        to={isDemo ? '/demo/manager/properties' : '/manager/properties'}
                        className="text-primary-600 text-xs font-semibold hover:text-primary-700"
                    >
                        View All →
                    </Link>
                </div>

                {properties.length > 0 ? (
                    <div className="space-y-4">
                        {properties.map((property) => (
                            <Link
                                key={property._id}
                                to={isDemo ? `/demo/manager/properties/${property._id}` : `/manager/properties/${property._id}`}
                                className="block bg-white rounded-2xl border border-dark-100 hover:shadow-lg hover:border-dark-200 transition-all duration-300 overflow-hidden group"
                            >
                                <div className="flex flex-col sm:flex-row">
                                    {/* Image */}
                                    <div className="sm:w-56 md:w-64 h-[200px] sm:h-auto relative flex-shrink-0 overflow-hidden bg-dark-50 border-r border-dark-100">
                                        <img
                                            src={property.images?.[0]?.url || 'https://via.placeholder.com/400x300?text=No+Image'}
                                            alt={property.title}
                                            className="w-full sm:absolute sm:inset-0 h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute top-3 left-3 z-10">
                                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border shadow-sm ${getStatusBadge(property.status)} capitalize`}>
                                                {property.status}
                                            </span>
                                        </div>
                                        {property.verified && (
                                            <div className="absolute top-3 right-3 z-10 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center shadow-sm">
                                                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-4 sm:p-5 flex flex-col min-w-0">
                                        <div>
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-dark-900 truncate group-hover:text-primary-600 transition-colors">
                                                        {property.title}
                                                    </h3>
                                                    <p className="text-dark-400 text-xs truncate mt-0.5">
                                                        {property.location?.area}, {property.location?.city}, {property.location?.state}
                                                    </p>
                                                </div>
                                                <p className="text-lg font-black text-primary-600 whitespace-nowrap">
                                                    ₹{(property.pricing?.monthlyRent || 0).toLocaleString('en-IN')}
                                                    <span className="text-dark-400 text-xs font-medium">/mo</span>
                                                </p>
                                            </div>

                                            {/* Mini stats */}
                                            <div className="flex items-center gap-4 mt-3">
                                                <div className="flex items-center gap-1.5 text-dark-400">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    <span className="text-xs font-medium">{property.views || 0} views</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-dark-400">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                    <span className="text-xs font-medium">{property.inquiries || 0} inquiries</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-dark-400">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="text-xs font-medium">{formatDate(property.pricing?.availableFrom)}</span>
                                                </div>
                                                {property.boosted && (
                                                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                        Boosted
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Approved Tenants */}
                                        {(property.approvedTenants?.length > 0 || property.pendingApplications > 0) && (
                                            <div className="mt-4 pt-3 border-t border-dark-50">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {property.approvedTenants?.length > 0 && (
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex -space-x-2">
                                                                    {property.approvedTenants.slice(0, 3).map((app, i) => (
                                                                        <div key={i} className="w-7 h-7 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-primary-700">
                                                                            {app.tenant?.firstName?.[0] || '?'}
                                                                        </div>
                                                                    ))}
                                                                    {property.approvedTenants.length > 3 && (
                                                                        <div className="w-7 h-7 rounded-full bg-dark-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-dark-500">
                                                                            +{property.approvedTenants.length - 3}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-dark-500 font-medium">
                                                                    {property.approvedTenants.length} tenant{property.approvedTenants.length !== 1 ? 's' : ''}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {property.pendingApplications > 0 && (
                                                        <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                                            {property.pendingApplications} pending
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Tenant details */}
                                                {property.approvedTenants?.length > 0 && (
                                                    <div className="mt-2 space-y-1.5">
                                                        {property.approvedTenants.slice(0, 2).map((app, i) => {
                                                            const moveIn = app.moveInDate ? new Date(app.moveInDate) : null;
                                                            const endDate = moveIn && app.leaseDuration
                                                                ? new Date(moveIn.setMonth(moveIn.getMonth() + app.leaseDuration))
                                                                : null;

                                                            return (
                                                                <div key={i} className="bg-dark-25 rounded-xl px-3 py-3 border border-dark-50/50">
                                                                    <div className="flex items-center justify-between mb-1.5">
                                                                        <span className="text-xs font-bold text-dark-800">
                                                                            {app.tenant?.firstName} {app.tenant?.lastName}
                                                                        </span>
                                                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                                                            Rent Due: 5th
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 text-[10px] text-dark-400 font-medium">
                                                                        <div className="flex items-center gap-1">
                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                            </svg>
                                                                            <span>Moved in: {formatDate(app.moveInDate)}</span>
                                                                        </div>
                                                                        {endDate && (
                                                                            <div className="flex items-center gap-1 text-amber-600">
                                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                </svg>
                                                                                <span>Stay ends: {formatDate(endDate)}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        {property.approvedTenants.length > 2 && (
                                                            <button className="w-full py-1.5 text-[10px] font-bold text-primary-600 hover:text-primary-700 transition-colors">
                                                                View all {property.approvedTenants.length} tenants
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="bg-white rounded-2xl border border-dark-100 p-12 text-center">
                        <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-dark-900 mb-2">List Your First Property</h3>
                        <p className="text-dark-500 max-w-md mx-auto mb-6">
                            Start by adding your properties. Once approved by our admin team, they'll be visible to thousands of potential tenants.
                        </p>
                        <Link
                            to={isDemo ? '/demo/manager/add-property' : '/manager/add-property'}
                            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Property
                        </Link>
                    </div>
                )}
            </div>
        </ManagerLayout>
    );
}
