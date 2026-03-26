import { useState, useEffect } from 'react';
import TenantLayout from '../../layouts/TenantLayout';
import { apiGet } from '../../utils/api';
import ChatWidget from '../../components/ChatWidget';
import InvoiceModal from '../../components/common/InvoiceModal';
import StatementModal from '../../components/common/StatementModal';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&h=150&fit=crop';

export default function TenantPayments() {
    const isDemo = window.location.pathname.startsWith('/demo');
    const [payments, setPayments] = useState([]);
    const [summary, setSummary] = useState({ totalAmount: 0, thisMonthAmount: 0, totalTransactions: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showStatement, setShowStatement] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await apiGet('/invoices/payments/history');
                setPayments(res.payments || []);
                setSummary(res.summary || { totalAmount: 0, thisMonthAmount: 0, totalTransactions: 0 });
            } catch {
                setPayments([]);
                setSummary({ totalAmount: 0, thisMonthAmount: 0, totalTransactions: 0 });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <TenantLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                </div>
            </TenantLayout>
        );
    }
    return (
        <TenantLayout
            breadcrumbs={[
                { label: 'Home', href: isDemo ? '/demo/tenant' : '/tenant/dashboard' },
                { label: 'Payment History' },
            ]}
        >
            <div className="max-w-[1400px] mx-auto w-full flex flex-col h-[calc(100vh-8rem)] min-h-0">
                {/* Page Header */}
                <div className="flex-shrink-0 flex items-center justify-between pb-6 border-b border-dark-100 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-dark-900 tracking-tight">Payment History</h1>
                        <p className="text-dark-500 text-sm mt-1">Review your past transactions, invoices, and rental payments.</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pb-10 pr-2 space-y-8">
                    {/* Stats */}
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl border border-indigo-400 p-6 sm:p-5 shadow-md flex items-center justify-between text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-[11px] font-bold text-indigo-100 uppercase tracking-wider mb-2">Total Paid</p>
                                <p className="text-2xl sm:text-3xl font-black tracking-tight">₹{summary.totalAmount.toLocaleString()}</p>
                            </div>
                            <div className="relative z-10 w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        </div>

                        <div className="bg-white rounded-2xl border border-dark-100 p-6 sm:p-5 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-bold text-dark-400 uppercase tracking-wider mb-2">This Month</p>
                                <p className="text-2xl sm:text-3xl font-black tracking-tight text-dark-900">₹{summary.thisMonthAmount.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-dark-100 p-6 sm:p-5 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-bold text-dark-400 uppercase tracking-wider mb-2">Transactions</p>
                                <p className="text-2xl sm:text-3xl font-black tracking-tight text-dark-900">{summary.totalTransactions}</p>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-dark-50 text-dark-900 flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Billing History Section */}
                    <div className="bg-white rounded-2xl border border-dark-100 shadow-sm p-6 overflow-hidden">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                            <h2 className="text-xl font-bold text-dark-900 tracking-tight">Recent Transactions</h2>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <input 
                                        type="text" 
                                        placeholder="Search by ID or Property..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 border border-dark-200 rounded-lg text-sm font-medium focus:outline-none focus:border-dark-400 focus:ring-1 focus:ring-dark-400 transition-all placeholder:font-normal" 
                                    />
                                </div>
                                <button onClick={() => setShowStatement(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-dark-50 rounded-lg text-sm font-bold text-dark-900 hover:bg-dark-100 border border-dark-100 transition-colors shadow-sm">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Export
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="text-dark-400 bg-dark-50/50 border-b border-dark-100/50">
                                        <th className="font-bold py-3 px-4 rounded-tl-lg tracking-wider text-[11px] uppercase">Property / Details</th>
                                        <th className="font-bold py-3 px-4 tracking-wider text-[11px] uppercase">Transaction ID</th>
                                        <th className="font-bold py-3 px-4 tracking-wider text-[11px] uppercase">Amount & Method</th>
                                        <th className="font-bold py-3 px-4 tracking-wider text-[11px] uppercase">Breakdown</th>
                                        <th className="font-bold py-3 px-4 tracking-wider text-[11px] uppercase">Date</th>
                                        <th className="font-bold py-3 px-4 tracking-wider text-[11px] uppercase">Status</th>
                                        <th className="font-bold py-3 px-4 rounded-tr-lg text-right tracking-wider text-[11px] uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-50/50 text-dark-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="py-12 text-center text-dark-400 font-medium">Loading transactions...</td>
                                        </tr>
                                    ) : payments.filter(p => p.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()) || p.property?.title?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="py-12 text-center text-dark-400 font-medium">
                                                No payments found
                                            </td>
                                        </tr>
                                    ) : payments.filter(p => p.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()) || p.property?.title?.toLowerCase().includes(searchQuery.toLowerCase())).map((payment) => {
                                        const propImg = payment.property?.images?.[0]?.url || PLACEHOLDER;
                                        return (
                                        <tr key={payment._id} className="hover:bg-dark-50/30 transition-colors group">
                                            <td className="py-3 px-4 font-bold text-dark-900 border-l-[3px] border-transparent hover:border-dark-900">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-50 flex-shrink-0 shadow-sm border border-dark-100">
                                                        <img src={propImg} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className="text-dark-900 truncate max-w-[180px]">{payment.property?.title || 'Property'}</p>
                                                        {payment.invoice && <p className="text-[10px] text-dark-400 mt-0.5 font-medium">Invoice: {payment.invoice.month} {payment.invoice.year}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="font-mono text-[11px] font-bold tracking-tight bg-dark-50 px-2 py-1 rounded inline-block border border-dark-100 text-dark-800">{payment.transactionId}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-dark-900 text-base">₹{(payment.amount || 0).toLocaleString()}</span>
                                                    <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                                        {payment.method || 'card'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                {payment.breakdown ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[10px] text-dark-600 font-medium">Rent: ₹{payment.breakdown.rent?.toLocaleString() || 0}</span>
                                                        {payment.breakdown.securityDeposit > 0 && <span className="text-[10px] text-dark-600 font-medium">Dep: ₹{payment.breakdown.securityDeposit.toLocaleString()}</span>}
                                                        {payment.breakdown.maintenanceCharges > 0 && <span className="text-[10px] text-dark-600 font-medium">Maint: ₹{payment.breakdown.maintenanceCharges.toLocaleString()}</span>}
                                                    </div>
                                                ) : <span className="text-[10px] text-dark-400 italic">No breakdown</span>}
                                            </td>
                                            <td className="py-3 px-4 font-medium text-dark-700">
                                                {new Date(payment.createdAt).toLocaleDateString('en-CA')}
                                                <span className="block text-dark-400 text-[10px] mt-0.5">{new Date(payment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center gap-1.5 text-emerald-700 font-bold text-[10px] uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100`}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm"></div> Completed
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex justify-end gap-2 text-dark-400 transition-opacity">
                                                    <button 
                                                        onClick={() => setSelectedInvoice({
                                                            title: 'Payment Record',
                                                            companyLabel: 'Property Manager',
                                                            companyName: payment.manager ? `${payment.manager.firstName} ${payment.manager.lastName}` : 'UrbanRent',
                                                            jobLabel: 'Property / Description',
                                                            jobName: payment.property?.title || 'Rent Payment',
                                                            status: [
                                                                { label: payment.status || 'Success', colorClass: 'bg-orange-50 text-orange-600', dotClass: 'bg-orange-600', showDot: true },
                                                                { label: payment.method || 'Credit Card', colorClass: 'bg-indigo-50 text-indigo-600 border border-indigo-100' }
                                                            ],
                                                            items: [
                                                                { title: payment.invoice ? `Rent for ${payment.invoice.month} ${payment.invoice.year}` : 'Rent Payment', subtitle: new Date(payment.createdAt).toLocaleDateString(), amount: `₹${payment.breakdown?.rent?.toLocaleString() || payment.amount?.toLocaleString() || 0}` },
                                                                ...(payment.breakdown?.maintenanceCharges ? [{ title: 'Maintenance Charges', subtitle: 'Monthly Due', amount: `₹${payment.breakdown.maintenanceCharges.toLocaleString()}` }] : []),
                                                                ...(payment.breakdown?.securityDeposit ? [{ title: 'Security Deposit', subtitle: 'One Time', amount: `₹${payment.breakdown.securityDeposit.toLocaleString()}` }] : [])
                                                            ],
                                                            breakdown: (() => {
                                                                const fee = Math.round((payment.amount || 0) * 0.02);
                                                                return [
                                                                    { label: 'Subtotal Base', value: `₹${(payment.amount || 0).toLocaleString()}` },
                                                                    { label: 'Platform Fee (2%)', value: `₹${fee.toLocaleString()}` }
                                                                ];
                                                            })(),
                                                            finalTotal: { label: 'Total Paid', value: `₹${(payment.amount || 0).toLocaleString()}` }
                                                        })}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-dark-200 hover:bg-dark-100 hover:text-dark-900 bg-dark-50 transition-all font-bold" 
                                                        title="Download Invoice"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                    </button>
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
                    title: "Rent Payment Statement",
                    summary: [
                        { label: "Total Transactions", value: summary?.totalTransactions || 0 },
                        { label: "Total Paid Found", value: `₹${(summary?.totalAmount || 0).toLocaleString()}` }
                    ],
                    columns: ["Date", "Property", "Transaction ID", "Amount", "Status"],
                    rows: payments.map(p => [
                        new Date(p.createdAt).toLocaleDateString(),
                        p.property?.title || 'Unknown',
                        p.transactionId,
                        `₹${(p.amount || 0).toLocaleString()}`,
                        p.status || 'completed'
                    ])
                }} 
            />
        </TenantLayout>
    );
}
