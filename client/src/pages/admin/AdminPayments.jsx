import { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { apiGet, apiPatch } from '../../utils/api';
import ChatWidget from '../../components/ChatWidget';
import InvoiceModal from '../../components/common/InvoiceModal';
import StatementModal from '../../components/common/StatementModal';

const STATUS_TABS = [
    { key: 'all', label: 'All' },
    { key: 'completed', label: 'Completed' },
    { key: 'refunded', label: 'Refunded' },
];

const STATUS_BADGE = {
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    refunded: 'bg-red-50 text-red-700 border-red-200',
};

export default function AdminPayments() {
    const location = useLocation();
    const isDemo = location.pathname.startsWith('/demo');

    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showStatement, setShowStatement] = useState(false);

    const fetchPayments = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('limit', '100');
            const data = await apiGet(`/admin/payments?${params.toString()}`);
            let payData = data.payments || [];
            
            // Filter by tab
            if (activeTab !== 'all') {
                payData = payData.filter(p => p.status === activeTab);
            }

            setPayments(payData);
        } catch (err) {
            console.error('Fetch payments error:', err);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            fetchPayments();
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [fetchPayments]);

    const handleRefund = async (paymentId) => {
        if (!window.confirm(`Are you sure you want to refund this payment? This will mark it as refunded and reopen the invoice.`)) return;
        setActionLoadingId(paymentId);
        try {
            await apiPatch(`/admin/payments/${paymentId}/refund`);
            fetchPayments();
        } catch (err) {
            alert('Failed: ' + err.message);
        } finally {
            setActionLoadingId(null);
        }
    };

    const totalVolume = payments.filter(p => p.status === 'completed').reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <AdminLayout
            breadcrumbs={[
                { label: 'Dashboard', href: isDemo ? '/demo/admin' : '/admin/dashboard' },
                { label: 'Payments' },
            ]}
        >
            <div className="max-w-[1400px] mx-auto w-full flex flex-col h-[calc(100vh-8rem)] min-h-0">
                {/* Page Header */}
                <div className="flex-shrink-0 flex items-center justify-between pb-6 border-b border-dark-100 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-dark-900 tracking-tight">Financial Ledger</h1>
                        <p className="text-dark-500 text-sm mt-1">Track all payments, oversee platform revenue, and manage disputes.</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pb-10 pr-2 space-y-8">
                    {/* Stats Section */}
                    <div className="grid lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl border border-dark-100 p-5 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-bold text-dark-400 uppercase tracking-wider mb-2">Total Volume (Visible)</p>
                                <p className="text-3xl font-black tracking-tight text-emerald-600">₹{totalVolume.toLocaleString()}</p>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-dark-100 p-5 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-bold text-dark-400 uppercase tracking-wider mb-2">Total Transactions</p>
                                <p className="text-3xl font-black tracking-tight text-dark-900">{payments.length}</p>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-dark-50 text-dark-900 flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Ledger History Section */}
                    <div className="bg-white rounded-2xl border border-dark-100 shadow-sm p-6 overflow-hidden">
                        <div className="flex flex-col xl:flex-row justify-between xl:items-center mb-6 gap-4">
                            <h2 className="text-xl font-bold text-dark-900 tracking-tight flex items-center gap-3">
                                Transaction History
                                <div className="flex gap-1 ml-4 bg-dark-50 p-1 rounded-lg">
                                    {STATUS_TABS.map((tab) => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setActiveTab(tab.key)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                                activeTab === tab.key
                                                ? 'bg-white text-dark-900 shadow-sm'
                                                : 'text-dark-500 hover:text-dark-900'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </h2>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative flex-1 min-w-[200px] xl:w-64">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <input 
                                        type="text" 
                                        placeholder="Search Property or ID..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 border border-dark-200 rounded-lg text-sm font-medium focus:outline-none focus:border-dark-400 focus:ring-1 focus:ring-400 transition-all placeholder:font-normal" 
                                    />
                                </div>
                                
                                <button onClick={() => setShowStatement(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-dark-50 rounded-lg text-sm font-bold text-dark-900 hover:bg-dark-100 border border-dark-100 transition-colors shadow-sm whitespace-nowrap">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Export PDF
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="text-dark-400 bg-dark-50/50 border-b border-dark-100/50">
                                        <th className="font-bold py-3 px-4 rounded-tl-lg tracking-wider text-[11px] uppercase">Transaction ID</th>
                                        <th className="font-bold py-3 px-4 tracking-wider text-[11px] uppercase">Property / Invoice</th>
                                        <th className="font-bold py-3 px-4 tracking-wider text-[11px] uppercase">Amount</th>
                                        <th className="font-bold py-3 px-4 tracking-wider text-[11px] uppercase">Users Involved</th>
                                        <th className="font-bold py-3 px-4 tracking-wider text-[11px] uppercase">Date</th>
                                        <th className="font-bold py-3 px-4 tracking-wider text-[11px] uppercase">Status</th>
                                        <th className="font-bold py-3 px-4 rounded-tr-lg text-right tracking-wider text-[11px] uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-50/50 text-dark-700">
                                    {loading ? (
                                        <tr><td colSpan="7" className="py-12 text-center text-dark-400 font-medium">Loading ledger...</td></tr>
                                    ) : payments.filter(p => p.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()) || p.property?.title?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                                        <tr><td colSpan="7" className="py-12 text-center text-dark-400 font-medium">No transactions found</td></tr>
                                    ) : payments.filter(p => p.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()) || p.property?.title?.toLowerCase().includes(searchQuery.toLowerCase())).map((payment) => {
                                        
                                        const bgStyle = payment.status === 'completed' ? 'emerald' : payment.status === 'failed' ? 'red' : 'amber';                                  return (
                                        <tr key={payment._id} className="hover:bg-dark-50/30 transition-colors group">
                                            <td className="py-3 px-4 font-bold text-dark-900 border-l-[3px] border-transparent hover:border-dark-900">
                                                <span className="font-mono text-[11px] tracking-tight bg-dark-50 px-2 py-1 rounded inline-block border border-dark-100">{payment.transactionId}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Link to={isDemo ? `/demo/admin/properties/${payment.property?._id}` : `/admin/properties/${payment.property?._id}`} className="font-bold text-dark-900 hover:text-indigo-600 transition-colors block border-b-transparent hover:border-b-indigo-600 w-fit">
                                                    {payment.property?.title || 'Unknown Property'}
                                                </Link>
                                                {payment.invoice && (
                                                    <p className="text-[10px] text-dark-500 font-medium mt-1">Invoice: {payment.invoice.month} {payment.invoice.year}</p>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 font-black text-dark-900 text-lg">
                                                ₹{(payment.amount || 0).toLocaleString()}
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <svg className="w-3 h-3 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                                    <span className="text-[10px] text-dark-500 uppercase font-bold">{payment.method || 'card'}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-[11px] font-bold text-dark-800"><span className="text-emerald-600">From:</span> {payment.tenant?.firstName} {payment.tenant?.lastName}</p>
                                                    <p className="text-[11px] font-bold text-dark-800"><span className="text-indigo-600">To:</span> {payment.manager?.firstName} {payment.manager?.lastName}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 font-medium text-dark-700">
                                                {new Date(payment.createdAt).toLocaleDateString('en-CA')}
                                                <span className="block text-dark-400 text-xs mt-0.5">{new Date(payment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center gap-1.5 text-${bgStyle}-700 font-bold text-[10px] uppercase tracking-wider bg-${bgStyle}-50 px-2.5 py-1 rounded-full border border-${bgStyle}-100`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full bg-${bgStyle}-500 shadow-sm`}></div> {payment.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex justify-end gap-2 text-dark-400 transition-opacity">
                                                    {payment.status === 'completed' ? (
                                                        <button 
                                                            onClick={() => setSelectedInvoice({
                                                                title: 'Administrator View: Payment Record',
                                                                companyLabel: 'Sender (Tenant)',
                                                                companyName: payment.tenant ? `${payment.tenant.firstName} ${payment.tenant.lastName}` : 'Tenant User',
                                                                jobLabel: 'Recipient (Manager)',
                                                                jobName: payment.manager ? `${payment.manager.firstName} ${payment.manager.lastName}` : 'Manager User',
                                                                status: [
                                                                    { label: payment.status || 'Success', colorClass: 'bg-emerald-50 text-emerald-600', dotClass: 'bg-emerald-600', showDot: true },
                                                                    { label: payment.method || 'System Transfer', colorClass: 'bg-indigo-50 text-indigo-600 border border-indigo-100' }
                                                                ],
                                                                items: [
                                                                    { title: payment.property?.title || 'Unknown Property', subtitle: `Transaction: ${payment.transactionId}`, amount: `₹${(payment.amount || 0).toLocaleString()}` }
                                                                ],
                                                                breakdown: (() => {
                                                                    const fee = Math.round((payment.amount || 0) * 0.02);
                                                                    return [
                                                                        { label: 'Gross Amount', value: `₹${(payment.amount || 0).toLocaleString()}` },
                                                                        { label: 'Platform Commission (2%)', value: `₹${fee.toLocaleString()}` }
                                                                    ];
                                                                })(),
                                                                finalTotal: { label: 'Net Processed', value: `₹${(payment.amount || 0).toLocaleString()}` }
                                                            })}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-dark-200 hover:bg-dark-100 hover:text-dark-900 bg-dark-50 transition-all font-bold" title="Download Invoice"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                        </button>
                                                    ) : (
                                                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-dark-200 hover:bg-dark-100 hover:text-dark-900 bg-dark-50 transition-all font-bold" title="View Error Details">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <InvoiceModal 
                isOpen={!!selectedInvoice} 
                onClose={() => setSelectedInvoice(null)} 
                data={selectedInvoice} 
            />

            <StatementModal 
                isOpen={showStatement} 
                onClose={() => setShowStatement(false)} 
                data={{
                    title: "Admin System Ledger",
                    summary: [
                        { label: "Total Transactions", value: payments.length },
                        { label: "Total Volume Found", value: `₹${totalVolume.toLocaleString()}` }
                    ],
                    columns: ["Date", "Transaction ID", "User Info", "Amount", "Status"],
                    rows: payments.map(p => [
                        new Date(p.createdAt).toLocaleDateString(),
                        p.transactionId,
                        p.tenant ? `${p.tenant.firstName} -> ${p.manager?.firstName || 'Sys'}` : 'System',
                        `₹${(p.amount || 0).toLocaleString()}`,
                        p.status || 'completed'
                    ])
                }} 
            />
        </AdminLayout>
    );
}
