import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import Sidebar from '../components/common/Sidebar';
import { 
    LayoutDashboard, 
    Building2, 
    Users, 
    FileText, 
    CreditCard, 
    Newspaper,
    LogOut,
    ShieldAlert
} from 'lucide-react';

export default function AdminLayout({ children, breadcrumbs, isPublicPage }) {
    const { user } = useUser();
    const location = useLocation();
    const navigate = useNavigate();
    const isDemo = location.pathname.startsWith('/demo');
    
    // Initialize from localStorage to maintain state across page navigations without flicker
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('urbanrent_admin_sidebar');
        // Default to false if not set
        return saved === 'true';
    });

    const handleToggleSidebar = (state) => {
        setSidebarOpen(state);
        localStorage.setItem('urbanrent_admin_sidebar', state);
    };

    const handleLogout = () => {
        localStorage.removeItem('urbanrent_admin');
        navigate('/admin/login');
    };

    const navItems = [
        { label: 'Dashboard', path: isDemo ? '/demo/admin' : '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'Properties', path: isDemo ? '/demo/admin/properties' : '/admin/properties', icon: <Building2 size={20} /> },
        { label: 'Users', path: isDemo ? '/demo/admin/users' : '/admin/users', icon: <Users size={20} /> },
        { label: 'Applications', path: isDemo ? '/demo/admin/applications' : '/admin/applications', icon: <FileText size={20} /> },
        { label: 'Payments', path: isDemo ? '/demo/admin/payments' : '/admin/payments', icon: <CreditCard size={20} /> },
        { label: 'News & Blogs', path: isDemo ? '/demo/admin/blogs' : '/admin/blogs', icon: <Newspaper size={20} /> },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-dark-50 font-sans">
            <Sidebar 
                items={navItems}
                expanded={sidebarOpen}
                onToggle={handleToggleSidebar}
                brandName={<>Urban<span className="text-red-500">Rent</span></>}
                brandIcon={<ShieldAlert className="w-6 h-6 text-white" />}
                badge="Admin"
                isDemo={isDemo}
                brandLink={isDemo ? '/demo/admin' : '/admin/dashboard'}
                bottomContent={(expanded) => (
                    <button
                        onClick={handleLogout}
                        className={`flex items-center w-full h-12 rounded-2xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all ${expanded ? 'px-4 justify-start' : 'justify-center'}`}
                        title="Logout"
                    >
                        <LogOut size={20} className="flex-shrink-0" />
                        {expanded && <span className="ml-3 font-semibold text-sm">Logout</span>}
                    </button>
                )}
            />

            <div className={`flex-1 overflow-y-auto custom-scrollbar flex flex-col min-w-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pr-4 ${sidebarOpen ? 'ml-[288px]' : 'ml-[112px]'}`}>
                
                {/* Floating Header */}
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
                                    Welcome back, <span className="text-red-600">Admin</span>
                                </div>
                            )}

                            {/* Top Right Actions */}
                            <div className="flex items-center gap-4 ml-auto sm:ml-0">
                                <span className="hidden sm:inline-block px-3 py-1 bg-red-50 text-red-700 rounded-lg text-[10px] font-black uppercase tracking-wider border border-red-200">
                                    Admin Profile
                                </span>
                                <div className="flex items-center gap-2">
                                    {/* Placeholder for NotificationDropdown and ChatWidget */}
                                    {/* You would import and use these components here */}
                                    {/* <NotificationDropdown /> */}
                                    {/* <ChatWidget /> */}
                                </div>
                            </div>
                        </header>
                    </div>
                )}
                {/* Main Content */}
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
