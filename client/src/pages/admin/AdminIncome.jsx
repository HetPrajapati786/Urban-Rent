import { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { apiGet } from '../../utils/api';

const SOURCE_TABS = [
    { key: 'all', label: 'All Income' },
    { key: 'credit_purchase', label: 'Credit Sales' },
    { key: 'lease_commission', label: 'Rent Commission' },
    { key: 'other', label: 'Other' },
];

const SOURCE_BADGE = {
    credit_purchase: { label: 'Credit Purchase', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    lease_commission: { label: '2% Platform Fee', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    other: { label: 'Other', cls: 'bg-dark-50 text-dark-600 border-dark-200' },
};

export default function AdminIncome() {
    const location = useLocation();
    const isDemo = location.pathname.startsWith('/demo');

    const [allTransactions, setAllTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [expandedUser, setExpandedUser] = useState(null);

    const fetchIncome = useCallback(async () => {
        try {
            setLoading(true);
            const data = await apiGet('/admin/income?filter=monthly');
            setAllTransactions(data.recentTransactions || []);
        } catch (err) {
            console.error('Fetch income error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchIncome();
    }, [fetchIncome]);

    // Filter by source tab
    const filtered = activeTab === 'all'
        ? allTransactions
        : allTransactions.filter(tx => tx.source === activeTab);

    // Group by user
    const userGroups = {};
    filtered.forEach(tx => {
        const uid = tx.user?._id || 'unknown';
        if (!userGroups[uid]) {
            userGroups[uid] = {
                user: tx.user,
                transactions: [],
                totalIncome: 0,
                sources: new Set(),
            };
        }
        userGroups[uid].transactions.push(tx);
        userGroups[uid].totalIncome += tx.amount || 0;
        userGroups[uid].sources.add(tx.source);
    });

    // Sort groups by total income (highest first)
    const sortedGroups = Object.values(userGroups).sort((a, b) => b.totalIncome - a.totalIncome);

    // Summary stats
    const totalIncome = filtered.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const creditIncome = allTransactions.filter(tx => tx.source === 'credit_purchase').reduce((s, t) => s + t.amount, 0);
    const commissionIncome = allTransactions.filter(tx => tx.source === 'lease_commission').reduce((s, t) => s + t.amount, 0);

    return (
        <AdminLayout
            breadcrumbs={[
                { label: 'Dashboard', href: isDemo ? '/demo/admin' : '/admin/dashboard' },
                { label: 'Income' },
            ]}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-dark-900">Admin Income</h1>
                        <p className="text-dark-400 text-sm mt-0.5">All revenue the platform earns, organized by user</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 text-white shadow-lg shadow-emerald-600/20">
                        <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mb-1">Total Admin Income</p>
                        <p className="text-3xl font-black">₹{totalIncome.toLocaleString()}</p>
                        <p className="text-emerald-200 text-xs mt-1">{filtered.length} transactions</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-dark-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <p className="text-dark-400 text-[10px] font-bold uppercase tracking-widest">Credit Sales</p>
                        </div>
                        <p className="text-2xl font-black text-amber-700">₹{creditIncome.toLocaleString()}</p>
                        <p className="text-dark-400 text-[10px] mt-0.5">From manager credit packages</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-dark-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            </div>
                            <p className="text-dark-400 text-[10px] font-bold uppercase tracking-widest">Rent Commission</p>
                        </div>
                        <p className="text-2xl font-black text-indigo-700">₹{commissionIncome.toLocaleString()}</p>
                        <p className="text-dark-400 text-[10px] mt-0.5">2% fee on every rental payment</p>
                    </div>
                </div>

                {/* Source Filter Tabs */}
                <div className="flex items-center gap-2 flex-wrap">
                    {SOURCE_TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setExpandedUser(null); }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border inline-flex items-center gap-1.5 ${
                                activeTab === tab.key
                                    ? 'bg-dark-900 text-white border-dark-900'
                                    : 'bg-white text-dark-500 border-dark-100 hover:border-dark-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* User-Grouped Income List */}
                <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                        </div>
                    ) : sortedGroups.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-dark-50 flex items-center justify-center">
                                <svg className="w-6 h-6 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                            </div>
                            <p className="text-dark-500 font-medium">No income records found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-dark-50">
                            {sortedGroups.map(group => {
                                const uid = group.user?._id || 'unknown';
                                const isExpanded = expandedUser === uid;
                                return (
                                    <div key={uid}>
                                        {/* User Row (clickable) */}
                                        <button
                                            onClick={() => setExpandedUser(isExpanded ? null : uid)}
                                            className="w-full flex items-center justify-between p-5 hover:bg-dark-50/50 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* Avatar */}
                                                <div className="w-12 h-12 rounded-full bg-dark-100 flex items-center justify-center text-dark-500 font-black text-lg flex-shrink-0">
                                                    {(group.user?.firstName?.[0] || '?').toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-bold text-dark-900 text-sm">
                                                            {group.user?.firstName} {group.user?.lastName}
                                                        </p>
                                                        {group.user?.role && (
                                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                                                group.user.role === 'manager' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                                                            }`}>{group.user.role}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-dark-400 text-xs">{group.user?.email}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {[...group.sources].map(src => (
                                                            <span key={src} className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${SOURCE_BADGE[src]?.cls || SOURCE_BADGE.other.cls}`}>
                                                                {SOURCE_BADGE[src]?.label || src}
                                                            </span>
                                                        ))}
                                                        <span className="text-dark-300 text-[10px]">· {group.transactions.length} txns</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-black text-emerald-700 text-lg">₹{group.totalIncome.toLocaleString()}</p>
                                                    <p className="text-dark-400 text-[10px]">total earned</p>
                                                </div>
                                                <svg className={`w-5 h-5 text-dark-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </button>

                                        {/* Expanded Transactions */}
                                        {isExpanded && (
                                            <div className="bg-dark-50/30 border-t border-dark-100">
                                                <div className="px-5 py-3 border-b border-dark-100">
                                                    <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest">
                                                        Transaction History for {group.user?.firstName}
                                                    </p>
                                                </div>
                                                <div className="divide-y divide-dark-100/50">
                                                    {group.transactions
                                                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                                        .map(tx => (
                                                        <div key={tx._id} className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-white/60 transition-colors">
                                                            <div className="flex items-start gap-3 min-w-0">
                                                                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                                                                    tx.source === 'credit_purchase' ? 'bg-amber-100 text-amber-600'
                                                                    : tx.source === 'lease_commission' ? 'bg-indigo-100 text-indigo-600'
                                                                    : 'bg-emerald-100 text-emerald-600'
                                                                }`}>
                                                                    {tx.source === 'credit_purchase' ? (
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                    ) : (
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border mb-1 ${SOURCE_BADGE[tx.source]?.cls || SOURCE_BADGE.other.cls}`}>
                                                                        {SOURCE_BADGE[tx.source]?.label || tx.source}
                                                                    </span>
                                                                    <p className="text-dark-700 text-xs font-medium">{tx.description}</p>
                                                                    {tx.transactionId && (
                                                                        <p className="text-dark-300 text-[9px] font-mono mt-0.5">TXN: {tx.transactionId}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-right flex-shrink-0">
                                                                <p className="font-black text-emerald-700 text-sm">+₹{tx.amount?.toLocaleString()}</p>
                                                                <p className="text-[10px] text-dark-400">
                                                                    {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                </p>
                                                                <p className="text-[9px] text-dark-300">
                                                                    {new Date(tx.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
