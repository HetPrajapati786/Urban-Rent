import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { apiGet, apiDelete, apiPatch, apiPost } from '../../utils/api';

const ROLE_TABS = [
    { key: 'all', label: 'All Users' },
    { key: 'manager', label: 'Managers' },
    { key: 'tenant', label: 'Tenants' },
];

const ROLE_BADGE = {
    manager: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    tenant: 'bg-blue-50 text-blue-700 border-blue-200',
    admin: 'bg-red-50 text-red-700 border-red-200',
};

const REQUEST_STATUS_BADGE = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
};

export default function AdminUsers() {
    const location = useLocation();
    const isDemo = location.pathname.startsWith('/demo');

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    
    // View mode: 'users' | 'requests'
    const [viewMode, setViewMode] = useState('users');
    const [reactivationRequests, setReactivationRequests] = useState([]);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [requestFilter, setRequestFilter] = useState('pending');
    
    // Modal state
    const [modal, setModal] = useState({ open: false, type: '', user: null, error: '' });
    const [suspendReason, setSuspendReason] = useState('');

    // Reactivation request modal
    const [requestModal, setRequestModal] = useState({ open: false, request: null, action: '', response: '', error: '' });

    const openModal = (type, user) => {
        setModal({ open: true, type, user, error: '' });
        setSuspendReason('');
    };
    const closeModal = () => {
        if (!actionLoading) {
            setModal({ open: false, type: '', user: null, error: '' });
            setSuspendReason('');
        }
    };

    const handleConfirmAction = async () => {
        const { type, user } = modal;
        if (!user) return;
        
        setActionLoading(true);
        try {
            if (type === 'delete') {
                await apiDelete(`/admin/users/${user._id}`);
                fetchUsers();
                closeModal();
            } else if (type === 'status') {
                const body = {};
                if (user.isActive && suspendReason.trim()) {
                    body.reason = suspendReason.trim();
                }
                await apiPatch(`/admin/users/${user._id}/status`, body);
                fetchUsers();
                closeModal();
            } else if (type === 'login') {
                // Notify the user and force-logout their session first
                try {
                    await apiPost(`/admin/users/${user._id}/impersonate`);
                } catch (impErr) {
                    // Continue even if notification fails (user might be offline)
                    console.warn('Impersonation notification failed:', impErr.message);
                }

                localStorage.setItem('urbanrent_impersonate', user.clerkId);
                localStorage.setItem('urbanrent_impersonate_data', JSON.stringify({
                    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User',
                    avatar: user.avatar || '',
                    role: user.role || ''
                }));
                let target = '';
                if (user.role === 'tenant') {
                    target = isDemo ? '/demo/tenant/dashboard' : '/tenant/dashboard';
                } else {
                    target = isDemo ? '/demo/manager/dashboard' : '/manager/dashboard';
                }
                window.open(target, '_blank');
                closeModal();
            }
        } catch (err) {
            setModal(prev => ({ ...prev, error: err.message || 'Operation failed' }));
        } finally {
            setActionLoading(false);
        }
    };

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('role', activeTab);
            if (search) params.set('search', search);
            params.set('limit', '50');
            const data = await apiGet(`/admin/users?${params.toString()}`);
            setUsers(data.users || []);
        } catch (err) {
            console.error('Fetch users error:', err);
        } finally {
            setLoading(false);
        }
    }, [activeTab, search]);

    const fetchReactivationRequests = useCallback(async () => {
        try {
            setRequestsLoading(true);
            const data = await apiGet(`/admin/reactivation-requests?status=${requestFilter}`);
            setReactivationRequests(data.requests || []);
        } catch (err) {
            console.error('Fetch reactivation requests error:', err);
        } finally {
            setRequestsLoading(false);
        }
    }, [requestFilter]);

    useEffect(() => {
        if (viewMode === 'users') {
            fetchUsers();
        } else {
            fetchReactivationRequests();
        }
    }, [viewMode, fetchUsers, fetchReactivationRequests]);

    const handleReactivationAction = async () => {
        const { request, action, response } = requestModal;
        if (!request || !action) return;

        setActionLoading(true);
        try {
            await apiPatch(`/admin/reactivation-requests/${request.userId}/${request._id}`, {
                action,
                response: response.trim(),
            });
            fetchReactivationRequests();
            setRequestModal({ open: false, request: null, action: '', response: '', error: '' });
        } catch (err) {
            setRequestModal(prev => ({ ...prev, error: err.message || 'Operation failed' }));
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <AdminLayout
            breadcrumbs={[
                { label: 'Dashboard', href: isDemo ? '/demo/admin' : '/admin/dashboard' },
                { label: 'Users' },
            ]}
        >
            <div className="flex flex-col h-full min-h-0 gap-4">
                {/* Header */}
                <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-dark-900">User Management</h1>
                        <p className="text-dark-400 text-sm mt-0.5">View all registered users on the platform</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-dark-50 rounded-xl p-1 border border-dark-100">
                            <button
                                onClick={() => setViewMode('users')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'users' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}
                            >
                                Users
                            </button>
                            <button
                                onClick={() => setViewMode('requests')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${viewMode === 'requests' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}
                            >
                                Reactivation Requests
                            </button>
                        </div>
                        {viewMode === 'users' && (
                            <div className="relative w-full sm:w-72">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-dark-200 rounded-xl text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {viewMode === 'users' ? (
                    <>
                        {/* Role Tabs */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                            {ROLE_TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${activeTab === tab.key
                                        ? 'bg-dark-900 text-white border-dark-900'
                                        : 'bg-white text-dark-500 border-dark-100 hover:border-dark-300'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Users Table */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                        <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="w-10 h-10 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
                                </div>
                            ) : users.length === 0 ? (
                                <div className="py-16 text-center">
                                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-dark-50 flex items-center justify-center"><svg className="w-6 h-6 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                                    <p className="text-dark-500 font-medium">No users found</p>
                                </div>
                            ) : (
                                <>
                                    {/* Table Header */}
                                    <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-dark-50 border-b border-dark-100 text-[10px] font-bold text-dark-400 uppercase tracking-widest">
                                        <div className="col-span-3">User</div>
                                        <div className="col-span-2">Email</div>
                                        <div className="col-span-1">Role</div>
                                        <div className="col-span-1">Status</div>
                                        <div className="col-span-2">Joined</div>
                                        <div className="col-span-3 text-right">Actions</div>
                                    </div>

                                    {/* Rows */}
                                    <div className="divide-y divide-dark-50">
                                        {users.map((user) => (
                                            <div key={user._id} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 items-center hover:bg-dark-50/50 transition-colors">
                                                {/* User Info */}
                                                <div className="col-span-3 flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-dark-100 flex-shrink-0 flex items-center justify-center">
                                                        {user.avatar ? (
                                                            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-dark-400 font-bold text-sm">
                                                                {(user.firstName?.[0] || '?').toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-dark-900 text-sm truncate">
                                                            {user.firstName} {user.lastName}
                                                        </h3>
                                                        {user.phone && (
                                                            <p className="text-dark-400 text-[10px]">{user.phone}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Email */}
                                                <div className="col-span-2">
                                                    <p className="text-dark-600 text-[11px] truncate" title={user.email}>{user.email}</p>
                                                </div>

                                                {/* Role */}
                                                <div className="col-span-1">
                                                    <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${ROLE_BADGE[user.role] || ROLE_BADGE.tenant}`}>
                                                        {user.role}
                                                    </span>
                                                    {user.role === 'manager' && user.propertyCount !== undefined && (
                                                        <p className="text-dark-400 text-[10px] mt-0.5">{user.propertyCount} listings</p>
                                                    )}
                                                </div>

                                                {/* Status */}
                                                <div className="col-span-1">
                                                    <span className={`inline-block w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                    <span className="text-[10px] text-dark-500 ml-1">{user.isActive ? 'Active' : 'Suspended'}</span>
                                                    {!user.isActive && user.suspendedAt && (
                                                        <p className="text-[9px] text-red-400 mt-0.5">
                                                            Since {new Date(user.suspendedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Joined */}
                                                <div className="col-span-2">
                                                    <p className="text-dark-500 text-xs">
                                                        {new Date(user.createdAt).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </p>
                                                </div>

                                                {/* Actions */}
                                                <div className="col-span-3 text-right flex items-center justify-end gap-1.5 flex-wrap">
                                                    {user.role !== 'admin' && (
                                                        <>
                                                            <button
                                                                onClick={() => openModal('login', user)}
                                                                className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-all"
                                                                title="Login as User"
                                                            >
                                                                Login As
                                                            </button>
                                                            
                                                            <button
                                                                onClick={() => openModal('status', user)}
                                                                className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                                                                    user.isActive 
                                                                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                                }`}
                                                            >
                                                                {user.isActive ? 'Suspend' : 'Activate'}
                                                            </button>

                                                            <button
                                                                onClick={() => openModal('delete', user)}
                                                                className="px-2.5 py-1.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-all"
                                                            >
                                                                Delete
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        </div>
                    </>
                ) : (
                    /* Reactivation Requests View */
                    <>
                        {/* Filter Tabs */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                            {[
                                { key: 'pending', label: 'Pending' },
                                { key: 'approved', label: 'Approved' },
                                { key: 'rejected', label: 'Rejected' },
                                { key: 'all', label: 'All' },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setRequestFilter(tab.key)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${requestFilter === tab.key
                                        ? 'bg-dark-900 text-white border-dark-900'
                                        : 'bg-white text-dark-500 border-dark-100 hover:border-dark-300'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Requests List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                            <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
                                {requestsLoading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <div className="w-10 h-10 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
                                    </div>
                                ) : reactivationRequests.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-dark-50 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-dark-500 font-medium">No reactivation requests found</p>
                                        <p className="text-dark-400 text-xs mt-1">Requests from suspended users will appear here</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-dark-50">
                                        {reactivationRequests.map((request) => (
                                            <div key={request._id} className="p-4 hover:bg-dark-50/50 transition-colors">
                                                <div className="flex items-start gap-4">
                                                    {/* Avatar */}
                                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-dark-100 flex-shrink-0 flex items-center justify-center">
                                                        {request.userAvatar ? (
                                                            <img src={request.userAvatar} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-dark-400 font-bold text-sm">
                                                                {(request.userName?.[0] || '?').toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <h4 className="font-bold text-dark-900 text-sm">{request.userName}</h4>
                                                            <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${ROLE_BADGE[request.userRole] || ROLE_BADGE.tenant}`}>
                                                                {request.userRole}
                                                            </span>
                                                            <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${REQUEST_STATUS_BADGE[request.status]}`}>
                                                                {request.status}
                                                            </span>
                                                        </div>
                                                        
                                                        <p className="text-[11px] text-dark-500 mb-2">{request.userEmail}</p>

                                                        {/* Suspension reason */}
                                                        <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 mb-2">
                                                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-0.5">Suspension Reason</p>
                                                            <p className="text-xs text-red-700 font-medium">{request.suspendedReason || 'No reason provided'}</p>
                                                        </div>

                                                        {/* User's request message */}
                                                        <div className="bg-dark-50 border border-dark-100 rounded-lg p-2.5 mb-2">
                                                            <p className="text-[10px] font-bold text-dark-500 uppercase tracking-wider mb-0.5">User Message</p>
                                                            <p className="text-xs text-dark-700 font-medium leading-relaxed">{request.message}</p>
                                                        </div>

                                                        {/* Admin response if exists */}
                                                        {request.adminResponse && (
                                                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 mb-2">
                                                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Admin Response</p>
                                                                <p className="text-xs text-blue-700 font-medium">{request.adminResponse}</p>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-3 text-[10px] text-dark-400 font-medium">
                                                            <span>Requested: {new Date(request.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                            {request.respondedAt && (
                                                                <span>Responded: {new Date(request.respondedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    {request.status === 'pending' && (
                                                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                                                            <button
                                                                onClick={() => setRequestModal({ open: true, request, action: 'approve', response: '', error: '' })}
                                                                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-all"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => setRequestModal({ open: true, request, action: 'reject', response: '', error: '' })}
                                                                className="px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-all"
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* User Action Modal */}
            {modal.open && modal.user && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={closeModal}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                                modal.type === 'delete' ? 'bg-red-100 text-red-600' :
                                modal.type === 'login' ? 'bg-indigo-100 text-indigo-600' :
                                'bg-amber-100 text-amber-600'
                            }`}>
                                {modal.type === 'delete' ? (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                ) : modal.type === 'login' ? (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-dark-900 leading-tight">
                                    {modal.type === 'delete' ? 'Delete User' : modal.type === 'login' ? 'Impersonate User' : `${modal.user.isActive ? 'Suspend' : 'Activate'} User`}
                                </h3>
                                <p className="text-sm font-bold text-dark-600">{modal.user.firstName} {modal.user.lastName}</p>
                            </div>
                        </div>
                        
                        <div className="text-sm text-dark-500 mb-4 bg-dark-50 p-4 rounded-xl border border-dark-100 leading-relaxed font-medium">
                            {modal.type === 'delete' ? (
                                <>This will permanently delete <span className="text-dark-900 font-bold">{modal.user.email}</span> and immediately revoke all login access. The user will be force-logged out of any active session.{modal.user.role === 'manager' && ' All their listed properties will receive a 7-day vacate notice. Affected tenants will be notified.'} If they register again with the same email, a completely new account will be created. This cannot be undone.</>
                            ) : modal.type === 'login' ? (
                                <>A new window will open securely logging you into the {modal.user.role} dashboard as <span className="text-dark-900 font-bold">{modal.user.firstName}</span>. The user's current active session will be ended automatically and they will be notified. All actions taken will be recorded under your admin session.</>
                            ) : modal.user.isActive ? (
                                <>Are you sure you want to suspend this user? They will not be able to log in or access features. Their properties will receive a 7-day notice.</>
                            ) : (
                                <>Are you sure you want to reactivate this user? They will regain full access to the platform immediately. Suspension notices on their properties will be cleared.</>
                            )}
                        </div>

                        {/* Suspension Reason Input */}
                        {modal.type === 'status' && modal.user.isActive && (
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-dark-700 mb-1.5">Reason for Suspension</label>
                                <textarea
                                    value={suspendReason}
                                    onChange={(e) => setSuspendReason(e.target.value)}
                                    placeholder="Enter the reason for suspending this user (will be shown to the user)..."
                                    rows={3}
                                    className="w-full px-3 py-2 bg-white border border-dark-200 rounded-xl text-sm text-dark-900 placeholder-dark-400 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 resize-none font-medium"
                                />
                            </div>
                        )}

                        {modal.error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-200">
                                {modal.error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={closeModal}
                                disabled={actionLoading}
                                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-dark-600 bg-white border border-dark-200 hover:bg-dark-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                disabled={actionLoading}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 ${
                                    modal.type === 'delete' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' :
                                    modal.type === 'login' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' :
                                    'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                                }`}
                            >
                                {actionLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : modal.type === 'delete' ? 'Delete' : modal.type === 'login' ? 'Login As' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reactivation Request Action Modal */}
            {requestModal.open && requestModal.request && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => !actionLoading && setRequestModal({ open: false, request: null, action: '', response: '', error: '' })}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                                requestModal.action === 'approve' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                            }`}>
                                {requestModal.action === 'approve' ? (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-dark-900 leading-tight">
                                    {requestModal.action === 'approve' ? 'Approve Reactivation' : 'Reject Reactivation'}
                                </h3>
                                <p className="text-sm font-bold text-dark-600">{requestModal.request.userName}</p>
                            </div>
                        </div>

                        <div className="text-sm text-dark-500 mb-4 bg-dark-50 p-4 rounded-xl border border-dark-100 leading-relaxed font-medium">
                            {requestModal.action === 'approve' 
                                ? 'This will reactivate the user\'s account and restore full platform access. Any suspended properties will be reactivated.'
                                : 'This will deny the reactivation request. The user will remain suspended and can submit a new request later.'
                            }
                        </div>

                        {/* Response message */}
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-dark-700 mb-1.5">
                                Response to User {requestModal.action === 'reject' ? '(Recommended)' : '(Optional)'}
                            </label>
                            <textarea
                                value={requestModal.response}
                                onChange={(e) => setRequestModal(prev => ({ ...prev, response: e.target.value }))}
                                placeholder={requestModal.action === 'approve' ? 'Any message for the user...' : 'Explain why the request was denied...'}
                                rows={3}
                                className="w-full px-3 py-2 bg-white border border-dark-200 rounded-xl text-sm text-dark-900 placeholder-dark-400 outline-none focus:border-dark-400 focus:ring-1 focus:ring-dark-400/20 resize-none font-medium"
                            />
                        </div>

                        {requestModal.error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-200">
                                {requestModal.error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => !actionLoading && setRequestModal({ open: false, request: null, action: '', response: '', error: '' })}
                                disabled={actionLoading}
                                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-dark-600 bg-white border border-dark-200 hover:bg-dark-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReactivationAction}
                                disabled={actionLoading}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 ${
                                    requestModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                                }`}
                            >
                                {actionLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : requestModal.action === 'approve' ? 'Approve' : 'Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
