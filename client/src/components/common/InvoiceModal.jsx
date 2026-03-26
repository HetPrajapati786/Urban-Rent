import React from 'react';

export default function InvoiceModal({ isOpen, onClose, data }) {
    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-900/40 backdrop-blur-sm sm:p-6">
            <div 
                className="w-full max-w-[460px] bg-white rounded-[28px] shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden font-sans"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 pb-2">
                    <h2 className="text-xl font-bold text-dark-900 tracking-tight">{data.title || 'Payment Record'}</h2>
                    <button 
                        onClick={onClose}
                        className="p-2 -mr-2 text-dark-400 hover:text-dark-900 hover:bg-dark-50 rounded-full transition-colors focus:outline-none"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content Body */}
                <div className="px-8 pb-8 pt-2">
                    {/* Top Details */}
                    <div className="flex items-start justify-between mb-5">
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-dark-400 mb-1">{data.companyLabel || 'Company'}</p>
                            <div className="flex items-center gap-2">
                                {data.companyImage ? (
                                    <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0 border border-dark-100">
                                        <img src={data.companyImage} alt="" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 rounded bg-dark-900 flex items-center justify-center flex-shrink-0 text-white font-bold text-[10px]">
                                        {data.companyName?.[0] || 'U'}
                                    </div>
                                )}
                                <span className="font-bold text-dark-900 text-sm">{data.companyName}</span>
                            </div>
                        </div>
                        <div className="flex-1 text-right">
                            <p className="text-xs font-semibold text-dark-400 mb-1">{data.jobLabel || 'Purpose'}</p>
                            <span className="font-bold text-dark-900 text-sm block truncate">{data.jobName}</span>
                        </div>
                    </div>

                    {/* Status Badges */}
                    {data.status && data.status.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {data.status.map((st, i) => (
                                <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold leading-none ${st.colorClass}`}>
                                    {st.showDot && <span className={`w-1.5 h-1.5 rounded-full ${st.dotClass}`}></span>}
                                    {st.label}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Itemized Box */}
                    <div className="border border-dark-100 rounded-[20px] p-5 mb-5 bg-[#fafafa]/50 shadow-sm">
                        <div className="space-y-4">
                            {data.items?.map((item, i) => (
                                <div key={i} className="flex justify-between items-start gap-4">
                                    <div>
                                        <p className="font-semibold text-sm text-dark-800">{item.title}</p>
                                        <p className="font-medium text-[11px] text-dark-400 mt-0.5">{item.subtitle}</p>
                                    </div>
                                    <div className="font-semibold text-sm text-dark-900 whitespace-nowrap">
                                        {item.amount}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {data.itemsTotal && (
                            <div className="mt-4 pt-4 border-t border-dark-100 flex justify-end gap-2 items-center text-sm font-bold">
                                <span className="text-emerald-700">{data.itemsTotal.label}</span>
                                <span className="text-emerald-700">{data.itemsTotal.value}</span>
                            </div>
                        )}
                    </div>

                    {/* Breakdown */}
                    {data.breakdown && (
                        <div className="space-y-3 mb-6 px-1">
                            {data.breakdown.map((bRow, i) => (
                                <div key={i} className="flex justify-between items-center text-sm font-semibold text-dark-600">
                                    <span>{bRow.label}</span>
                                    <span>{bRow.value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Final Deal */}
                    {data.finalTotal && (
                        <div className="flex flex-col items-end mb-8 px-1">
                            <p className="text-[13px] font-bold text-emerald-600 mb-0.5">{data.finalTotal.label}</p>
                            <p className="text-4xl font-black text-emerald-600 tracking-tight">{data.finalTotal.value}</p>
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex gap-2 justify-end print:hidden">
                        <button 
                            onClick={data.onExport || (() => window.print())}
                            className="bg-dark-50 hover:bg-dark-100 text-dark-900 text-[13px] font-bold px-4 py-2.5 rounded-xl transition-colors border border-transparent hover:border-dark-200"
                        >
                            Export Invoice
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

