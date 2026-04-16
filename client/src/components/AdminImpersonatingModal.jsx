/**
 * AdminImpersonatingModal - Shown to users when an admin initiates an impersonation
 * session on their account. Informs the user and forces sign-out.
 * Auto-signs out after a countdown.
 */
import { useState, useEffect } from 'react';

export default function AdminImpersonatingModal({ adminName, reason, onSignOut }) {
    const [countdown, setCountdown] = useState(10);

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
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">Admin Session Active</h2>
                            <p className="text-indigo-100 text-sm font-medium">Secure account review in progress</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
                        <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">Session Information</p>
                        <p className="text-sm text-indigo-700 font-medium leading-relaxed">
                            {reason || `The platform administrator${adminName ? ` (${adminName})` : ''} has initiated a secure session review of your account.`}
                        </p>
                    </div>

                    <div className="bg-dark-50 border border-dark-200 rounded-xl p-4 mb-5">
                        <p className="text-xs font-bold text-dark-500 uppercase tracking-wider mb-2">What Is Happening</p>
                        <ul className="text-sm text-dark-600 space-y-1.5 font-medium">
                            <li className="flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></span>
                                An administrator is currently logged into your account for review purposes
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></span>
                                Your current session is being ended for security reasons
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></span>
                                You can log back in once the admin session has ended
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></span>
                                This is a standard platform audit procedure -- no action is required from you
                            </li>
                        </ul>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                        <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                If you did not expect this and have concerns about unauthorized access, please contact Urban Rent support immediately after logging back in.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onSignOut}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>

                    <p className="text-center text-[10px] text-dark-400 mt-3 font-medium">
                        Your session will automatically end in {countdown} seconds
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
