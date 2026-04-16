import { useState } from 'react';

/**
 * PropertyVacateNoticeModal - Shown to tenants when the property they are renting
 * has a 7-day vacate notice due to owner suspension/deletion.
 * Must be acknowledged by the tenant.
 */
export default function PropertyVacateNoticeModal({ propertyTitle, vacateBy, noticeType, onAcknowledge }) {
    const [acknowledged, setAcknowledged] = useState(false);

    const vacateDate = new Date(vacateBy);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((vacateDate - now) / (1000 * 60 * 60 * 24)));

    return (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4" style={{ animation: 'fadeIn 0.3s ease forwards' }}>
            <div 
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" 
                style={{ animation: 'scaleIn 0.3s ease forwards' }}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">Property Vacate Notice</h2>
                            <p className="text-amber-100 text-sm font-medium">7-Day Notice Period</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                    {/* Property info */}
                    <div className="bg-dark-50 border border-dark-200 rounded-xl p-4 mb-4">
                        <p className="text-xs font-bold text-dark-500 uppercase tracking-wider mb-1">Affected Property</p>
                        <p className="text-base font-bold text-dark-900">{propertyTitle}</p>
                    </div>

                    {/* Notice details */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Notice Details</p>
                        <p className="text-sm text-amber-700 font-medium leading-relaxed mb-3">
                            {noticeType === 'deletion' 
                                ? 'The property owner\'s account has been permanently removed by the administrator.'
                                : 'The property owner\'s account has been suspended by the administrator.'
                            }
                            {' '}You are required to vacate the premises within the notice period.
                        </p>
                        
                        <div className="flex items-center gap-3 bg-white/60 rounded-lg p-3 border border-amber-200">
                            <div className="text-center">
                                <p className="text-2xl font-black text-amber-700">{daysRemaining}</p>
                                <p className="text-[10px] font-bold text-amber-600 uppercase">Days Left</p>
                            </div>
                            <div className="h-10 w-px bg-amber-200" />
                            <div>
                                <p className="text-xs font-bold text-amber-800">Vacate By</p>
                                <p className="text-sm font-bold text-amber-700">
                                    {vacateDate.toLocaleDateString('en-IN', { 
                                        weekday: 'long', 
                                        day: 'numeric', 
                                        month: 'long', 
                                        year: 'numeric' 
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Legal warning */}
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
                        <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                                <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">Legal Notice</p>
                                <p className="text-sm text-red-700 font-medium leading-relaxed">
                                    Failure to vacate the property by the specified deadline may result in legal action being taken against you. 
                                    Please ensure all personal belongings are removed and the property is returned in its original condition.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Acknowledge checkbox */}
                    <label className="flex items-start gap-3 mb-4 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={acknowledged}
                            onChange={(e) => setAcknowledged(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-dark-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                        <span className="text-xs text-dark-600 font-medium leading-relaxed group-hover:text-dark-900 transition-colors">
                            I acknowledge that I have read and understood the vacate notice. I am aware that failure to comply within the 7-day 
                            notice period may result in legal action.
                        </span>
                    </label>

                    {/* Actions */}
                    <button
                        onClick={onAcknowledge}
                        disabled={!acknowledged}
                        className="w-full py-3 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        I Understand and Acknowledge
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
