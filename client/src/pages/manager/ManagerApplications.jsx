import { useState, useEffect, useCallback } from 'react';
import ManagerLayout from '../../layouts/ManagerLayout';
import { apiGet, apiPatch, apiPost } from '../../utils/api';

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    approved: { label: 'Approved', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
    withdrawn: { label: 'Withdrawn', color: 'bg-dark-50 text-dark-500 border-dark-200', dot: 'bg-dark-400' },
    waitlist: { label: 'Waitlisted', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    terminated: { label: 'Terminated', color: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' },
};

const PLACEHOLDER = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&h=150&fit=crop';

// Inline toast component
function Toast({ toast, onDismiss }) {
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(onDismiss, 4500);
        return () => clearTimeout(t);
    }, [toast, onDismiss]);
    if (!toast) return null;
    const isError = toast.type === 'error';
    return (
        <div className={`fixed top-5 right-5 z-[9999] flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl max-w-sm border animate-slide-in ${
            isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isError ? 'bg-red-100' : 'bg-blue-100'}`}>
                {isError
                    ? <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    : <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                }
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{isError ? 'Action Failed' : 'Success'}</p>
                <p className="text-xs mt-0.5 leading-snug opacity-80">{toast.message}</p>
            </div>
            <button onClick={onDismiss} className="opacity-50 hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    );
}

export default function ManagerApplications() {
    const isDemo = window.location.pathname.startsWith('/demo');
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [respondingId, setRespondingId] = useState(null);
    const [waitlistingId, setWaitlistingId] = useState(null);
    const [notes, setNotes] = useState('');
    const [toast, setToast] = useState(null);

    // Termination processing modal
    const [terminateModal, setTerminateModal] = useState(null); // { app, preview }
    const [terminatePreviewLoading, setTerminatePreviewLoading] = useState(false);
    const [terminateProcessing, setTerminateProcessing] = useState(false);
    const [terminateDeductionReason, setTerminateDeductionReason] = useState('');

    const showToast = useCallback((message, type = 'error') => {
        setToast({ message, type });
    }, []);

    const fetchApps = useCallback(async () => {
        try {
            setLoading(true);
            const data = await apiGet('/applications/my');
            setApplications(data.applications || []);
        } catch {
            setApplications([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchApps(); }, [fetchApps]);

    const handleRespond = async (id, status) => {
        try {
            setRespondingId(id);
            await apiPatch(`/applications/${id}/respond`, { status, managerNotes: notes });
            setNotes('');
            showToast(`Application ${status} successfully.`, 'success');
            fetchApps();
        } catch (err) {
            showToast(err.message);
        } finally {
            setRespondingId(null);
        }
    };

    const handleWaitlist = async (id) => {
        try {
            setWaitlistingId(id);
            await apiPatch(`/applications/${id}/waitlist`, {});
            showToast('Applicant has been added to the waitlist.', 'success');
            fetchApps();
        } catch (err) {
            showToast(err.message);
        } finally {
            setWaitlistingId(null);
        }
    };

    // Open termination process modal — fetch preview first
    const openTerminateModal = async (app) => {
        try {
            setTerminatePreviewLoading(true);
            const preview = await apiGet(`/applications/${app._id}/terminate/preview`);
            setTerminateModal({ app, preview });
            setTerminateDeductionReason('');
        } catch (err) {
            showToast('Failed to load termination preview: ' + err.message);
        } finally {
            setTerminatePreviewLoading(false);
        }
    };

    const handleProcessTermination = async () => {
        if (!terminateModal) return;
        try {
            setTerminateProcessing(true);
            await apiPost(`/applications/${terminateModal.app._id}/terminate/process`, {
                deductionReason: terminateDeductionReason,
            });
            showToast('Termination processed! Refund has been calculated and the property is now active.', 'success');
            setTerminateModal(null);
            fetchApps();
        } catch (err) {
            showToast('Failed to process termination: ' + err.message);
        } finally {
            setTerminateProcessing(false);
        }
    };

    const FILTERS = ['All', 'Pending', 'Approved', 'Rejected', 'Waitlisted', 'Terminated'];
    const filtered = applications.filter(app =>
        filter === 'All' ? true :
        filter === 'Waitlisted' ? app.status === 'waitlist' :
        app.status?.toLowerCase() === filter.toLowerCase()
    );

    const counts = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'pending').length,
        approved: applications.filter(a => a.status === 'approved').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
        waitlist: applications.filter(a => a.status === 'waitlist').length,
        terminated: applications.filter(a => a.status === 'terminated').length,
    };

    // Count termination requests needing action
    const terminationRequests = applications.filter(a => a.status === 'approved' && a.termination?.status === 'requested').length;

    return (
        <ManagerLayout
            breadcrumbs={[
                { label: 'Home', href: isDemo ? '/demo/manager' : '/manager/dashboard' },
                { label: 'Applications' },
            ]}
        >
            <Toast toast={toast} onDismiss={() => setToast(null)} />
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Tenant Applications</h1>
                    <p className="text-dark-500 text-sm">{counts.total} total · {counts.pending} pending{terminationRequests > 0 ? ` · ${terminationRequests} termination request(s)` : ''}</p>
                </div>
            </div>

            {/* Termination Requests Alert */}
            {terminationRequests > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-red-800 text-sm">Termination Request{terminationRequests > 1 ? 's' : ''} Pending</h3>
                        <p className="text-red-700 text-xs mt-0.5">{terminationRequests} tenant{terminationRequests > 1 ? 's have' : ' has'} requested early rental termination. Review and process below.</p>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 sm:gap-3 mb-3 shrink-0 hidden sm:grid">
                {[
                    { label: 'Total', value: counts.total, bg: 'bg-dark-50' },
                    { label: 'Pending', value: counts.pending, bg: 'bg-amber-50' },
                    { label: 'Approved', value: counts.approved, bg: 'bg-blue-50' },
                    { label: 'Rejected', value: counts.rejected, bg: 'bg-red-50' },
                    { label: 'Waitlisted', value: counts.waitlist, bg: 'bg-blue-50' },
                    { label: 'Terminated', value: counts.terminated, bg: 'bg-red-50' },
                ].map((s, i) => (
                    <div key={i} className={`${s.bg} rounded-xl p-2.5 border border-dark-100 shadow-sm flex flex-col justify-center`}>
                        <p className="text-lg font-black text-dark-900 leading-none mb-0.5">{s.value}</p>
                        <p className="text-dark-400 text-[10px] font-bold uppercase tracking-wider">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 mb-4 flex-wrap shrink-0">
                {FILTERS.map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${filter === f ? 'bg-dark-900 text-white' : 'bg-dark-100 text-dark-500 hover:bg-dark-200'}`}
                    >{f}</button>
                ))}
            </div>

            {/* Loading */}
            {loading && (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-dark-100 p-5 animate-pulse flex gap-4">
                            <div className="w-20 h-16 bg-dark-100 rounded-xl flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-dark-100 rounded w-1/3" />
                                <div className="h-4 bg-dark-100 rounded w-2/3" />
                                <div className="h-3 bg-dark-100 rounded w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty */}
            {!loading && filtered.length === 0 && (
                <div className="bg-white rounded-2xl border border-dark-100 p-12 text-center">
                    <div className="w-16 h-16 bg-dark-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-dark-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-dark-900 mb-2">No Applications</h3>
                    <p className="text-dark-400 text-sm">You haven't received any applications yet.</p>
                </div>
            )}

            {/* Applications List */}
            {!loading && filtered.length > 0 && (
                <div className="space-y-4">
                    {filtered.map(app => {
                        const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                        const prop = app.property || {};
                        const tenant = app.tenant || {};
                        const tenantName = `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || 'Tenant';
                        const imgUrl = prop.images?.[0]?.url || PLACEHOLDER;
                        const rent = prop.pricing?.monthlyRent || 0;
                        const appliedDate = app.createdAt
                            ? new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—';
                        const hasTerminationRequest = app.status === 'approved' && app.termination?.status === 'requested';

                        return (
                            <div key={app._id} className={`bg-white rounded-2xl border p-5 hover:shadow-md transition-shadow ${hasTerminationRequest ? 'border-red-200 ring-1 ring-red-100' : 'border-dark-100'}`}>
                                <div className="flex gap-4">
                                    {/* Property Thumbnail */}
                                    <div className="w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-dark-50">
                                        <img src={imgUrl} alt="" onError={e => { e.target.src = PLACEHOLDER; }} className="w-full h-full object-cover" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                                            <h3 className="font-bold text-dark-900 text-sm line-clamp-1">{prop.title || 'Property'}</h3>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 flex-shrink-0 ${config.color}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                                                {config.label}
                                            </span>
                                        </div>

                                        {/* Tenant info */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                                {tenantName.charAt(0)}
                                            </div>
                                            <span className="text-dark-600 text-xs font-medium">{tenantName}</span>
                                            <span className="text-dark-300 text-xs">·</span>
                                            <span className="text-dark-400 text-xs">{tenant.email}</span>
                                        </div>

                                        {/* Message */}
                                        {app.message && (
                                            <p className="text-dark-500 text-xs italic mb-2 line-clamp-2">"{app.message}"</p>
                                        )}

                                        {/* Verification Details */}
                                        {app.formDetails && Object.keys(app.formDetails).length > 0 && (
                                            <div className="mt-2 mb-3 bg-dark-25 rounded-lg p-3 border border-dark-100 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-dark-500">
                                                {Object.entries(app.formDetails).filter(([_,v]) => v).map(([k, v]) => (
                                                    <span key={k} className="flex items-center gap-1.5 shrink-0 bg-white px-2 py-1 rounded shadow-sm border border-dark-100">
                                                        <span className="font-bold text-dark-800 uppercase tracking-widest text-[8px]">{k.replace(/([A-Z])/g, ' $1').trim()}</span> 
                                                        <span className="text-dark-900 font-semibold">{typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 text-xs mt-3">
                                            <span className="text-dark-800 font-bold">₹{rent.toLocaleString()}<span className="text-dark-400 font-normal">/mo</span></span>
                                            <span className="text-dark-400">Applied {appliedDate}</span>
                                            {app.moveInDate && (
                                                <span className="text-dark-400">Move-in: {new Date(app.moveInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions for pending */}
                                {app.status === 'pending' && (
                                    <div className="mt-4 pt-4 border-t border-dark-100 flex flex-col gap-3">
                                        {(prop.status === 'awaiting_payment' || prop.status === 'rented') && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[11px] text-blue-800 flex items-start gap-2">
                                                <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                <span><strong className="font-bold">Property Occupied/Awaiting:</strong> You cannot approve this applicant yet. Add them to the waitlist and approve later if the current tenant fails to pay.</span>
                                            </div>
                                        )}
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                            <input
                                                type="text"
                                                placeholder="Add a note (optional)..."
                                                value={respondingId === app._id ? notes : ''}
                                                onFocus={() => setRespondingId(app._id)}
                                                onChange={e => setNotes(e.target.value)}
                                                className="flex-1 px-3 py-2 border border-dark-200 rounded-lg text-xs outline-none focus:border-primary-400 bg-dark-50"
                                            />
                                            <div className="flex gap-2">
                                                {(prop.status === 'awaiting_payment' || prop.status === 'rented') ? (
                                                    <button
                                                        onClick={() => handleWaitlist(app._id)}
                                                        disabled={waitlistingId === app._id}
                                                        className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        {waitlistingId === app._id ? 'Adding...' : 'Add to Waitlist'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleRespond(app._id, 'approved')}
                                                        disabled={respondingId === app._id}
                                                        className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                        Approve
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleRespond(app._id, 'rejected')}
                                                    className="px-5 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-all flex items-center gap-1.5"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Waitlist badge */}
                                {app.status === 'waitlist' && (
                                    <div className="mt-3 pt-3 border-t border-dark-100 flex items-center gap-2">
                                        <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-blue-200">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            ON WAITLIST — Pending primary tenant payment
                                        </span>
                                        <button
                                            onClick={() => handleRespond(app._id, 'approved')}
                                            className="ml-auto px-4 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                            Promote & Approve
                                        </button>
                                    </div>
                                )}

                                {/* Invoice sent badge + termination actions for approved */}
                                {app.status === 'approved' && (
                                    <div className="mt-3 pt-3 border-t border-dark-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-blue-200">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                INVOICE SENT TO TENANT
                                            </span>
                                        </div>

                                        {/* ── Termination Request Banner ── */}
                                        {hasTerminationRequest && (
                                            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4">
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-bold text-red-800">Termination Requested by {app.termination?.requestedBy === 'tenant' ? 'Tenant' : 'Manager'}</h4>
                                                        <p className="text-[11px] text-red-600 mt-0.5">
                                                            Requested on {app.termination?.requestedAt ? new Date(app.termination.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                                        </p>
                                                        {app.termination?.reason && (
                                                            <p className="text-xs text-dark-600 mt-1.5 italic bg-white/70 rounded-lg px-3 py-2 border border-red-100">
                                                                "{app.termination.reason}"
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => openTerminateModal(app)}
                                                    disabled={terminatePreviewLoading}
                                                    className="w-full py-2.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {terminatePreviewLoading ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            Loading...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Review & Process Termination
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Terminated application details ── */}
                                {app.status === 'terminated' && app.termination && (
                                    <div className="mt-3 pt-3 border-t border-dark-100">
                                        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                                            <h4 className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1.5">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                                Rental Terminated
                                            </h4>
                                            <div className="space-y-1.5 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-dark-500">Terminated On</span>
                                                    <span className="text-dark-900 font-medium">{app.termination.processedAt ? new Date(app.termination.processedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-dark-500">Stayed Duration</span>
                                                    <span className="text-dark-900 font-medium">{app.termination.stayedDuration != null ? `${Math.floor(app.termination.stayedDuration / 30)} months, ${app.termination.stayedDuration % 30} days` : '—'}</span>
                                                </div>
                                                {app.termination.deductionAmount > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-dark-500">Deduction</span>
                                                        <span className="text-red-600 font-bold">-₹{(app.termination.deductionAmount || 0).toLocaleString()}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="text-dark-500">Refund</span>
                                                    <span className="text-blue-700 font-bold">₹{(app.termination.refundAmount || 0).toLocaleString()}</span>
                                                </div>
                                                {app.termination.deductionReason && (
                                                    <div className="pt-1.5 border-t border-red-200">
                                                        <span className="text-dark-500">Note:</span>
                                                        <p className="text-dark-700 font-medium mt-0.5">{app.termination.deductionReason}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ══════ Termination Process Modal ══════ */}
            {terminateModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => !terminateProcessing && setTerminateModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-scale-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <button onClick={() => !terminateProcessing && setTerminateModal(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-dark-100 hover:bg-dark-200 flex items-center justify-center transition-colors">
                            <svg className="w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl flex items-center justify-center border border-red-100">
                                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-dark-900">Process Termination</h3>
                                <p className="text-dark-400 text-xs">{terminateModal.app.property?.title || 'Property'} — {`${terminateModal.app.tenant?.firstName || ''} ${terminateModal.app.tenant?.lastName || ''}`.trim()}</p>
                            </div>
                        </div>

                        {/* Tenant's reason */}
                        {terminateModal.preview?.reason && (
                            <div className="mb-4 p-3 bg-dark-50 rounded-xl border border-dark-100">
                                <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mb-1">Tenant's Reason</p>
                                <p className="text-dark-700 text-sm italic">"{terminateModal.preview.reason}"</p>
                            </div>
                        )}

                        {/* Auto-calculated breakdown */}
                        <div className="bg-dark-50 rounded-xl p-4 mb-4 border border-dark-100">
                            <h4 className="text-xs font-bold text-dark-900 mb-3 flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                Auto-Calculated Breakdown
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-dark-500">Move-in Date</span>
                                    <span className="text-dark-900 font-medium">
                                        {terminateModal.preview?.moveInDate 
                                            ? new Date(terminateModal.preview.moveInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                            : 'Not set'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-500">Days Stayed</span>
                                    <span className="text-dark-900 font-bold">{terminateModal.preview?.stayedDuration || 0} days</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-500">Full Months Stayed</span>
                                    <span className="text-dark-900 font-medium">{terminateModal.preview?.fullMonthsStayed || 0} month(s)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-500">Extra Days</span>
                                    <span className="text-dark-900 font-medium">{terminateModal.preview?.extraDays || 0} day(s)</span>
                                </div>
                                <div className="border-t border-dark-200 my-2" />
                                <div className="flex justify-between">
                                    <span className="text-dark-500">Monthly Rent</span>
                                    <span className="text-dark-900 font-medium">₹{(terminateModal.preview?.monthlyRent || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-500">Daily Rent Rate</span>
                                    <span className="text-dark-900 font-medium">₹{(terminateModal.preview?.dailyRent || 0).toLocaleString()}/day</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-500">Security Deposit</span>
                                    <span className="text-dark-900 font-bold">₹{(terminateModal.preview?.securityDeposit || 0).toLocaleString()}</span>
                                </div>
                                <div className="border-t border-dark-200 my-2" />
                                <div className="flex justify-between">
                                    <span className="text-red-600 font-semibold">Pro-rata Deduction ({terminateModal.preview?.extraDays || 0} days × ₹{terminateModal.preview?.dailyRent || 0})</span>
                                    <span className="text-red-600 font-bold">-₹{(terminateModal.preview?.autoDeduction || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between bg-blue-50 rounded-lg p-2.5 -mx-1 border border-blue-200">
                                    <span className="text-blue-800 font-bold">Refund to Tenant</span>
                                    <span className="text-blue-700 font-black text-base">₹{(terminateModal.preview?.autoRefund || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Optional note */}
                        <div className="mb-5">
                            <label className="block text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-1.5">Additional Notes (optional)</label>
                            <textarea
                                value={terminateDeductionReason}
                                onChange={e => setTerminateDeductionReason(e.target.value)}
                                placeholder="Any additional notes about this termination..."
                                rows={2}
                                className="w-full px-3 py-2.5 border border-dark-200 rounded-xl text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 resize-none bg-dark-50"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setTerminateModal(null)}
                                disabled={terminateProcessing}
                                className="flex-1 py-2.5 text-sm font-medium text-dark-500 bg-dark-50 rounded-xl hover:bg-dark-100 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProcessTermination}
                                disabled={terminateProcessing}
                                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {terminateProcessing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Confirm & Terminate
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ManagerLayout>
    );
}
