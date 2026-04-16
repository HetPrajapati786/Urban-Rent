/**
 * AccountDeletedModal - Shown when a user's account has been permanently deleted.
 * There is no recovery option. The user MUST sign out.
 * Auto-signs out after a countdown.
 */
import { useState, useEffect } from 'react';

export default function AccountDeletedModal({ reason, onSignOut }) {
    const [countdown, setCountdown] = useState(15);

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onSignOut();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [onSignOut]);

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" style={{ animation: 'fadeIn 0.3s ease forwards' }}>
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                style={{ animation: 'scaleIn 0.3s ease forwards' }}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-dark-800 to-dark-900 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">Account Permanently Removed</h2>
                            <p className="text-dark-300 text-sm font-medium">Your access has been permanently revoked</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                        <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">Reason</p>
                        <p className="text-sm text-red-700 font-medium leading-relaxed">
                            {reason || 'Your account has been permanently removed by the administrator.'}
                        </p>
                    </div>

                    <div className="bg-dark-50 border border-dark-200 rounded-xl p-4 mb-5">
                        <p className="text-xs font-bold text-dark-500 uppercase tracking-wider mb-2">What This Means</p>
                        <ul className="text-sm text-dark-600 space-y-1.5 font-medium">
                            <li className="flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-dark-400 mt-2 flex-shrink-0"></span>
                                Your account has been permanently deleted and cannot be recovered
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-dark-400 mt-2 flex-shrink-0"></span>
                                All future login attempts will be blocked
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-dark-400 mt-2 flex-shrink-0"></span>
                                Any active tenancies have been issued a 7-day vacate notice
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-dark-400 mt-2 flex-shrink-0"></span>
                                If you believe this was done in error, contact Urban Rent support directly
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={onSignOut}
                        className="w-full py-3 bg-dark-900 text-white rounded-xl text-sm font-bold hover:bg-dark-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out Now
                    </button>

                    <p className="text-center text-[10px] text-dark-400 mt-3 font-medium">
                        You will be automatically signed out in {countdown} seconds
                    </p>
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
