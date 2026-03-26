import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const roles = [
    {
        id: 'tenant',
        title: 'Tenant',
        subtitle: "I'm looking to rent a property",
        description: 'Browse verified properties, schedule visits, sign digital agreements, and manage your rental journey.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
        borderColor: 'border-blue-200',
        hoverBorder: 'hover:border-blue-400',
        selectedBorder: 'border-blue-500 ring-4 ring-blue-100',
        iconBg: 'bg-blue-100 text-blue-600',
        features: ['Browse properties', 'Schedule visits', 'Digital agreements', 'Pay rent online'],
        dashboardPath: '/demo/tenant',
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
        borderColor: 'border-emerald-200',
        hoverBorder: 'hover:border-emerald-400',
        selectedBorder: 'border-emerald-500 ring-4 ring-emerald-100',
        iconBg: 'bg-emerald-100 text-emerald-600',
        features: ['List properties', 'Find tenants', 'Manage bookings', 'Collect rent'],
        dashboardPath: '/demo/manager',
    },
    {
        id: 'admin',
        title: 'Admin',
        subtitle: 'I manage the platform',
        description: 'Review and approve property listings, manage users, and oversee the entire platform.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>
        ),
        borderColor: 'border-red-200',
        hoverBorder: 'hover:border-red-400',
        selectedBorder: 'border-red-500 ring-4 ring-red-100',
        iconBg: 'bg-red-100 text-red-600',
        features: ['Approve properties', 'Manage users', 'Platform analytics', 'Content moderation'],
        dashboardPath: '/demo/admin',
    },
];

export default function DemoRoleSelect() {
    const [selectedRole, setSelectedRole] = useState(null);
    const navigate = useNavigate();

    const handleContinue = () => {
        if (!selectedRole) return;
        const role = roles.find((r) => r.id === selectedRole);
        if (role) navigate(role.dashboardPath);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-50 via-white to-primary-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-3xl w-full">
                {/* Demo Badge */}
                <div className="flex justify-center mb-6">
                    <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-full text-sm font-semibold">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                        </svg>
                        Demo Mode — Preview Only
                    </span>
                </div>

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
                        Welcome!
                    </h1>
                    <p className="text-dark-500 text-lg max-w-md mx-auto">
                        Choose how you'd like to use UrbanRent.
                    </p>
                </div>

                {/* Role Cards */}
                <div className="grid sm:grid-cols-3 gap-5 mb-8">
                    {roles.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRole(role.id)}
                            className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${selectedRole === role.id
                                ? `${role.selectedBorder} bg-white shadow-lg`
                                : `${role.borderColor} ${role.hoverBorder} bg-white hover:shadow-md`
                                }`}
                        >
                            {selectedRole === role.id && (
                                <div className="absolute top-4 right-4 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                </div>
                            )}

                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${role.iconBg}`}>
                                {role.icon}
                            </div>

                            <h3 className="text-xl font-bold text-dark-900 mb-1">{role.title}</h3>
                            <p className="text-primary-600 font-medium text-sm mb-3">{role.subtitle}</p>
                            <p className="text-dark-500 text-sm leading-relaxed mb-4">{role.description}</p>

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

                {/* Continue Button */}
                <button
                    onClick={handleContinue}
                    disabled={!selectedRole}
                    className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${selectedRole
                        ? 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-600/25 active:scale-[0.98] cursor-pointer'
                        : 'bg-dark-200 text-dark-400 cursor-not-allowed'
                        }`}
                >
                    {`Continue as ${selectedRole === 'tenant' ? 'Tenant' : selectedRole === 'manager' ? 'Property Manager' : selectedRole === 'admin' ? 'Admin' : '...'}`}
                </button>

                <p className="text-center text-dark-400 text-sm mt-4">
                    <a href="/" className="text-primary-600 hover:underline">← Back to Home</a>
                </p>
            </div>
        </div>
    );
}
