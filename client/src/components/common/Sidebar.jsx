import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { SignInButton } from '@clerk/clerk-react';
import logoUrl from '../../assets/UrbanRent HD.png';

export default function Sidebar({ items, brandIcon, brandName, bottomContent, badge, isDemo, isImpersonating, expanded, onToggle, brandLink }) {
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');

    // Responsive: auto-collapse on small screens
    useEffect(() => {
        if (window.innerWidth < 1024 && expanded) {
            onToggle(false);
        }
        const handleResize = () => {
            if (window.innerWidth < 1024 && expanded) {
                onToggle(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [expanded, onToggle]);

    const isActive = (item) => {
        const currentPath = location.pathname;
        const targetPath = item.path;
        // Exact match for dashboard/home
        if (targetPath.endsWith('/dashboard') || targetPath.endsWith('/home')) {
            return currentPath === targetPath || currentPath === targetPath + '/';
        }
        return currentPath.startsWith(targetPath);
    };

    const isRestrictedDemo = isDemo && !isImpersonating;

    return (
        <aside 
            className={`fixed top-4 left-4 bottom-4 bg-[#0a0a0a] rounded-xl shadow-xl flex flex-col z-50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${expanded ? 'w-64' : 'w-20'}`}
        >
            {/* Header: Brand & Toggle */}
            <div className="h-20 flex items-center px-4 pt-4 pb-2 mb-2 relative">
                {isRestrictedDemo ? (
                    <SignInButton mode="modal">
                        <button className="flex items-center gap-3 min-w-0 text-left">
                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center transition-all duration-300 relative group">
                                <img src={logoUrl} alt="Logo" className="w-auto h-9 object-contain" />
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a] shadow-sm" />
                            </div>
                            <div className={`whitespace-nowrap flex flex-col justify-center transition-all duration-300 ${expanded ? 'opacity-100 translate-x-0 w-32' : 'opacity-0 -translate-x-2 w-0 overflow-hidden'}`}>
                                <span className="text-xl font-bold text-white tracking-tight leading-none mb-1">
                                    {brandName}
                                </span>
                                {badge && (
                                    <span className="text-[10px] font-bold text-dark-300 uppercase tracking-widest leading-none">
                                        {badge} {isDemo && <span className="text-amber-500 ml-1">DEMO</span>}
                                    </span>
                                )}
                            </div>
                        </button>
                    </SignInButton>
                ) : (
                    <Link to={brandLink || '/'} className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center transition-all duration-300 relative group">
                            <img src={logoUrl} alt="Logo" className="w-auto h-9 object-contain" />
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a] shadow-sm" />
                        </div>
                        {/* Animate opacity safely without breaking flex child width immediately */}
                        <div className={`whitespace-nowrap flex flex-col justify-center transition-all duration-300 ${expanded ? 'opacity-100 translate-x-0 w-32' : 'opacity-0 -translate-x-2 w-0 overflow-hidden'}`}>
                            <span className="text-xl font-bold text-white tracking-tight leading-none mb-1">
                                {brandName}
                            </span>
                            {badge && (
                                <span className="text-[10px] font-bold text-dark-300 uppercase tracking-widest leading-none">
                                    {badge} {isDemo && <span className="text-amber-500 ml-1">DEMO</span>}
                                </span>
                            )}
                        </div>
                    </Link>
                )}

                <button 
                    onClick={() => onToggle(!expanded)}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-dark-100 rounded-full flex items-center justify-center text-dark-800 hover:text-[#0a0a0a] shadow-sm hover:scale-110 transition-all focus:outline-none z-10"
                    aria-label="Toggle Sidebar"
                >
                    {expanded ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
                </button>
            </div>

            {/* Sidebar Search Bar */}
            <div className={`px-4 mb-2 transition-all duration-300 overflow-hidden ${expanded ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="relative group/search">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 group-focus-within/search:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input 
                        type="text" 
                        placeholder="Search Settings..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-8 text-sm text-white focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-dark-400"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 text-dark-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/5 uppercase">
                        ⌘K
                    </div>
                </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar space-y-1">
                {items.filter(item => {
                    if (!searchQuery) return true;
                    if (item.divider || item.group) return false;
                    return item.label?.toLowerCase().includes(searchQuery.toLowerCase());
                }).map((item, index) => {
                    if (item.divider) {
                        return <div key={`div-${index}`} className="my-3 border-t border-white/10 mx-2" />;
                    }
                    if (item.group) {
                        return (
                            <div key={`group-${index}`} className={`px-2 py-2 text-xs font-bold text-dark-400 uppercase tracking-wider transition-all duration-300 ${expanded ? 'opacity-100 max-h-8' : 'opacity-0 max-h-0 overflow-hidden m-0 p-0'}`}>
                                {item.group}
                            </div>
                        );
                    }

                    const active = isActive(item);
                    
                    const itemContent = (
                        <>
                            <div className={`w-12 h-10 flex-shrink-0 flex items-center justify-center ${active ? 'text-white' : 'text-dark-400 group-hover:text-white'}`}>
                                {item.icon}
                            </div>
                            
                            <span className={`whitespace-nowrap text-sm transition-all duration-300 ${expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 hidden'}`}>
                                {item.label}
                            </span>

                            {/* Active Indicator Line for collapsed mode */}
                            {active && !expanded && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-l-full" />
                            )}
                            
                            {/* Hover tooltip for collapsed mode */}
                            {!expanded && (
                                <div className="absolute left-full ml-4 px-3 py-1.5 bg-dark-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all z-50 whitespace-nowrap shadow-xl">
                                    {item.label}
                                </div>
                            )}
                        </>
                    );

                    if (isRestrictedDemo) {
                        return (
                            <SignInButton mode="modal" key={item.label}>
                                <button
                                    className={`group relative flex w-full items-center h-10 mx-1 rounded-md transition-all duration-200 
                                        ${active 
                                            ? 'bg-white/10 text-white font-semibold' 
                                            : 'text-dark-400 hover:bg-white/5 hover:text-white font-medium'
                                        }`}
                                >
                                    {itemContent}
                                </button>
                            </SignInButton>
                        );
                    }

                    return (
                        <Link
                            key={item.label}
                            to={item.path}
                            className={`group relative flex items-center h-10 mx-1 rounded-md transition-all duration-200 
                                ${active 
                                    ? 'bg-white/10 text-white font-semibold' 
                                    : 'text-dark-400 hover:bg-white/5 hover:text-white font-medium'
                                }`}>
                            {itemContent}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Content (User info, logout, etc) */}
            <div className="p-3 border-t border-white/10">
                <div className={`p-2 rounded-xl transition-colors ${expanded ? 'hover:bg-white/5 cursor-pointer text-white' : 'text-white'}`}>
                    {bottomContent(expanded)}
                </div>
            </div>
            
            {/* Custom CSS for hiding scrollbar visually but allowing scroll */}
            <style jsx="true">{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: transparent;
                    border-radius: 20px;
                }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background-color: #f3f4f6; /* dark-100 */
                }
            `}</style>
        </aside>
    );
}
