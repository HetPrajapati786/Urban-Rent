import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function Footer() {
    const [ref, isVisible] = useScrollAnimation(0.1);

    const navLinks = ['Home', 'About', 'Properties', 'Services'];
    const rightLinks = ['Homes', 'FAQ', 'Pricing', 'Contact'];

    return (
        <footer id="contact" ref={ref} className="relative overflow-hidden">
            {/* Nature Banner - "Discover Nature's Wonders" */}
            <div className="bg-white section-padding py-16 lg:py-20">
                <div className="max-w-7xl mx-auto">
                    <div className={`flex flex-col lg:flex-row items-start lg:items-center justify-between transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <div className="mb-6 lg:mb-0">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 leading-tight">
                                Discover Nature's <span className="font-display italic">Wonders</span>
                                <br />
                                With Expert Guidance
                            </h2>
                        </div>
                        <div className="text-dark-600 text-sm space-y-2">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>EMAIL: INFO@UBAH.CO.ART</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>+919343101890</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Navigation Bar */}
            <div className="bg-white border-t border-dark-200">
                <div className="max-w-7xl mx-auto section-padding">
                    <div className="flex flex-col sm:flex-row items-center justify-between py-5 gap-4">
                        {/* Left nav links */}
                        <div className="flex items-center gap-6">
                            {navLinks.map((link) => (
                                <a
                                    key={link}
                                    href="#"
                                    className="text-dark-600 hover:text-dark-900 text-sm font-medium transition-colors"
                                >
                                    {link}
                                </a>
                            ))}
                        </div>

                        {/* Center Logo */}
                        <a href="#home" className="flex items-center gap-2">
                            <span className="text-xl font-bold text-dark-900">
                                Urban<span className="text-primary-500">Rent</span>
                            </span>
                        </a>

                        {/* Right nav links */}
                        <div className="flex items-center gap-6">
                            {rightLinks.map((link) => (
                                <a
                                    key={link}
                                    href="#"
                                    className="text-dark-600 hover:text-dark-900 text-sm font-medium transition-colors"
                                >
                                    {link}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Copyright */}
            <div className="bg-white border-t border-dark-200">
                <div className="max-w-7xl mx-auto section-padding">
                    <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-3">
                        <p className="text-dark-400 text-xs">
                            © 2025 UrbanRent. All Rights Reserved
                        </p>
                        <div className="flex items-center gap-4 text-dark-400 text-xs">
                            <a href="#" className="hover:text-dark-600 transition-colors">Terms & Conditions</a>
                            <a href="#" className="hover:text-dark-600 transition-colors">Privacy Policy</a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Map/Decorative Area */}
            <div className="bg-dark-100 h-16" />
        </footer>
    );
}
