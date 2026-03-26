import { useState } from 'react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';

/**
 * RoleSelectModal
 * Shown BEFORE the Clerk sign-in/up modal.
 * User picks Tenant or Manager first, then gets redirected to Clerk
 * with a sessionStorage flag so SelectRole can auto-set the role.
 */

const ROLES = [
    {
        id: 'tenant',
        title: 'Tenant',
        subtitle: "I'm looking to rent",
        description: 'Browse verified listings, save favourites, schedule visits, and apply online.',
        gradient: 'from-blue-500 to-cyan-500',
        iconBg: 'bg-blue-50 text-blue-600',
        activeBg: 'border-blue-400 ring-2 ring-blue-100',
        inactiveBorder: 'border-dark-200 hover:border-blue-300',
        features: ['Browse properties', 'Save favourites', 'Apply online', 'Track applications'],
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        id: 'manager',
        title: 'Property Manager',
        subtitle: "I want to list properties",
        description: 'List your properties, find quality tenants, manage bookings, and collect rent.',
        gradient: 'from-emerald-500 to-teal-500',
        iconBg: 'bg-emerald-50 text-emerald-600',
        activeBg: 'border-emerald-400 ring-2 ring-emerald-100',
        inactiveBorder: 'border-dark-200 hover:border-emerald-300',
        features: ['List properties', 'Find tenants', 'Manage bookings', 'Collect rent'],
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
    },
];

export default function RoleSelectModal({ isOpen, onClose }) {
    const [selectedRole, setSelectedRole] = useState(null);

    if (!isOpen) return null;

    // Persist role choice before Clerk modal opens
    const handleRoleSelect = (roleId) => {
        setSelectedRole(roleId);
    };

    const redirectUrl = selectedRole === 'tenant' ? '/tenant/dashboard' : '/manager/dashboard';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-dark-100 hover:bg-dark-200 flex items-center justify-center transition-colors"
                >
                    <svg className="w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl font-bold text-dark-900">
                            Urban<span className="text-primary-500">Rent</span>
                        </span>
                    </div>
                    <h2 className="text-xl font-bold text-dark-900">First, tell us who you are</h2>
                    <p className="text-dark-500 text-sm mt-1">Choose your role to get the right experience.</p>
                </div>

                {/* Role Cards */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    {ROLES.map(role => (
                        <button
                            key={role.id}
                            onClick={() => handleRoleSelect(role.id)}
                            className={`relative text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                                selectedRole === role.id
                                    ? role.activeBg + ' bg-white shadow-md'
                                    : role.inactiveBorder + ' border-dark-200 bg-white hover:shadow-sm'
                            }`}
                        >
                            {/* Checkmark */}
                            {selectedRole === role.id && (
                                <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                </div>
                            )}
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${role.iconBg}`}>
                                {role.icon}
                            </div>
                            <h3 className="font-bold text-dark-900 text-sm mb-0.5">{role.title}</h3>
                            <p className="text-dark-400 text-xs">{role.subtitle}</p>
                            <ul className="mt-2 space-y-1">
                                {role.features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-1.5 text-[11px] text-dark-500">
                                        <svg className="w-3 h-3 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                        </svg>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </button>
                    ))}
                </div>

                {/* CTA Buttons — only enabled when role is selected */}
                {selectedRole ? (
                        <SignUpButton
                            mode="modal"
                            forceRedirectUrl={redirectUrl}
                            unsafeMetadata={{ preSelectedRole: selectedRole }}
                        >
                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-all hover:shadow-lg hover:shadow-primary-600/25 active:scale-[0.98]"
                            >
                                Get Started as {selectedRole === 'tenant' ? 'Tenant' : 'Property Manager'}
                            </button>
                        </SignUpButton>
                ) : (
                    <button
                        disabled
                        className="w-full py-3 bg-dark-200 text-dark-400 rounded-xl font-semibold text-sm cursor-not-allowed"
                    >
                        Select a role to continue
                    </button>
                )}

                <p className="text-center text-dark-400 text-xs mt-3">
                    You can change your role later from settings.
                </p>
            </div>
        </div>
    );
}
