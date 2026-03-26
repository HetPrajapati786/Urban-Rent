import React from 'react';

export default function StatementModal({ isOpen, onClose, data }) {
    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-900/60 backdrop-blur-sm sm:p-8 print-hidden">
            {/* Modal Container */}
            <div className="w-full max-w-[95vw] xl:max-w-7xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-full overflow-hidden animate-in fade-in zoom-in duration-200">
                
                {/* Header (Screen only) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 flex-shrink-0 gap-4">
                    <h2 className="text-xl font-bold text-gray-900">Statement Preview</h2>
                    <div className="flex gap-2 self-end sm:self-auto">
                        <button 
                            onClick={() => window.print()}
                            className="bg-dark-900 hover:bg-black text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors shadow-sm whitespace-nowrap"
                        >
                            Save as PDF
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Printable Document Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-100 custom-scrollbar">
                    {/* The actual printed page */}
                    <div className="print-only bg-white print:p-0 print:m-0 print:max-w-none print:shadow-none p-6 sm:p-10 min-h-[800px] shadow-sm w-full mx-auto border border-gray-200 overflow-x-auto">
                        
                        {/* Statement Header */}
                        <div className="flex flex-col sm:flex-row sm:justify-between items-start mb-10 border-b-2 border-gray-900 pb-6 gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase mb-1">
                                    Urban<span className="text-gray-500">Rent</span>
                                </h1>
                                <p className="text-sm font-bold text-gray-500 tracking-widest uppercase">Official Financial Statement</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-xl font-bold text-gray-900">{data.title}</h2>
                                <p className="text-sm text-gray-600 mt-1">Generated: {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Summary Blocks */}
                        <div className="flex flex-wrap gap-8 mb-10">
                            {data.summary?.map((col, i) => (
                                <div key={i}>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{col.label}</p>
                                    <p className="text-2xl font-black text-gray-900">{col.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Statement Table */}
                        <table className="w-full text-left text-sm mb-12">
                            <thead>
                                <tr className="border-b-2 border-gray-900">
                                    {data.columns?.map((col, i) => (
                                        <th key={i} className={`py-3 font-bold text-gray-900 ${i === data.columns.length - 1 ? 'text-right' : ''}`}>
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {data.rows?.map((row, i) => (
                                    <tr key={i} className="text-gray-800">
                                        {row.map((cell, j) => (
                                            <td key={j} className={`py-3 ${j === row.length - 1 ? 'text-right font-bold' : ''}`}>
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Footer */}
                        <div className="mt-auto pt-8 border-t border-gray-200 text-center text-xs text-gray-500 font-medium">
                            <p>This is a computer-generated document and does not require a physical signature.</p>
                            <p className="mt-1">UrbanRent Inc. • www.urbanrent.com • Contact Support: billing@urbanrent.com</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

