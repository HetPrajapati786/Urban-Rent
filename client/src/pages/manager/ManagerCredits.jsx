import { useState, useEffect } from 'react';
import ManagerLayout from '../../layouts/ManagerLayout';
import { apiGet, apiPost } from '../../utils/api';
import InvoiceModal from '../../components/common/InvoiceModal';
import StatementModal from '../../components/common/StatementModal';

const loadRazorpayScript = () =>
    new Promise((resolve) => {
        const id = 'razorpay-checkout-js';
        if (document.getElementById(id)) return resolve(true);
        const s = document.createElement('script');
        s.id = id;
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.body.appendChild(s);
    });

const PACKAGES = [
    { key: 'starter', credits: 10, price: 99, label: '10 Credits', theme: 'light', buttonText: 'Buy 10 Credits', features: ['Buy up to 10 property boosts', 'Basic support', 'Standard visibility', 'Purchase receipt access'] },
    { key: 'popular', credits: 30, price: 249, label: '30 Credits', theme: 'dark', buttonText: 'Buy 30 Credits', features: ['Buy up to 30 property boosts', 'Priority customer support', 'Enhanced search visibility', 'Detailed analytics access', 'Instant activation'] },
    { key: 'premium', credits: 75, price: 499, label: '75 Credits', theme: 'light', buttonText: 'Buy 75 Credits', features: ['Buy up to 75 property boosts', 'Dedicated account manager', 'Maximum search visibility', 'API access available', 'Custom workflow integration'] },
];

export default function ManagerCredits() {
    const isDemo = window.location.pathname.startsWith('/demo');
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [purchasingPkg, setPurchasingPkg] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showStatement, setShowStatement] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const balRes = await apiGet('/credits/balance');
                setBalance(balRes.credits || 0);
            } catch (err) { console.error('Error fetching balance:', err) }
            
            try {
                const histRes = await apiGet('/credits/history');
                setHistory(histRes.history || []);
            } catch (err) { console.error('Error fetching history:', err) }
            
            setLoading(false);
        };
        fetchData();
    }, []);

    const handlePurchase = async (pkgKey) => {
        setPurchasingPkg(pkgKey);
        try {
            const pkgData = PACKAGES.find(p => p.key === pkgKey);
            const orderRes = await apiPost('/payments/razorpay/order', {
                amount: pkgData.price,
                receipt: `credit_${Date.now()}`,
            });

            const loaded = await loadRazorpayScript();
            if (!loaded) throw new Error('Razorpay SDK failed to load.');

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXXXXXXXXXX',
                amount: orderRes.amount,
                currency: orderRes.currency,
                name: 'UrbanRent',
                description: `Purchase ${pkgData.label}`,
                order_id: orderRes.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await apiPost('/credits/purchase', {
                            package: pkgKey,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        setBalance(verifyRes.totalCredits);
                        const histRes = await apiGet('/credits/history');
                        setHistory(histRes.history || []);
                        alert('Purchase Successful!');
                    } catch (err) {
                        alert('Payment verification failed: ' + err.message);
                    }
                },
                theme: { color: pkgData.theme === 'dark' ? '#000000' : '#4f46e5' },
                modal: { ondismiss: () => setPurchasingPkg(null) }
            };
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (res){ alert('Payment failed'); setPurchasingPkg(null); });
            rzp.open();
        } catch (err) {
            alert('Purchase failed: ' + err.message);
            setPurchasingPkg(null);
        }
    };

    return (
        <ManagerLayout>
            <div className="max-w-[1200px] mx-auto w-full flex flex-col h-[calc(100vh-8rem)] min-h-0">
                {/* Clean Topbar Header directly in page */}
                <div className="flex-shrink-0 flex items-center justify-between pb-6 border-b border-dark-100 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-dark-900 tracking-tight">Billing &amp; Subscription</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-dark-500 mr-2">Current Balance: <strong className="text-dark-900">{balance} Credits</strong></span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pb-10 pr-2 space-y-8">
                    <p className="text-dark-500 text-sm">Keep track of your subscription details, update your billing information, and control your account's payment</p>

                    {/* Pricing Grid */}
                    <div className="grid lg:grid-cols-3 gap-6">
                        {PACKAGES.map(pkg => (
                            <div key={pkg.key} className={`rounded-2xl p-5 border hover:-translate-y-1 transition-transform duration-300 ${
                                pkg.theme === 'dark' 
                                ? 'bg-gradient-to-br from-[#18181b] to-[#09090b] text-white border-dark-900 shadow-2xl shadow-dark-900/40 relative' 
                                : 'bg-white text-dark-900 border-dark-100 shadow-xl shadow-dark-100/50'
                            }`}>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold tracking-tight">{pkg.label}</h3>
                                    {pkg.theme === 'dark' ? (
                                        <span className="px-3 py-1 bg-amber-500 text-[#09090b] text-[10px] font-black uppercase rounded-full tracking-wider shadow-sm">Pro</span>
                                    ) : pkg.key === 'premium' ? (
                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-full border border-blue-100 tracking-wider">Advance</span>
                                    ) : (
                                        <span className="px-3 py-1 bg-dark-50 text-dark-600 text-[10px] font-black uppercase rounded-full border border-dark-100 tracking-wider">Free</span>
                                    )}
                                </div>
                                <div className="mb-6">
                                    <span className="text-3xl font-black tracking-tight">₹{pkg.price.toLocaleString()}</span>
                                    <span className={`text-sm ml-1 font-medium ${pkg.theme === 'dark' ? 'text-dark-400' : 'text-dark-500'}`}>/one-time</span>
                                </div>
                                
                                <button 
                                    onClick={() => handlePurchase(pkg.key)}
                                    disabled={purchasingPkg === pkg.key}
                                    className={`w-full py-3.5 rounded-xl font-bold text-sm mb-8 transition-all ${
                                        pkg.theme === 'dark'
                                        ? 'bg-white text-[#09090b] hover:bg-dark-50 shadow-md'
                                        : 'bg-dark-900 text-white hover:bg-dark-800 shadow-md shadow-dark-900/10'
                                    }`}
                                >
                                    {purchasingPkg === pkg.key ? 'Processing...' : pkg.buttonText}
                                </button>

                                <ul className="space-y-4">
                                    {pkg.features.map((feat, i) => (
                                        <li key={i} className={`flex items-start text-sm font-medium ${pkg.theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                                            <svg className={`w-5 h-5 mr-3 flex-shrink-0 ${pkg.theme === 'dark' ? 'text-white' : 'text-dark-900'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path></svg>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Billing History Section */}
                    <div className="bg-white rounded-2xl border border-dark-100 shadow-sm p-6 overflow-hidden">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                            <h2 className="text-xl font-bold text-dark-900 tracking-tight">Billing History</h2>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <input 
                                        type="text" 
                                        placeholder="Search History..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 border border-dark-200 rounded-lg text-sm font-medium focus:outline-none focus:border-dark-400 focus:ring-1 focus:ring-dark-400 transition-all placeholder:font-normal" 
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
                                        <th className="font-bold py-3 px-4 rounded-tl-lg tracking-wider text-[11px] uppercase">Plan Name</th>
                                        <th className="font-bold py-3 px-4 tracking-wider text-[11px] uppercase">Amounts</th>
                                        <th className="font-bold py-3 px-4 tracking-wider text-[11px] uppercase">Purchase Date</th>
                                        <th className="font-bold py-3 px-4 tracking-wider text-[11px] uppercase">End Date</th>
                                        <th className="font-bold py-3 px-4 tracking-wider text-[11px] uppercase">Status</th>
                                        <th className="font-bold py-3 px-4 rounded-tr-lg text-right tracking-wider text-[11px] uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-50/50 text-dark-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="py-12 text-center text-dark-400 font-medium">
                                                <div className="w-5 h-5 border-2 border-dark-200 border-t-dark-600 rounded-full animate-spin mx-auto mb-2" />
                                                Loading history...
                                            </td>
                                        </tr>
                                    ) : history.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-12 text-center text-dark-400 font-medium">
                                                No billing history found
                                            </td>
                                        </tr>
                                    ) : history.filter(h => h.package?.toLowerCase().includes(searchQuery.toLowerCase()) || (h.amount+'').includes(searchQuery)).map((item, idx) => {
                                        let planName = '30 Credits';
                                        let bgStyle = 'blue';
                                        if (item.amount === 99) { planName = '10 Credits'; bgStyle = 'blue'; }
                                        if (item.amount === 499) { planName = '75 Credits'; bgStyle = 'amber'; }

                                        return (
                                        <tr key={item._id || idx} className="hover:bg-dark-50/30 transition-colors group">
                                            <td className="py-3 px-4 font-bold text-dark-900 border-l-[3px] border-transparent hover:border-dark-900">{planName} 
                                                <span className="font-medium text-dark-400 ml-1.5">- {item.description?.match(/(\d+) credits/)?.[1] || 0} credits</span>
                                            </td>
                                            <td className="py-3 px-4 font-medium text-dark-800">₹{(item.amount || 0).toLocaleString()}</td>
                                            <td className="py-3 px-4 font-medium text-dark-700">{new Date(item.createdAt).toLocaleDateString('en-CA')}</td>
                                            <td className="py-3 px-4 font-medium text-dark-500">N/A</td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center gap-1.5 text-${bgStyle}-700 font-bold text-xs bg-${bgStyle}-50 px-2.5 py-1 rounded-full border border-${bgStyle}-100`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full bg-${bgStyle}-500 shadow-sm`}></div> Success
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex justify-end gap-2 text-dark-400 transition-opacity">
                                                    <button 
                                                        onClick={() => setSelectedInvoice({
                                                            title: 'Payment Record',
                                                            companyLabel: 'Platform',
                                                            companyName: 'UrbanRent',
                                                            jobLabel: 'Purchase',
                                                            jobName: 'Credit Package Top-up',
                                                            status: [
                                                                { label: 'Success', colorClass: `bg-${bgStyle}-50 text-${bgStyle}-700`, dotClass: `bg-${bgStyle}-500`, showDot: true },
                                                            ],
                                                            items: [
                                                                { title: planName, subtitle: `${item.description?.match(/(\d+) credits/)?.[1] || 0} credits added to account`, amount: `₹${(item.amount || 0).toLocaleString()}` }
                                                            ],
                                                            breakdown: [
                                                                { label: 'Subtotal Base', value: `₹${(item.amount || 0).toLocaleString()}` },
                                                                { label: 'Platform Fee (0%)', value: '₹0' }
                                                            ],
                                                            finalTotal: { label: 'Take Home', value: `₹${(item.amount || 0).toLocaleString()}` }
                                                        })}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-dark-200 hover:bg-dark-100 hover:text-dark-900 bg-dark-50 transition-all font-bold" title="Download Invoice"
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
                    title: "Credit Purchases Statement",
                    summary: [
                        { label: "Total Top-ups", value: history.length },
                        { label: "Total Spent", value: `₹${history.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString()}` }
                    ],
                    columns: ["Date", "Description", "Transaction ID", "Amount", "Status"],
                    rows: history.map(item => [
                        new Date(item.createdAt).toLocaleDateString(),
                        item.description || 'Boost Package Top-up',
                        item._id ? item._id.substring(0, 15) : 'Unknown ID',
                        `₹${(item.amount || 0).toLocaleString()}`,
                        'completed'
                    ])
                }} 
            />
        </ManagerLayout>
    );
}
