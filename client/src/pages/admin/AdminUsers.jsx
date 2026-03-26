import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { apiGet, apiDelete, apiPatch } from '../../utils/api';

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

export default function AdminUsers() {
    const location = useLocation();
    const isDemo = location.pathname.startsWith('/demo');

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [search, setSearch] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Delete ${user.firstName} ${user.lastName}? ${user.role === 'manager' ? 'All their properties will also be deleted.' : ''} This cannot be undone.`)) return;
        setDeletingId(user._id);
        try {
            await apiDelete(`/admin/users/${user._id}`);
            fetchUsers();
        } catch (err) {
            alert('Failed: ' + err.message);
        } finally {
            setDeletingId(null);
        }
    };

    const handleLoginAs = (user) => {
        if (!window.confirm(`Login as ${user.firstName} (${user.role})? You will be navigated to their dashboard.`)) return;
        localStorage.setItem('urbanrent_impersonate', user.clerkId);
        
        let target = '';
        if (user.role === 'tenant') {
            target = isDemo ? '/demo/tenant' : '/tenant/properties';
        } else {
            target = isDemo ? '/demo/manager' : '/manager/dashboard';
        }
        window.open(target, '_blank');
    };

    const handleToggleStatus = async (user) => {
        const action = user.isActive ? 'Suspend' : 'Activate';
        if (!window.confirm(`${action} user ${user.firstName}?`)) return;
        try {
            await apiPatch(`/admin/users/${user._id}/status`);
            fetchUsers();
        } catch (err) {
            alert('Failed: ' + err.message);
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

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

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
                </div>

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
                                            <span className="text-[10px] text-dark-500 ml-1">{user.isActive ? 'Active' : 'Inactive'}</span>
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
                                                        onClick={() => handleLoginAs(user)}
                                                        className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-all"
                                                        title="Login as User"
                                                    >
                                                        Login As
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => handleToggleStatus(user)}
                                                        className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                                                            user.isActive 
                                                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                        }`}
                                                    >
                                                        {user.isActive ? 'Suspend' : 'Activate'}
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteUser(user)}
                                                        disabled={deletingId === user._id}
                                                        className="px-2.5 py-1.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50"
                                                    >
                                                        {deletingId === user._id ? '...' : 'Delete'}
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
            </div>
        </AdminLayout>
    );
}
