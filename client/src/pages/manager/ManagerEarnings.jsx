import { useState, useEffect } from 'react';
import ManagerLayout from '../../layouts/ManagerLayout';
import { apiGet } from '../../utils/api';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&h=150&fit=crop';

export default function ManagerEarnings() {
    const isDemo = window.location.pathname.startsWith('/demo');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await apiGet('/invoices/earnings');
                setData(res);
            } catch {
                setData({ summary: { totalEarned: 0, thisMonthEarned: 0, pendingInvoices: 0, totalTransactions: 0 }, recentPayments: [], propertyBreakdown: [] });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <ManagerLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                </div>
            </ManagerLayout>
        );
    }

    const { summary, recentPayments, propertyBreakdown } = data;

    return (
        <ManagerLayout
            breadcrumbs={[
                { label: 'Home', href: isDemo ? '/demo/manager' : '/manager/dashboard' },
                { label: 'Earnings' },
            ]}
        >
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Earnings</h1>
                    <p className="text-dark-500 text-sm">Revenue from tenant payments only</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 text-white shadow-lg shadow-blue-500/20 flex flex-col justify-center">
                    <p className="text-xl font-black leading-none mb-0.5">₹{summary.totalEarned.toLocaleString()}</p>
                    <p className="text-blue-100 text-[10px] font-bold uppercase tracking-wider">Total Earned</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-dark-100 shadow-sm flex flex-col justify-center">
                    <p className="text-xl font-black text-dark-900 leading-none mb-0.5">₹{summary.thisMonthEarned.toLocaleString()}</p>
                    <p className="text-dark-400 text-[10px] font-bold uppercase tracking-wider">This Month</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-dark-100 shadow-sm flex flex-col justify-center">
                    <p className="text-xl font-black text-amber-600 leading-none mb-0.5">{summary.pendingInvoices}</p>
                    <p className="text-dark-400 text-[10px] font-bold uppercase tracking-wider">Pending Invoices</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-dark-100 shadow-sm flex flex-col justify-center">
                    <p className="text-xl font-black text-dark-900 leading-none mb-0.5">{summary.totalTransactions}</p>
                    <p className="text-dark-400 text-[10px] font-bold uppercase tracking-wider">Total Payments</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Payments */}
                <div className="lg:col-span-2">
                    <h2 className="text-lg font-bold text-dark-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-5 bg-blue-500 rounded-full" />
                        Payment History
                    </h2>
                    {recentPayments.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dark-100 p-10 text-center">
                            <div className="w-14 h-14 bg-dark-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <svg className="w-7 h-7 text-dark-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 10v1" /></svg>
                            </div>
                            <p className="text-dark-900 font-bold mb-1">No Earnings Yet</p>
                            <p className="text-dark-400 text-xs">Earnings will appear once tenants make payments on approved applications.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-dark-50 text-[10px] font-bold uppercase tracking-wider text-dark-400">
                                        <th className="text-left px-4 py-3">Tenant</th>
                                        <th className="text-left px-4 py-3">Property</th>
                                        <th className="text-right px-4 py-3">Amount</th>
                                        <th className="text-left px-4 py-3">Date</th>
                                        <th className="text-left px-4 py-3">Transaction</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-50">
                                    {recentPayments.map(p => (
                                        <tr key={p._id} className="hover:bg-dark-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                                        {(p.tenant?.firstName?.[0] || '?').toUpperCase()}
                                                    </div>
                                                    <span className="text-dark-900 text-xs font-medium truncate max-w-[120px]">
                                                        {p.tenant?.firstName} {p.tenant?.lastName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-dark-600 text-xs truncate max-w-[150px] block">{p.property?.title || 'Property'}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="text-blue-700 font-bold text-sm">₹{p.amount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-dark-400 text-xs">
                                                    {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-dark-400 text-[10px] font-mono">{p.transactionId?.slice(0, 15)}...</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Property Breakdown */}
                <div>
                    <h2 className="text-lg font-bold text-dark-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-5 bg-primary-500 rounded-full" />
                        By Property
                    </h2>
                    {propertyBreakdown.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dark-100 p-6 text-center">
                            <p className="text-dark-400 text-xs">No property data yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {propertyBreakdown.map((item, i) => (
                                <div key={i} className="bg-white rounded-xl border border-dark-100 p-4 flex items-center gap-3">
                                    <div className="w-12 h-10 rounded-lg overflow-hidden bg-dark-50 flex-shrink-0">
                                        <img src={item.property?.images?.[0]?.url || PLACEHOLDER} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-dark-900 text-xs font-bold truncate">{item.property?.title || 'Property'}</p>
                                        <p className="text-dark-400 text-[10px]">{item.paymentCount} payment{item.paymentCount !== 1 ? 's' : ''}</p>
                                    </div>
                                    <p className="text-blue-700 font-bold text-sm flex-shrink-0">₹{item.totalEarned.toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ManagerLayout>
    );
}
