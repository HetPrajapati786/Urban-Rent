import { useUser, useAuth } from '@clerk/clerk-react';
import Navbar from '../components/Navbar';
import TenantLayout from '../layouts/TenantLayout';
import ManagerLayout from '../layouts/ManagerLayout';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Stats from '../components/Stats';
import DiscoverValue from '../components/DiscoverValue';
import Properties from '../components/Properties';
import LandingBlogs from '../components/LandingBlogs';
import FAQ from '../components/FAQ';
import Testimonials from '../components/Testimonials';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

export default function LandingPage() {
    const { user, isLoaded } = useUser();
    const { isSignedIn } = useAuth();
    
    // Default content shared across all layouts
    const content = (
        <>
            <Hero />
            <Features />
            <Stats />
            <DiscoverValue />
            <Properties />
            <LandingBlogs />
            <FAQ />
            <Testimonials />
            <CTA />
            <Footer />
        </>
    );

    if (!isLoaded) {
        return <div className="min-h-screen bg-white" />;
    }

    if (isSignedIn && user) {
        const userRole = user?.unsafeMetadata?.role || user?.publicMetadata?.role;

        if (userRole === 'tenant') {
            return (
                <TenantLayout isPublicPage={true}>
                    {content}
                </TenantLayout>
            );
        }

        if (userRole === 'manager') {
            return (
                <ManagerLayout isPublicPage={true}>
                    {content}
                </ManagerLayout>
            );
        }
    }

    // Default public view
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            {content}
        </div>
    );
}
