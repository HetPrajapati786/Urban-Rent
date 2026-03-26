import { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { apiGet, apiPatch } from '../../utils/api';

const STATUS_TABS = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'rejected', label: 'Rejected' },
];

const STATUS_BADGE = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
};

export default function AdminApplications() {
    const location = useLocation();
    const isDemo = location.pathname.startsWith('/demo');

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [search, setSearch] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const fetchApplications = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('status', activeTab);
            params.set('limit', '100');
            const data = await apiGet(`/admin/applications?${params.toString()}`);
            let apps = data.applications || [];
            
            // Client side search fallback since backend doesn't have search implemented yet
            if (search) {
                const s = search.toLowerCase();
                apps = apps.filter(app => 
                    app.property?.title?.toLowerCase().includes(s) || 
                    app.tenant?.firstName?.toLowerCase().includes(s) ||
                    app.manager?.firstName?.toLowerCase().includes(s)
                );
            }
            setApplications(apps);
        } catch (err) {
            console.error('Fetch applications error:', err);
        } finally {
            setLoading(false);
        }
    }, [activeTab, search]);

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            fetchApplications();
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [fetchApplications, search]);

    const handleUpdateStatus = async (appId, newStatus) => {
        if (!window.confirm(`Are you sure you want to force-${newStatus} this application?`)) return;
        setActionLoadingId(appId);
        try {
            await apiPatch(`/admin/applications/${appId}/status`, { status: newStatus });
            fetchApplications();
        } catch (err) {
            alert('Failed: ' + err.message);
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <AdminLayout
            breadcrumbs={[
                { label: 'Dashboard', href: isDemo ? '/demo/admin' : '/admin/dashboard' },
                { label: 'Applications' },
            ]}
        >
            <div className="flex flex-col h-full min-h-0 gap-4">
                {/* Header */}
                <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-dark-900">Application Management</h1>
                        <p className="text-dark-400 text-sm mt-0.5">Intervene and manage leases across the platform</p>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            placeholder="Search by property, tenant, or manager..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-dark-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10"
                        />
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="flex-shrink-0 flex items-center gap-2">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${activeTab === tab.key
                                ? 'bg-dark-900 text-white border-dark-900'
                                : 'bg-white text-dark-500 border-dark-100 hover:border-dark-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-dark-50 flex items-center justify-center"><svg className="w-6 h-6 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                            <p className="text-dark-500 font-medium">No applications found</p>
                        </div>
                    ) : (
                        <>
                            {/* Table Header */}
                            <div className="hidden lg:grid grid-cols-12 gap-4 p-4 bg-dark-50 border-b border-dark-100 text-[10px] font-bold text-dark-400 uppercase tracking-widest">
                                <div className="col-span-3">Property</div>
                                <div className="col-span-2">Tenant</div>
                                <div className="col-span-2">Manager</div>
                                <div className="col-span-2">Status / Applied</div>
                                <div className="col-span-3 text-right">Actions</div>
                            </div>

                            {/* Rows */}
                            <div className="divide-y divide-dark-50">
                                {applications.map((app) => (
                                    <div key={app._id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 items-center hover:bg-dark-50/50 transition-colors">
                                        {/* Property */}
                                        <div className="col-span-3 flex items-center gap-3 min-w-0">
                                            <div className="w-12 h-12 bg-dark-100 rounded-lg overflow-hidden flex-shrink-0">
                                                {app.property?.images?.[0] ? (
                                                    <img src={app.property.images[0].url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-dark-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <Link to={isDemo ? `/demo/admin/properties/${app.property?._id}` : `/admin/properties/${app.property?._id}`} className="font-bold text-dark-900 text-sm truncate block hover:underline">
                                                    {app.property?.title || 'Unknown Property'}
                                                </Link>
                                                <p className="text-[10px] text-dark-500 truncate">{app.property?.location?.city}</p>
                                                <span className="font-bold text-indigo-600 text-[11px]">₹{(app.property?.pricing?.monthlyRent || 0).toLocaleString()}/mo</span>
                                            </div>
                                        </div>

                                        {/* Tenant */}
                                        <div className="col-span-2">
                                            <p className="font-bold text-dark-900 text-[13px]">{app.tenant?.firstName} {app.tenant?.lastName}</p>
                                            <p className="text-dark-500 text-[10px] truncate" title={app.tenant?.email}>{app.tenant?.email}</p>
                                            <p className="text-dark-400 text-[10px]">{app.tenant?.phone}</p>
                                        </div>

                                        {/* Manager */}
                                        <div className="col-span-2">
                                            <p className="font-bold text-dark-900 text-[13px]">{app.manager?.firstName} {app.manager?.lastName}</p>
                                            <p className="text-dark-500 text-[10px] truncate" title={app.manager?.email}>{app.manager?.email}</p>
                                        </div>

                                        {/* Status */}
                                        <div className="col-span-2">
                                            <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${STATUS_BADGE[app.status]}`}>
                                                {app.status}
                                            </span>
                                            <p className="text-dark-400 text-[10px] mt-1">
                                                {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="col-span-3 flex items-center justify-end gap-2 flex-wrap text-right">
                                            {app.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateStatus(app._id, 'accepted')}
                                                        disabled={actionLoadingId === app._id}
                                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-all disabled:opacity-50"
                                                    >
                                                        Force Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(app._id, 'rejected')}
                                                        disabled={actionLoadingId === app._id}
                                                        className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50"
                                                    >
                                                        Force Reject
                                                    </button>
                                                </>
                                            )}
                                            {app.status === 'accepted' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(app._id, 'rejected')}
                                                    disabled={actionLoadingId === app._id}
                                                    className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50"
                                                    title="Cancel this accepted application"
                                                >
                                                    Cancel Lease
                                                </button>
                                            )}
                                            {app.status === 'rejected' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(app._id, 'accepted')}
                                                    disabled={actionLoadingId === app._id}
                                                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-all disabled:opacity-50"
                                                    title="Re-approve this application"
                                                >
                                                    Force Accept
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                </div>
            </div>
        </AdminLayout>
    );
}
