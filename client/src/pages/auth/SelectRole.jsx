import { useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { apiPost } from '../../utils/api';

const roles = [
    {
        id: 'tenant',
        title: 'Tenant',
        subtitle: 'I\'m looking to rent a property',
        description: 'Browse verified properties, schedule visits, sign digital agreements, and manage your rental journey.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        hoverBorder: 'hover:border-blue-400',
        selectedBorder: 'border-blue-500 ring-4 ring-blue-100',
        iconBg: 'bg-blue-100 text-blue-600',
        features: ['Browse properties', 'Schedule visits', 'Digital agreements', 'Pay rent online'],
    },
    {
        id: 'manager',
        title: 'Property Manager',
        subtitle: 'I want to list & manage properties',
        description: 'List your properties, find quality tenants, manage bookings, and handle rent collection seamlessly.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
        color: 'from-emerald-500 to-teal-500',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        hoverBorder: 'hover:border-emerald-400',
        selectedBorder: 'border-emerald-500 ring-4 ring-emerald-100',
        iconBg: 'bg-emerald-100 text-emerald-600',
        features: ['List properties', 'Find tenants', 'Manage bookings', 'Collect rent'],
    },
];

export default function SelectRole() {
    const { user } = useUser();
    const { isLoaded, isSignedIn } = useAuth();
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Wait for auth state
    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark-50">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        );
    }

    // Not signed in
    if (!isSignedIn) {
        return <Navigate to="/" replace />;
    }

    // Already has a role
    const existingRole = user?.unsafeMetadata?.role || user?.publicMetadata?.role;
    if (existingRole) {
        return <Navigate to={`/${existingRole}/dashboard`} replace />;
    }

    const handleSubmit = async () => {
        if (!selectedRole) return;

        setIsSubmitting(true);
        setError('');

        try {
            // Update user's public metadata with the selected role
            await user.update({
                unsafeMetadata: {
                    ...user.unsafeMetadata,
                    role: selectedRole,
                },
            });

            // Sync with MongoDB
            await apiPost('/users/sync', {
                clerkId: user.id,
                email: user.primaryEmailAddress?.emailAddress,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.imageUrl,
                role: selectedRole,
            });

            // Note: publicMetadata should be set from the backend for security.
            // For now, we use unsafeMetadata which can be set from the client.
            // In production, you'd call your backend API to set publicMetadata.

            // Navigate to the appropriate dashboard
            if (selectedRole === 'tenant') {
                navigate('/tenant/dashboard');
            } else if (selectedRole === 'manager') {
                navigate('/manager/dashboard');
            }
        } catch (err) {
            console.error('Failed to set role:', err);
            setError('Failed to set role. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-50 via-white to-primary-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-3xl w-full">
                {/* Header */}
                <div className="text-center mb-10">
                    <a href="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-dark-900">
                            Urban<span className="text-primary-500">Rent</span>
                        </span>
                    </a>
                    <h1 className="text-3xl sm:text-4xl font-bold text-dark-900 mb-3">
                        Welcome, {user?.firstName || 'there'}!
                    </h1>
                    <p className="text-dark-500 text-lg max-w-md mx-auto">
                        Choose how you'd like to use UrbanRent. You can always change this later.
                    </p>
                </div>

                {/* Role Cards */}
                <div className="grid sm:grid-cols-2 gap-5 mb-8">
                    {roles.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRole(role.id)}
                            className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${selectedRole === role.id
                                ? `${role.selectedBorder} bg-white shadow-lg`
                                : `${role.borderColor} ${role.hoverBorder} bg-white hover:shadow-md`
                                }`}
                        >
                            {/* Selected Checkmark */}
                            {selectedRole === role.id && (
                                <div className="absolute top-4 right-4 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center animate-[fadeIn_0.3s_ease-out]">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                </div>
                            )}

                            {/* Icon */}
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${role.iconBg}`}>
                                {role.icon}
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-bold text-dark-900 mb-1">{role.title}</h3>
                            <p className="text-primary-600 font-medium text-sm mb-3">{role.subtitle}</p>
                            <p className="text-dark-500 text-sm leading-relaxed mb-4">{role.description}</p>

                            {/* Features */}
                            <div className="space-y-2">
                                {role.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-dark-600">
                                        <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                        </svg>
                                        {feature}
                                    </div>
                                ))}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={!selectedRole || isSubmitting}
                    className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${selectedRole
                        ? 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-600/25 active:scale-[0.98] transform cursor-pointer'
                        : 'bg-dark-200 text-dark-400 cursor-not-allowed'
                        }`}
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Setting up your account...
                        </span>
                    ) : (
                        `Continue as ${selectedRole === 'tenant' ? 'Tenant' : selectedRole === 'manager' ? 'Property Manager' : '...'}`
                    )}
                </button>

                <p className="text-center text-dark-400 text-sm mt-4">
                    By continuing, you agree to our{' '}
                    <a href="#" className="text-primary-600 hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
                </p>
            </div>
        </div>
    );
}
