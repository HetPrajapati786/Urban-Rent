import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminLayout from '../../layouts/AdminLayout';
import { apiGet } from '../../utils/api';

export default function AdminDashboard() {
    const location = useLocation();
    const isDemo = location.pathname.startsWith('/demo');

    const [stats, setStats] = useState(null);
    const [incomeData, setIncomeData] = useState(null);
    const [pendingProps, setPendingProps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(false);
    const [incomeFilter, setIncomeFilter] = useState('all');
    const [chartFilter, setChartFilter] = useState('monthly');

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [chartFilter]);

    const fetchData = async () => {
        if (!stats) setLoading(true); // only hard-load if we don't have base stats yet
        setChartLoading(true);
        try {
            const [statsData, propsData, incomeStats] = await Promise.all([
                apiGet('/admin/stats'),
                apiGet('/admin/properties?status=pending&limit=5'),
                apiGet(`/admin/income?filter=${chartFilter}`),
            ]);
            setStats(statsData);
            setPendingProps(propsData.properties || []);
            setIncomeData(incomeStats);
        } catch (err) {
            console.error('Admin dashboard error:', err);
        } finally {
            setLoading(false);
            setChartLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    const statCards = [
        { label: 'Total Properties', value: stats?.totalProperties || 0, color: 'bg-blue-50 text-blue-700 border-blue-100' },
        { label: 'Pending Review', value: stats?.pendingProperties || 0, color: 'bg-amber-50 text-amber-700 border-amber-100', highlight: true },
        { label: 'Active', value: stats?.activeProperties || 0, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
        { label: 'Rejected', value: stats?.rejectedProperties || 0, color: 'bg-red-50 text-red-700 border-red-100' },
        { label: 'Total Users', value: stats?.totalUsers || 0, color: 'bg-purple-50 text-purple-700 border-purple-100' },
        { label: 'Managers', value: stats?.totalManagers || 0, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    ];

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-black text-dark-900">Admin Dashboard</h1>
                    <p className="text-dark-400 text-sm mt-1">Manage properties, users, and platform settings</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {statCards.map((card) => (
                        <div key={card.label} className={`p-4 rounded-2xl border ${card.color} ${card.highlight ? 'ring-2 ring-amber-300 ring-offset-2' : ''}`}>
                            <p className="text-2xl font-black">{card.value}</p>
                            <p className="text-xs font-semibold opacity-70 mt-0.5">{card.label}</p>
                        </div>
                    ))}
                </div>

                {/* Revenue Chart Section */}
                <div className="bg-white rounded-2xl border border-dark-100 p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-start gap-4 flex-1">
                            <div>
                                <h2 className="text-lg font-bold text-dark-900">Platform Income</h2>
                                <p className="text-dark-400 text-xs mt-0.5">Revenue generated from Manager Credits and Platform Fees</p>
                            </div>
                            <select 
                                value={chartFilter}
                                onChange={(e) => setChartFilter(e.target.value)}
                                className="ml-auto bg-dark-50 border border-dark-100 text-dark-800 text-xs font-bold rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2 outline-none cursor-pointer"
                            >
                                <option value="daily">Daily (This Month)</option>
                                <option value="weekly">Weekly (YTD)</option>
                                <option value="monthly">Monthly (YTD)</option>
                                <option value="yearly">Yearly (All Time)</option>
                            </select>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-right">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Total Income</p>
                            <p className="text-2xl font-black text-emerald-700">₹{(incomeData?.totalLifetime || 0).toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <div className="h-[300px] w-full relative">
                        {chartLoading ? (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
                            </div>
                        ) : null}
                        
                        {incomeData?.chartData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                {chartFilter === 'weekly' || chartFilter === 'yearly' || incomeData.chartData.length <= 1 ? (
                                    <BarChart data={incomeData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(value) => `₹${value}`} />
                                        <Tooltip 
                                            cursor={{ fill: '#F3F4F6' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                            formatter={(value) => [`₹${value}`, 'Revenue']}
                                            labelStyle={{ color: '#9CA3AF', marginBottom: '4px' }}
                                        />
                                        <Bar dataKey="total" fill="#059669" radius={[6, 6, 0, 0]} maxBarSize={60} />
                                    </BarChart>
                                ) : (
                                    <AreaChart data={incomeData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(value) => `₹${value}`} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                            formatter={(value) => [`₹${value}`, 'Revenue']}
                                            labelStyle={{ color: '#9CA3AF', marginBottom: '4px' }}
                                        />
                                        <Area type="monotone" dataKey="total" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                                    </AreaChart>
                                )}
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-dark-400 text-sm font-bold">
                                Loading Graph...
                            </div>
                        )}
                    </div>
                </div>

                {/* Two-column bottom section */}
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Pending Properties */}
                    <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-dark-100">
                            <div>
                                <h2 className="text-lg font-bold text-dark-900">Pending Approvals</h2>
                                <p className="text-dark-400 text-xs mt-0.5">Properties waiting for your review</p>
                            </div>
                            <Link
                                to={isDemo ? '/demo/admin/properties?status=pending' : '/admin/properties?status=pending'}
                                className="text-red-600 text-xs font-bold hover:underline"
                            >
                                View All →
                            </Link>
                        </div>

                        {pendingProps.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <p className="text-dark-500 font-medium">No pending properties</p>
                                <p className="text-dark-400 text-xs mt-1">All caught up! No properties need review.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-dark-50">
                                {pendingProps.map((prop) => (
                                    <div key={prop._id} className="flex items-center gap-4 p-4 hover:bg-dark-50 transition-colors">
                                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-dark-100 flex-shrink-0">
                                            <img
                                                src={prop.images?.[0]?.url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=100&h=100&fit=crop'}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-dark-900 text-sm truncate">{prop.title}</h3>
                                            <p className="text-dark-400 text-xs truncate">
                                                {prop.location?.area}, {prop.location?.city} · ₹{prop.pricing?.monthlyRent?.toLocaleString()}/mo
                                            </p>
                                            <p className="text-dark-300 text-[10px] mt-0.5">
                                                by {prop.owner?.firstName} {prop.owner?.lastName} · {new Date(prop.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                        <Link
                                            to={isDemo ? `/demo/admin/properties` : `/admin/properties`}
                                            className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors whitespace-nowrap"
                                        >
                                            Review
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Income */}
                    <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-5 border-b border-dark-100">
                            <div>
                                <h2 className="text-lg font-bold text-dark-900">Recent Income</h2>
                                <p className="text-dark-400 text-xs mt-0.5">Latest 5 revenue transactions</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setIncomeFilter('all')}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${incomeFilter === 'all' ? 'bg-dark-900 text-white border-dark-900' : 'bg-white text-dark-500 border-dark-200 hover:border-dark-400'}`}
                                >All</button>
                                <button
                                    onClick={() => setIncomeFilter('credit_purchase')}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${incomeFilter === 'credit_purchase' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-700 border-amber-200 hover:border-amber-400'}`}
                                >Credit</button>
                                <button
                                    onClick={() => setIncomeFilter('lease_commission')}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${incomeFilter === 'lease_commission' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-700 border-indigo-200 hover:border-indigo-400'}`}
                                >Rent</button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            {(() => {
                                const filteredTxns = incomeFilter === 'all'
                                    ? (incomeData?.recentTransactions || [])
                                    : (incomeData?.recentTransactions || []).filter(tx => tx.source === incomeFilter);
                                const displayTxns = filteredTxns.slice(0, 5);
                                if (!displayTxns.length) {
                                    return <div className="p-12 text-center text-dark-500 font-medium">No transactions found</div>;
                                }
                                return (
                                    <div className="divide-y divide-dark-50">
                                        {displayTxns.map(tx => (
                                            <div key={tx._id} className="p-4 hover:bg-dark-50/50 transition-colors">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-3 min-w-0">
                                                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                                                            tx.source === 'credit_purchase' ? 'bg-amber-100 text-amber-600'
                                                            : tx.source === 'lease_commission' ? 'bg-indigo-100 text-indigo-600'
                                                            : 'bg-emerald-100 text-emerald-600'
                                                        }`}>
                                                            {tx.source === 'credit_purchase' ? (
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            ) : (
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mb-1 ${
                                                                tx.source === 'credit_purchase' ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                : tx.source === 'lease_commission' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                                                : 'bg-dark-50 text-dark-600 border border-dark-200'
                                                            }`}>
                                                                {tx.source === 'credit_purchase' ? 'Credit Purchase' : tx.source === 'lease_commission' ? '2% Platform Fee' : tx.source}
                                                            </span>
                                                            <p className="text-dark-700 text-xs font-medium leading-snug">{tx.description}</p>
                                                            <p className="text-dark-400 text-[10px] mt-1">
                                                                From: <span className="font-bold text-dark-600">{tx.user?.firstName} {tx.user?.lastName}</span>
                                                                {tx.user?.email && <span className="text-dark-400"> ({tx.user.email})</span>}
                                                                {tx.user?.role && <span className={`ml-1.5 inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                                                    tx.user.role === 'manager' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                                                                }`}>{tx.user.role}</span>}
                                                            </p>
                                                            {tx.transactionId && (
                                                                <p className="text-dark-300 text-[9px] mt-0.5 font-mono">TXN: {tx.transactionId}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="font-black text-emerald-700 text-base">+₹{tx.amount?.toLocaleString()}</p>
                                                        <p className="text-[10px] text-dark-400 mt-0.5">
                                                            {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                        <p className="text-[9px] text-dark-300">
                                                            {new Date(tx.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                        {/* View All button */}
                        <div className="border-t border-dark-100 p-3 text-center">
                            <Link
                                to={isDemo ? '/demo/admin/income' : '/admin/income'}
                                className="text-indigo-600 text-xs font-bold hover:underline inline-flex items-center gap-1"
                            >
                                View All Income
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
