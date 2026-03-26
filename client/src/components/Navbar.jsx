import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    SignedIn,
    SignedOut,
    UserButton,
    useUser,
    SignInButton,
} from '@clerk/clerk-react';
import RoleSelectModal from './RoleSelectModal';

// Links for logged-in tenants
const TENANT_PRIMARY = [
    { label: 'Home Page', path: '/tenant/dashboard' },
    { label: 'Properties', path: '/tenant/home' },
    { label: 'Favourites', path: '/tenant/favourites' },
    { label: 'Applications', path: '/tenant/applications' },
];

const TENANT_MORE = [
    { label: 'All Listings', path: '/tenant/properties' },
    { label: 'Search', path: '/tenant/search' },
    { label: 'Payments', path: '/tenant/payments' },
];

const TENANT_ALL = [...TENANT_PRIMARY, ...TENANT_MORE];

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const moreRef = useRef(null);
    const { user } = useUser();

    // Close "More" dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (moreRef.current && !moreRef.current.contains(e.target)) {
                setMoreOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const publicNavLinks = [
        { label: 'Home', href: '#home', active: true },
        { label: 'Properties', href: '#properties', active: false },
        { label: 'Search', href: '#search', active: false },
        { label: 'News & Blogs', href: '/blogs', active: false, isRoute: true },
        { label: 'About Us', href: '#about', active: false },
    ];

    // Get user role for dashboard redirect
    const userRole = user?.unsafeMetadata?.role || user?.publicMetadata?.role;
    const dashboardUrl = userRole === 'tenant'
        ? '/tenant/dashboard'
        : userRole === 'manager'
            ? '/manager/dashboard'
            : '/select-role';

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
                    ? 'bg-white/95 backdrop-blur-md shadow-lg shadow-black/5 py-2'
                    : 'bg-dark-900/80 backdrop-blur-sm py-3'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <a href={userRole === 'tenant' ? '#top' : '/'} className="flex items-center gap-2 group flex-shrink-0">
                            <svg className={`w-6 h-6 transition-colors duration-300 ${isScrolled ? 'text-primary-600' : 'text-primary-400'}`} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                            </svg>
                            <span className={`text-xl font-bold transition-colors duration-300 ${isScrolled ? 'text-dark-900' : 'text-white'}`}>
                                Urban<span className="text-primary-500">Rent</span>
                            </span>
                        </a>

                        {/* Desktop Nav Links */}
                        <div className="hidden md:flex items-center flex-shrink-0 z-10 mx-auto">
                            <SignedOut>
                                <div className="flex items-center gap-1 bg-slate-700/80 backdrop-blur-sm rounded-full px-1.5 py-1.5">
                                    {publicNavLinks.map((link) => {
                                        const classes = `px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap ${link.active
                                            ? 'bg-white text-dark-900 shadow-sm'
                                            : isScrolled
                                                ? 'text-white hover:text-dark-900 hover:bg-dark-100'
                                                : 'text-white hover:text-white hover:bg-white/10'
                                            }`;
                                        return link.isRoute ? (
                                            <Link key={link.label} to={link.href} className={classes}>
                                                {link.label}
                                            </Link>
                                        ) : (
                                            <a key={link.label} href={link.href} className={classes}>
                                                {link.label}
                                            </a>
                                        );
                                    })}
                                </div>
                            </SignedOut>

                            <SignedIn>
                                {userRole === 'tenant' ? (
                                    <div className={`flex items-center gap-1 rounded-full px-1.5 py-1.5 transition-all duration-300 ${isScrolled ? 'bg-dark-50 shadow-inner border border-dark-100' : 'bg-slate-700/80 backdrop-blur-sm'}`}>
                                        {TENANT_PRIMARY.map((link) => (
                                            <Link
                                                key={link.path}
                                                to={link.path}
                                                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap ${link.path === '/'
                                                    ? 'bg-primary-300 text-dark-900 shadow-sm'
                                                    : isScrolled
                                                        ? 'text-dark-600 hover:text-dark-900 hover:bg-dark-100'
                                                        : 'text-white/90 hover:text-white hover:bg-white/10'
                                                    }`}
                                            >
                                                {link.label}
                                            </Link>
                                        ))}

                                        <div className="relative" ref={moreRef}>
                                            <button
                                                onClick={() => setMoreOpen(!moreOpen)}
                                                className={`flex items-center gap-1 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap ${isScrolled
                                                    ? 'text-dark-600 hover:text-dark-900 hover:bg-dark-100'
                                                    : 'text-white/90 hover:text-white hover:bg-white/10'
                                                    }`}
                                            >
                                                More
                                                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                            {moreOpen && (
                                                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-dark-100 py-2 z-50 animate-fade-in">
                                                    {TENANT_MORE.map((link) => (
                                                        <Link
                                                            key={link.path}
                                                            to={link.path}
                                                            onClick={() => setMoreOpen(false)}
                                                            className="block px-4 py-2.5 text-sm font-medium text-dark-600 hover:bg-dark-50 hover:text-dark-900 transition-colors"
                                                        >
                                                            {link.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* Manager / No Role Links */
                                    <div className="flex items-center gap-1 bg-slate-700/80 backdrop-blur-sm rounded-full px-1 py-1">
                                        <span className="px-5 py-2 text-white/90 text-sm font-medium">Urban Rent Platform</span>
                                    </div>
                                )}
                            </SignedIn>
                        </div>

                        {/* Auth Buttons — Desktop */}
                        <div className="hidden md:flex items-center justify-end gap-3 flex-shrink-0 min-w-[150px]">
                            {/* When user is signed OUT */}
                            <SignedOut>
                                <SignInButton mode="modal">
                                    <button className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer ${isScrolled ? 'text-dark-700 hover:text-dark-900 hover:bg-dark-100' : 'text-white/90 hover:text-white hover:bg-white/10'}`}>
                                        Log in
                                    </button>
                                </SignInButton>
                                <button onClick={() => setRoleModalOpen(true)} className="bg-primary-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary-700 transition-all duration-300 shadow-lg active:scale-95 transform cursor-pointer">
                                    Get Started
                                </button>
                            </SignedOut>

                            {/* When user is signed IN */}
                            <SignedIn>
                                {userRole !== 'tenant' && (
                                    <Link to={dashboardUrl} className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isScrolled ? 'text-primary-600 hover:bg-primary-50' : 'text-white hover:bg-white/10'}`}>
                                        Dashboard
                                    </Link>
                                )}
                                <div className={`rounded-full p-0.5 ${isScrolled ? 'border shadow-sm border-dark-100' : 'bg-white/10'}`}>
                                    <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-9 h-9' } }} />
                                </div>
                            </SignedIn>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`md:hidden p-2 rounded-lg transition-colors ${isScrolled ? 'text-dark-700' : 'text-white'}`}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    <div className={`md:hidden transition-all duration-300 overflow-hidden ${isMobileMenuOpen ? 'max-h-[500px] mt-4' : 'max-h-0'}`}>
                        <div className="bg-white rounded-2xl shadow-xl p-4 space-y-1">
                            {/* Mobile Nav Links */}
                            <SignedOut>
                                {publicNavLinks.map((link) => (
                                    <a key={link.label} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-dark-700 hover:bg-primary-50 hover:text-primary-700 font-medium transition-colors">
                                        {link.label}
                                    </a>
                                ))}
                            </SignedOut>

                            <SignedIn>
                                {userRole === 'tenant' ? (
                                    <>
                                        {TENANT_ALL.map((link) => (
                                            <Link key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${link.path === '/' ? 'bg-primary-50 text-primary-700' : 'text-dark-600 hover:bg-dark-50'}`}>
                                                {link.label}
                                            </Link>
                                        ))}
                                    </>
                                ) : (
                                    <Link to={dashboardUrl} onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-dark-700 hover:bg-primary-50 hover:text-primary-700 font-medium transition-colors">
                                        Go to Dashboard
                                    </Link>
                                )}
                            </SignedIn>

                            <hr className="my-2 border-dark-100" />

                            {/* Mobile Buttons */}
                            <SignedOut>
                                <div className="flex gap-2 pt-2">
                                    <SignInButton mode="modal">
                                        <button onClick={() => setIsMobileMenuOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl text-dark-700 hover:bg-dark-100 font-medium transition-colors text-center">Log in</button>
                                    </SignInButton>
                                    <button onClick={() => { setIsMobileMenuOpen(false); setRoleModalOpen(true); }} className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors text-center">Get Started</button>
                                </div>
                            </SignedOut>

                            <SignedIn>
                                <div className="pt-2">
                                    <div className="flex items-center justify-center gap-3 px-4 py-2 border border-dark-100 rounded-xl bg-dark-50">
                                        <span className="text-dark-500 text-sm font-medium">Logged in as {user?.firstName}</span>
                                        <UserButton afterSignOutUrl="/" />
                                    </div>
                                </div>
                            </SignedIn>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Role selection modal */}
            <RoleSelectModal isOpen={roleModalOpen} onClose={() => setRoleModalOpen(false)} />
        </>
    );
}
