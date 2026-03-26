import { useState } from 'react';
import ChatWidget from '../components/ChatWidget';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserButton, SignedIn, SignedOut, SignInButton, useUser } from '@clerk/clerk-react';
import NotificationDropdown from '../components/common/NotificationDropdown';
import Sidebar from '../components/common/Sidebar';
import { 
    LayoutDashboard, 
    Home, 
    Heart, 
    FileText, 
    Search,
    List,
    CreditCard,
    Newspaper,
    UserCircle2
} from 'lucide-react';

export default function TenantLayout({ children, breadcrumbs, searchValue, onSearchChange, searchPlaceholder, isPublicPage, hideSearch }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useUser();
    const [localQuery, setLocalQuery] = useState('');
    
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('urbanrent_tenant_sidebar');
        return saved === 'true';
    });

    const handleToggleSidebar = (state) => {
        setSidebarOpen(state);
        localStorage.setItem('urbanrent_tenant_sidebar', state);
    };

    const isDemo = location.pathname.startsWith('/demo');
    const isImpersonating = !!localStorage.getItem('urbanrent_impersonate');
    const resolvePath = (path) => isDemo ? `/demo${path}` : path;

    const navItems = [
        { group: 'Main Menu' },
        { label: 'Dashboard', path: resolvePath('/tenant/dashboard'), icon: <LayoutDashboard size={20} /> },
        { label: 'Properties', path: resolvePath('/tenant/home'), icon: <Home size={20} /> },
        { label: 'Favourites', path: resolvePath('/tenant/favourites'), icon: <Heart size={20} /> },
        { label: 'Applications', path: resolvePath('/tenant/applications'), icon: <FileText size={20} /> },
        { divider: true },
        { group: 'Discover' },
        { label: 'All Listings', path: resolvePath('/tenant/properties'), icon: <List size={20} /> },
        { label: 'Search', path: resolvePath('/tenant/search'), icon: <Search size={20} /> },
        { label: 'Payments', path: resolvePath('/tenant/payments'), icon: <CreditCard size={20} /> },
        { label: 'News & Blogs', path: resolvePath('/tenant/blogs'), icon: <Newspaper size={20} /> },
    ];

    const currentQuery = searchValue !== undefined ? searchValue : localQuery;

    const handleSearchNavigate = () => {
        if (!location.pathname.includes('/search')) {
            navigate(resolvePath(`/tenant/search?q=${encodeURIComponent(currentQuery)}`));
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-dark-50 font-sans">
            {isImpersonating && (
                <div className="fixed top-0 left-0 right-0 z-[60] bg-indigo-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold shadow-md">
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Admin Impersonation Mode (Tenant)
                    </span>
                    <button 
                        onClick={() => {
                            localStorage.removeItem('urbanrent_impersonate');
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
                brandName={<>Urban<span className="text-primary-500">Rent</span></>}
                brandIcon={<UserCircle2 className="w-6 h-6 text-white" />}
                badge="Tenant"
                isDemo={isDemo}
                brandLink={isDemo ? '/demo/tenant/dashboard' : '/tenant/dashboard'}
                bottomContent={(expanded) => (
                    <>
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
                                        <span className="text-sm font-semibold text-white truncate">
                                            {user ? user.firstName || user.fullName : 'Tenant Profile'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </SignedIn>
                        <SignedOut>
                            {expanded ? (
                                <SignInButton mode="modal">
                                    <button className="w-full py-2.5 rounded-xl text-sm font-bold bg-dark-900 text-white hover:bg-dark-800 transition-colors shadow-sm">
                                        Sign In
                                    </button>
                                </SignInButton>
                            ) : (
                                <SignInButton mode="modal">
                                    <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-dark-900 text-white hover:bg-dark-800 transition-colors shadow-sm mx-auto">
                                        <Search className="w-4 h-4" />
                                    </button>
                                </SignInButton>
                            )}
                        </SignedOut>
                    </>
                )}
            />

            <div className={`flex-1 overflow-y-auto custom-scrollbar flex flex-col min-w-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pr-4 ${sidebarOpen ? 'ml-[288px]' : 'ml-[112px]'} ${isImpersonating ? 'mt-8' : ''}`}>
                
                {/* Floating Header - only show in dashboard, not on landing/public pages */}
                {!isPublicPage && (
                    <div className="flex-shrink-0 pt-4 pb-2 z-40">
                        <header className="bg-white shadow-sm border border-dark-100 rounded-xl px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-4 w-full relative">
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
                                Welcome back, {user?.firstName ? (
                                    <span className="text-primary-600">{user.firstName}</span>
                                ) : 'Tenant'}
                            </div>
                        )}

                        {/* Top Right Actions: Search + Clerk/Notifications */}
                        <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto sm:overflow-visible no-scrollbar ml-auto sm:ml-0">
                            {/* Global Search */}
                            {!hideSearch && (
                                <div className="relative group w-full sm:w-72 flex-shrink-0">
                                    <Search 
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500 cursor-pointer group-hover:text-dark-800 transition-colors" 
                                        onClick={handleSearchNavigate}
                                    />
                                    <input
                                        type="text"
                                        placeholder={searchPlaceholder || 'Search Properties... (Press Enter)'}
                                        value={currentQuery}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (onSearchChange) onSearchChange(val);
                                            else setLocalQuery(val);
                                        }}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') handleSearchNavigate();
                                        }}
                                        className="w-full pl-10 pr-4 py-2 bg-dark-50 border border-dark-100 rounded-lg text-sm font-medium text-dark-900 placeholder-dark-400 outline-none transition-all duration-300 focus:bg-white focus:border-dark-300 focus:ring-1 focus:ring-dark-300"
                                    />
                                </div>
                            )}

                            {/* Icons and Tags */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <SignedIn>
                                    <span className="hidden sm:inline-block px-3 py-1 bg-primary-50 border border-primary-100 text-primary-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                    Tenant Profile
                                </span>
                                    <NotificationDropdown />
                                    <ChatWidget />
                                </SignedIn>
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
