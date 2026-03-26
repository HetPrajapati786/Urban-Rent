import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';
import { apiGet, apiPost } from '../../utils/api';
import { useUser } from '@clerk/clerk-react';

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    approved: { label: 'Approved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
    withdrawn: { label: 'Withdrawn', color: 'bg-dark-50 text-dark-500 border-dark-200', dot: 'bg-dark-400' },
    waitlist: { label: 'Waitlisted', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    terminated: { label: 'Terminated', color: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' },
};

const INVOICE_BADGE = {
    pending: { label: 'Awaiting Payment', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    paid: { label: 'Paid', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    overdue: { label: 'Overdue', color: 'bg-red-50 text-red-700 border-red-200' },
    void: { label: 'Void', color: 'bg-dark-50 text-dark-400 border-dark-200' },
};

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const scriptId = 'razorpay-checkout-js';
        if (document.getElementById(scriptId)) {
            return resolve(true);
        }
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&h=150&fit=crop';

/* ── Confirmation Modal Component ── */
function ConfirmModal({ open, title, message, icon, iconBg, confirmLabel, confirmClass, onConfirm, onCancel, loading }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onCancel}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${iconBg || 'bg-red-50'}`}>
                        {icon}
                    </div>
                    <h3 className="text-lg font-bold text-dark-900 mb-2">{title}</h3>
                    <p className="text-dark-500 text-sm mb-6 leading-relaxed">{message}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 py-2.5 text-sm font-medium text-dark-500 bg-dark-50 rounded-xl hover:bg-dark-100 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${confirmClass || 'bg-red-600 text-white hover:bg-red-700'}`}
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Toast Notification ── */
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
            isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isError ? 'bg-red-100' : 'bg-emerald-100'}`}>
                {isError
                    ? <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    : <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                }
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{isError ? 'Error' : 'Success'}</p>
                <p className="text-xs mt-0.5 leading-snug opacity-80">{toast.message}</p>
            </div>
            <button onClick={onDismiss} className="opacity-50 hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    );
}

export default function TenantApplications() {
    const location = useLocation();
    const isDemo = location.pathname.startsWith('/demo');
    const { user } = useUser();

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [payingId, setPayingId] = useState(null);
    const [payModal, setPayModal] = useState(null);
    const [payLoading, setPayLoading] = useState(false);
    const [decliningId, setDecliningId] = useState(null);
    const [toast, setToast] = useState(null);

    // Decline confirmation modal state
    const [declineModal, setDeclineModal] = useState(null); // { invoiceId }

    // Termination request modal state
    const [terminateModal, setTerminateModal] = useState(null); // { applicationId, propertyTitle }
    const [terminateReason, setTerminateReason] = useState('');
    const [terminateLoading, setTerminateLoading] = useState(false);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
    }, []);

    const fetchApplications = useCallback(async () => {
        try {
            setLoading(true);
            const data = await apiGet('/applications/my');
            setApplications(data.applications || data || []);
        } catch {
            setApplications([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchApplications(); }, [fetchApplications]);

    const handlePay = async (invoiceId) => {
        if (!payModal) return;
        setPayLoading(true);
        try {
            // 1. Create order on the server
            const orderOptions = {
                amount: payModal.totalAmount,
                receipt: invoiceId,
            };
            const orderRes = await apiPost('/payments/razorpay/order', orderOptions);
            const { id: order_id } = orderRes;

            const res = await loadRazorpayScript();
            if (!res) {
                showToast('Razorpay SDK failed to load. Are you offline or using an adblocker?', 'error');
                setPayLoading(false);
                return;
            }

            // 2. Initialize Razorpay popup
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXXXXXXXXXX',
                amount: orderRes.amount,
                currency: orderRes.currency,
                name: 'UrbanRent',
                description: `Payment for Invoice ${invoiceId}`,
                order_id: order_id,
                handler: async function (response) {
                    try {
                        await apiPost(`/invoices/${invoiceId}/pay`, {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        showToast('Payment completed successfully!', 'success');
                        setPayModal(null);
                        fetchApplications();
                    } catch (err) {
                        showToast('Payment verification failed: ' + err.message, 'error');
                    }
                },
                prefill: {
                    name: user?.firstName || 'Tenant',
                    email: user?.email || '',
                },
                theme: {
                    color: '#059669',
                },
                modal: {
                    ondismiss: function() {
                        setPayLoading(false);
                    }
                }
            };
            const rzp = new window.Razorpay(options);
            
            rzp.on('payment.failed', function (response){
                showToast('Payment failed. ' + response.error.description, 'error');
                setPayLoading(false);
            });

            rzp.open();

        } catch (err) {
            showToast('Payment initialization failed: ' + err.message, 'error');
            setPayLoading(false);
        }
    };

    const handleDeclineInvoice = async () => {
        if (!declineModal) return;
        try {
            setDecliningId(declineModal.invoiceId);
            await apiPost(`/invoices/${declineModal.invoiceId}/decline`);
            showToast('Invoice declined successfully. Your spot has been released.', 'success');
            setDeclineModal(null);
            fetchApplications();
        } catch (err) {
            showToast('Failed to decline: ' + err.message, 'error');
        } finally {
            setDecliningId(null);
        }
    };

    const handleRequestTermination = async () => {
        if (!terminateModal) return;
        try {
            setTerminateLoading(true);
            await apiPost(`/applications/${terminateModal.applicationId}/terminate/request`, {
                reason: terminateReason,
            });
            showToast('Termination request submitted! The manager will review and process your request.', 'success');
            setTerminateModal(null);
            setTerminateReason('');
            fetchApplications();
        } catch (err) {
            showToast('Failed to submit termination request: ' + err.message, 'error');
        } finally {
            setTerminateLoading(false);
        }
    };

    const FILTERS = ['All', 'Pending', 'Approved', 'Rejected', 'Terminated'];
    const filtered = applications.filter(app =>
        filter === 'All' ? true : app.status?.toLowerCase() === filter.toLowerCase()
    );

    const summary = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'pending').length,
        approved: applications.filter(a => a.status === 'approved').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
    };

    return (
        <TenantLayout
            breadcrumbs={[
                { label: 'Home', href: isDemo ? '/demo/tenant' : '/tenant/dashboard' },
                { label: 'Applications' },
            ]}
        >
            <Toast toast={toast} onDismiss={() => setToast(null)} />

            {/* Page Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">My Applications</h1>
                    <p className="text-dark-500 text-sm">{summary.total} total applications</p>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total', value: summary.total, color: 'text-dark-900', bg: 'bg-dark-50' },
                    { label: 'Pending', value: summary.pending, color: 'text-amber-700', bg: 'bg-amber-50' },
                    { label: 'Approved', value: summary.approved, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                    { label: 'Rejected', value: summary.rejected, color: 'text-red-700', bg: 'bg-red-50' },
                ].map((s, i) => (
                    <div key={i} className={`${s.bg} rounded-xl p-4 border border-dark-100`}>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-dark-400 text-xs font-medium mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 mb-6">
                {FILTERS.map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${filter === f ? 'bg-dark-900 text-white' : 'bg-dark-100 text-dark-500 hover:bg-dark-200'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loading && (
                <div className="space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-dark-100 p-4 animate-pulse flex gap-4">
                            <div className="w-24 h-20 bg-dark-100 rounded-xl flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-dark-100 rounded w-1/3" />
                                <div className="h-4 bg-dark-100 rounded w-2/3" />
                                <div className="h-3 bg-dark-100 rounded w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && filtered.length === 0 && (
                <div className="bg-white rounded-2xl border border-dark-100 p-12 text-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-dark-900 mb-2">No Applications Yet</h3>
                    <p className="text-dark-400 text-sm max-w-xs mx-auto mb-6">
                        Find a property you love and submit your first application.
                    </p>
                    <Link
                        to={isDemo ? '/demo/tenant/properties' : '/tenant/properties'}
                        className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
                    >
                        Browse Properties
                    </Link>
                </div>
            )}

            {/* Applications List */}
            {!loading && filtered.length > 0 && (
                <div className="space-y-4">
                    {filtered.map(app => {
                        const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                        const prop = app.property || {};
                        const imgUrl = prop.images?.[0]?.url || PLACEHOLDER_IMAGE;
                        const loc = [prop.location?.area, prop.location?.city].filter(Boolean).join(', ');
                        const rent = prop.pricing?.monthlyRent || 0;
                        const appliedDate = app.createdAt
                            ? new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—';
                        const invoice = app.invoice;
                        const hasActivePaidRental = app.status === 'approved' && invoice?.status === 'paid';
                        const hasTerminationPending = app.termination?.status === 'requested';

                        return (
                            <div key={app._id} className="bg-white rounded-2xl border border-dark-100 p-4 hover:shadow-md transition-shadow">
                                <div className="flex gap-4">
                                    {/* Property Thumbnail */}
                                    <div className="w-24 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-dark-50">
                                        <img
                                            src={imgUrl}
                                            alt={prop.title}
                                            onError={e => { e.target.src = PLACEHOLDER_IMAGE; }}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 flex-wrap">
                                            <Link to={`${isDemo ? '/demo/tenant' : '/tenant'}/properties/${prop._id}`} className="block">
                                                <h3 className="font-bold text-dark-900 text-sm leading-snug line-clamp-1 hover:text-primary-600 transition-colors">
                                                    {prop.title || 'Property'}
                                                </h3>
                                            </Link>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 flex-shrink-0 ${config.color}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                                                {config.label}
                                            </span>
                                        </div>

                                        {loc && (
                                            <p className="text-dark-400 text-xs mt-1 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                                </svg>
                                                {loc}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-4 mt-2">
                                            {rent > 0 && (
                                                <p className="text-dark-800 font-bold text-sm">
                                                    ₹{rent.toLocaleString()}<span className="text-dark-400 font-normal text-xs">/mo</span>
                                                </p>
                                            )}
                                            <p className="text-dark-400 text-xs">Applied on {appliedDate}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Invoice section for approved applications */}
                                {app.status === 'approved' && invoice && (
                                    <div className="mt-4 pt-4 border-t border-dark-100">
                                        <div className="bg-dark-50 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-xs font-bold text-dark-900 flex items-center gap-1.5">
                                                    <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                    Invoice
                                                </h4>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${INVOICE_BADGE[invoice.status]?.color || INVOICE_BADGE.pending.color}`}>
                                                    {INVOICE_BADGE[invoice.status]?.label || invoice.status}
                                                </span>
                                            </div>

                                            {/* Breakdown */}
                                            <div className="space-y-1.5 text-xs mb-3">
                                                <div className="flex justify-between">
                                                    <span className="text-dark-500">Monthly Rent</span>
                                                    <span className="text-dark-900 font-medium">₹{(invoice.rent || 0).toLocaleString()}</span>
                                                </div>
                                                {invoice.securityDeposit > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-dark-500">Security Deposit</span>
                                                        <span className="text-dark-900 font-medium">₹{invoice.securityDeposit.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                {invoice.maintenanceCharges > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-dark-500">Maintenance</span>
                                                        <span className="text-dark-900 font-medium">₹{invoice.maintenanceCharges.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between pt-1.5 border-t border-dark-200 font-bold">
                                                    <span className="text-dark-900">Total</span>
                                                    <span className="text-dark-900">₹{(invoice.totalAmount || 0).toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <p className="text-dark-400 text-[10px]">
                                                    Due by {new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>

                                                {invoice.status === 'pending' && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setPayModal(invoice)}
                                                            className="px-5 py-2 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 transition-all shadow-md shadow-primary-600/20 flex items-center gap-1.5"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                                            Pay Now
                                                        </button>
                                                        <button
                                                            onClick={() => setDeclineModal({ invoiceId: invoice._id })}
                                                            disabled={decliningId === invoice._id}
                                                            className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50"
                                                        >
                                                            {decliningId === invoice._id ? '...' : 'Decline'}
                                                        </button>
                                                    </div>
                                                )}

                                                {invoice.status === 'paid' && (
                                                    <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                        Paid
                                                    </span>
                                                )}

                                                {invoice.status === 'overdue' && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setPayModal(invoice)}
                                                            className="px-5 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all flex items-center gap-1.5"
                                                        >
                                                            Pay Now (Overdue!)
                                                        </button>
                                                        <button
                                                            onClick={() => setDeclineModal({ invoiceId: invoice._id })}
                                                            disabled={decliningId === invoice._id}
                                                            className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50"
                                                        >
                                                            {decliningId === invoice._id ? '...' : 'Decline'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* ── Termination Request Button for Active Rentals (paid invoice) ── */}
                                        {hasActivePaidRental && !hasTerminationPending && (
                                            <div className="mt-3">
                                                <button
                                                    onClick={() => setTerminateModal({ applicationId: app._id, propertyTitle: prop.title || 'Property' })}
                                                    className="w-full py-2.5 bg-gradient-to-r from-red-50 to-orange-50 text-red-600 text-xs font-bold rounded-xl border border-red-200 hover:from-red-100 hover:to-orange-100 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                    </svg>
                                                    Request Early Termination
                                                </button>
                                            </div>
                                        )}

                                        {/* Termination requested badge */}
                                        {hasTerminationPending && (
                                            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                                                <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="text-amber-800 text-[11px] leading-tight">
                                                    <strong className="font-bold">Termination Requested</strong>
                                                    <br />
                                                    Your termination request is pending manager review. The refund will be calculated based on your stay duration.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Termination details for terminated applications */}
                                {app.status === 'terminated' && app.termination && (
                                    <div className="mt-4 pt-4 border-t border-dark-100">
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
                                                    <span className="text-dark-900 font-medium">{app.termination.stayedDuration ? `${Math.floor(app.termination.stayedDuration / 30)} months, ${app.termination.stayedDuration % 30} days` : '—'}</span>
                                                </div>
                                                {app.termination.deductionAmount > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-dark-500">Deduction (pro-rata rent)</span>
                                                        <span className="text-red-600 font-bold">-₹{(app.termination.deductionAmount || 0).toLocaleString()}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="text-dark-500">Refund Amount</span>
                                                    <span className="text-emerald-700 font-bold">₹{(app.termination.refundAmount || 0).toLocaleString()}</span>
                                                </div>
                                                {app.termination.deductionReason && (
                                                    <div className="pt-1.5 border-t border-red-200">
                                                        <span className="text-dark-500">Deduction Reason:</span>
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

            {/* ══════ Payment Modal ══════ */}
            {payModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => !payLoading && setPayModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-dark-900">Complete Payment</h3>
                                <p className="text-dark-400 text-xs">Verify the amount before paying securely with Razorpay.</p>
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="bg-dark-50 rounded-xl p-4 mb-5">
                            <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-dark-500">Rent</span>
                                    <span className="text-dark-900">₹{(payModal.rent || 0).toLocaleString()}</span>
                                </div>
                                {payModal.securityDeposit > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-dark-500">Security Deposit</span>
                                        <span className="text-dark-900">₹{payModal.securityDeposit.toLocaleString()}</span>
                                    </div>
                                )}
                                {payModal.maintenanceCharges > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-dark-500">Maintenance</span>
                                        <span className="text-dark-900">₹{payModal.maintenanceCharges.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t border-dark-200 font-bold text-base">
                                    <span>Total</span>
                                    <span className="text-primary-600">₹{(payModal.totalAmount || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setPayModal(null)}
                                disabled={payLoading}
                                className="flex-1 py-2.5 text-sm font-medium text-dark-500 bg-dark-50 rounded-xl hover:bg-dark-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handlePay(payModal._id)}
                                disabled={payLoading}
                                className="flex-1 py-2.5 text-sm font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {payLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Pay ₹{(payModal.totalAmount || 0).toLocaleString()}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════ Decline Invoice Confirmation Modal ══════ */}
            <ConfirmModal
                open={!!declineModal}
                title="Decline Invoice?"
                message="Are you sure you want to decline this invoice? You will lose your reserved spot and the property will become available to other applicants."
                icon={
                    <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                }
                iconBg="bg-red-50"
                confirmLabel="Yes, Decline"
                confirmClass="bg-red-600 text-white hover:bg-red-700"
                onConfirm={handleDeclineInvoice}
                onCancel={() => setDeclineModal(null)}
                loading={!!decliningId}
            />

            {/* ══════ Termination Request Modal ══════ */}
            {terminateModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => !terminateLoading && setTerminateModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
                        <button onClick={() => !terminateLoading && setTerminateModal(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-dark-100 hover:bg-dark-200 flex items-center justify-center transition-colors">
                            <svg className="w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="flex flex-col items-center text-center mb-5">
                            <div className="w-14 h-14 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl flex items-center justify-center mb-4 border border-red-100">
                                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-dark-900">Request Early Termination</h3>
                            <p className="text-dark-400 text-xs mt-1">
                                {terminateModal.propertyTitle}
                            </p>
                        </div>

                        {/* Info box */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-[11px] text-amber-800 flex items-start gap-2">
                            <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <strong className="font-bold">How it works:</strong>
                                <ul className="mt-1 space-y-0.5 list-disc list-inside">
                                    <li>Your request will be sent to the property manager</li>
                                    <li>Refund is auto-calculated based on days stayed</li>
                                    <li>Pro-rata rent for extra days is deducted from your security deposit</li>
                                    <li>The remaining amount will be refunded to you</li>
                                </ul>
                            </div>
                        </div>

                        {/* Reason */}
                        <div className="mb-5">
                            <label className="block text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-1.5">Reason for Termination (optional)</label>
                            <textarea
                                value={terminateReason}
                                onChange={e => setTerminateReason(e.target.value)}
                                placeholder="e.g. Relocating to another city, found a better place..."
                                rows={3}
                                className="w-full px-3 py-2.5 border border-dark-200 rounded-xl text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 resize-none bg-dark-50"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setTerminateModal(null); setTerminateReason(''); }}
                                disabled={terminateLoading}
                                className="flex-1 py-2.5 text-sm font-medium text-dark-500 bg-dark-50 rounded-xl hover:bg-dark-100 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRequestTermination}
                                disabled={terminateLoading}
                                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {terminateLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                        Submit Request
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </TenantLayout>
    );
}
