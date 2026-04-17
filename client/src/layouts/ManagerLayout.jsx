import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserButton, SignedIn, useUser } from '@clerk/clerk-react';
import { isImpersonating, clearImpersonation } from '../utils/impersonation';
import NotificationDropdown from '../components/common/NotificationDropdown';
import ChatWidget from '../components/ChatWidget';
import Sidebar from '../components/common/Sidebar';
import { 
    LayoutDashboard, 
    Building2, 
    PlusSquare, 
    Banknote, 
    FileText, 
    Coins, 
    Newspaper,
    Briefcase
} from 'lucide-react';

export default function ManagerLayout({ children, breadcrumbs, isPublicPage }) {
    const location = useLocation();
    const isDemo = location.pathname.startsWith('/demo');
    const { user } = useUser();
    
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('urbanrent_manager_sidebar');
        return saved === 'true';
    });

    const handleToggleSidebar = (state) => {
        setSidebarOpen(state);
        localStorage.setItem('urbanrent_manager_sidebar', state);
    };

    const isImpersonating_ = isImpersonating();
    const impersonatedData = isImpersonating_ ? JSON.parse(sessionStorage.getItem('urbanrent_impersonate_data') || '{}') : null;

    const resolvePath = (path) => isDemo ? `/demo${path}` : path;

    const navItems = [
        { group: 'Main Menu' },
        { label: 'Home', path: resolvePath('/manager/dashboard'), icon: <LayoutDashboard size={20} /> },
        { label: 'Properties', path: resolvePath('/manager/properties'), icon: <Building2 size={20} /> },
        { label: 'Add Property', path: resolvePath('/manager/add-property'), icon: <PlusSquare size={20} /> },
        { label: 'Earnings', path: resolvePath('/manager/earnings'), icon: <Banknote size={20} /> },
        { divider: true },
        { group: 'More' },
        { label: 'Applications', path: resolvePath('/manager/applications'), icon: <FileText size={20} /> },
        { label: 'Credits', path: resolvePath('/manager/credits'), icon: <Coins size={20} /> },
        { label: 'News & Blogs', path: resolvePath('/manager/blogs'), icon: <Newspaper size={20} /> },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-dark-50 font-sans">
            {isImpersonating_ && (
                <div className="fixed top-0 left-0 right-0 z-[60] bg-indigo-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold shadow-md">
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Admin Impersonation Mode (Manager)
                    </span>
                    <button 
                        onClick={() => {
                            clearImpersonation();
                            window.location.href = isDemo ? '/demo/admin/users' : '/admin/users';
                        }}
                        className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md transition-colors"
                    >
                        Exit Impersonation
                    </button>
                </div>
            )}

            <Sidebar 
                items={navItems}
                expanded={sidebarOpen}
                onToggle={handleToggleSidebar}
                brandName={<>Urban<span className="text-blue-500">Rent</span></>}
                brandIcon={<Briefcase className="w-5 h-5 text-white" />}
                badge="Manager"
                isDemo={isDemo}
                brandLink={isDemo ? '/demo/manager' : '/manager/dashboard'}
                bottomContent={(expanded) => (
                    isImpersonating_ ? (
                        <div className={`flex items-center gap-3 ${expanded ? 'px-2' : 'justify-center'}`} title="Impersonating">
                            <div className={`rounded-full border border-indigo-500 overflow-hidden flex-shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.5)] bg-dark-50 ${expanded ? 'w-10 h-10' : 'w-10 h-10'}`}>
                                {impersonatedData?.avatar ? (
                                    <img src={impersonatedData.avatar} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-indigo-400 font-bold text-sm bg-indigo-500/10">
                                        {(impersonatedData?.name?.[0] || 'I').toUpperCase()}
                                    </div>
                                )}
                            </div>
                            {expanded && (
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">Impersonating</span>
                                    <span className="text-sm font-bold text-white truncate max-w-[120px]">
                                        {impersonatedData?.name || 'User'}
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <SignedIn>
                            <div className={`flex items-center gap-3 ${expanded ? 'px-2' : 'justify-center'}`}>
                                <UserButton
                                    afterSignOutUrl="/"
                                    appearance={{
                                        elements: {
                                            avatarBox: expanded ? 'w-10 h-10 border border-dark-200 shadow-sm' : 'w-10 h-10 border border-dark-200 shadow-sm',
                                        },
                                    }}
                                />
                                {expanded && (
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-xs font-bold tracking-wider text-white/50 uppercase">Account</span>
                                        <span className="text-sm font-semibold text-white truncate max-w-[120px]">
                                            {user ? user.firstName || user.fullName : 'Manager Profile'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </SignedIn>
                    )
                )}
            />

            <div className={`flex-1 overflow-y-auto custom-scrollbar flex flex-col min-w-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pr-4 ${sidebarOpen ? 'ml-[288px]' : 'ml-[112px]'} ${isImpersonating_ ? 'mt-8' : ''}`}>
                {/* Floating Header - only show in dashboard, not on landing/public pages */}
                {!isPublicPage && (
                    <div className="flex-shrink-0 pt-4 pb-2 z-40">
                        <header className="bg-white shadow-sm border border-dark-100 rounded-xl px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                            {/* Breadcrumbs or Greeting */}
                            {breadcrumbs ? (
                                <nav className="flex items-center gap-2 text-sm flex-shrink-0 w-full sm:w-auto overflow-x-auto no-scrollbar">
                                    {breadcrumbs.map((crumb, index) => (
                                        <span key={index} className="flex items-center gap-2 whitespace-nowrap">
                                            {index > 0 && <span className="text-dark-300">/</span>}
                                            {crumb.href ? (
                                                <Link to={crumb.href} className="text-dark-500 hover:text-dark-900 font-medium transition-colors">
                                                    {crumb.label}
                                                </Link>
                                            ) : (
                                                <span className="text-dark-900 font-bold">{crumb.label}</span>
                                            )}
                                        </span>
                                    ))}
                                </nav>
                            ) : (
                                <div className="flex-shrink-0 font-bold text-dark-900 flex items-center gap-2 text-lg">
                                    Welcome back, {isImpersonating_ && impersonatedData?.name ? (
                                        <span className="text-indigo-600">{impersonatedData.name.split(' ')[0]}</span>
                                    ) : user?.firstName ? (
                                        <span className="text-blue-600">{user.firstName}</span>
                                    ) : 'Manager'}
                                </div>
                            )}

                            {/* Right Actions */}
                            <div className="flex items-center gap-4 ml-auto sm:ml-0">
                                {isImpersonating_ && (
                                    <span className="hidden sm:inline-block px-3 py-1 border rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-50 border-indigo-200 text-indigo-700">
                                        Impersonating Manager
                                    </span>
                                )}
                                <div className="flex items-center gap-2">
                                    <NotificationDropdown />
                                    <ChatWidget />
                                </div>
                            </div>
                        </header>
                    </div>
                )}

                {/* Page Content */}
                {isPublicPage ? (
                    <main>{children}</main>
                ) : (
                    <main className="flex-1 w-full flex flex-col min-h-0 min-w-0 py-4 pb-8">
                        {children}
                    </main>
                )}
            </div>
        </div>
    );
}
