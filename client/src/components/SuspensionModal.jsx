import { useState } from 'react';

/**
 * SuspensionModal - Shown to users whose accounts have been suspended.
 * Provides suspension details and a reactivation request form (Help & Support).
 * Cannot be dismissed - user must either request reactivation or sign out.
 * 
 * Uses direct fetch with clerkId instead of apiPost because
 * the global Clerk object may not be available via window.Clerk
 * and the auth middleware blocks suspended users anyway.
 */
export default function SuspensionModal({ reason, suspendedAt, reactivationRequests, onRequestSubmitted, onSignOut, clerkId }) {
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [requestMessage, setRequestMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const hasPendingRequest = (reactivationRequests || []).some(r => r.status === 'pending');
    const lastRequest = (reactivationRequests || []).sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))[0];

    const handleSubmitRequest = async () => {
        if (!requestMessage.trim() || requestMessage.trim().length < 10) {
            setSubmitError('Please provide a detailed message (at least 10 characters).');
            return;
        }

        if (!clerkId) {
            setSubmitError('Unable to identify your account. Please sign out and try again.');
            return;
        }

        setSubmitting(true);
        setSubmitError('');

        try {
            const res = await fetch('http://localhost:5000/api/users/reactivation-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-clerk-user-id': clerkId,
                },
                body: JSON.stringify({ message: requestMessage.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Request failed');
            }

            setSubmitSuccess(true);
            setRequestMessage('');
            if (onRequestSubmitted) onRequestSubmitted();
        } catch (err) {
            setSubmitError(err.message || 'Failed to submit request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4" style={{ animation: 'fadeIn 0.3s ease forwards' }}>
            <div 
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" 
                style={{ animation: 'scaleIn 0.3s ease forwards' }}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">Account Suspended</h2>
                            <p className="text-red-100 text-sm font-medium">Your access has been restricted</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
                    {/* Reason */}
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                        <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">Reason for Suspension</p>
                        <p className="text-sm text-red-700 font-medium leading-relaxed">
                            {reason || 'Your account has been suspended by the administrator.'}
                        </p>
                    </div>

                    {/* Suspension date */}
                    {suspendedAt && (
                        <div className="flex items-center gap-2 text-xs text-dark-400 mb-4">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">
                                Suspended on {new Date(suspendedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    )}

                    {/* Impact notice */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Important Notice</p>
                        <ul className="text-sm text-amber-700 space-y-1.5 font-medium">
                            <li className="flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-amber-500 mt-2 flex-shrink-0"></span>
                                Your properties will be made available to other users after 7 days
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-amber-500 mt-2 flex-shrink-0"></span>
                                Active tenants have been issued a 7-day vacate notice
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-amber-500 mt-2 flex-shrink-0"></span>
                                Non-compliance with the vacate notice may result in legal action
                            </li>
                        </ul>
                    </div>

                    {/* Reactivation Request Section */}
                    {hasPendingRequest || submitSuccess ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm font-bold text-blue-800">Reactivation Request Pending</p>
                            </div>
                            <p className="text-xs text-blue-700 font-medium">
                                Your reactivation request has been submitted and is awaiting administrator review. You will be notified once a decision has been made.
                            </p>
                            {lastRequest && lastRequest.status === 'pending' && (
                                <p className="text-[10px] text-blue-500 mt-2 font-medium">
                                    Submitted on {new Date(lastRequest.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            )}
                        </div>
                    ) : lastRequest && lastRequest.status === 'rejected' ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                            <p className="text-sm font-bold text-red-800 mb-1">Previous Request Denied</p>
                            <p className="text-xs text-red-700 font-medium">
                                {lastRequest.adminResponse || 'Your previous reactivation request was denied by the administrator.'}
                            </p>
                            <button 
                                onClick={() => setShowRequestForm(true)}
                                className="mt-3 text-xs font-bold text-red-700 underline hover:text-red-900 transition-colors"
                            >
                                Submit a new request
                            </button>
                        </div>
                    ) : !showRequestForm ? (
                        <button
                            onClick={() => setShowRequestForm(true)}
                            className="w-full py-3 bg-dark-900 text-white rounded-xl text-sm font-bold hover:bg-dark-800 transition-colors mb-3 flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Request Account Reactivation (Help & Support)
                        </button>
                    ) : null}

                    {/* Request Form */}
                    {showRequestForm && !hasPendingRequest && !submitSuccess && (
                        <div className="border border-dark-200 rounded-xl p-4 mb-4 bg-dark-50">
                            <h4 className="text-sm font-bold text-dark-900 mb-2">Help & Support - Reactivation Request</h4>
                            <p className="text-xs text-dark-500 mb-3 font-medium">
                                Explain why your account should be reactivated. Include any relevant details that may help the administrator make a decision.
                            </p>
                            <textarea
                                value={requestMessage}
                                onChange={(e) => setRequestMessage(e.target.value)}
                                placeholder="Provide a detailed explanation for your reactivation request..."
                                rows={4}
                                maxLength={500}
                                className="w-full px-3 py-2 bg-white border border-dark-200 rounded-lg text-sm text-dark-900 placeholder-dark-400 outline-none focus:border-dark-400 focus:ring-1 focus:ring-dark-400 resize-none font-medium"
                            />
                            <p className="text-[10px] text-dark-400 mt-1 font-medium">{requestMessage.length}/500 characters (minimum 10)</p>

                            {submitError && (
                                <div className="mt-2 p-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-200">
                                    {submitError}
                                </div>
                            )}

                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={() => { setShowRequestForm(false); setSubmitError(''); }}
                                    disabled={submitting}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-dark-600 bg-white border border-dark-200 hover:bg-dark-50 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitRequest}
                                    disabled={submitting || requestMessage.trim().length < 10}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-dark-900 hover:bg-dark-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : 'Submit Request'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Sign Out */}
                    <button
                        onClick={onSignOut}
                        className="w-full py-2.5 text-sm font-bold text-dark-500 hover:text-dark-700 transition-colors border border-dark-200 rounded-xl hover:bg-dark-50"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
