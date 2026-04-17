import { useAuth, useUser, RedirectToSignIn } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { isImpersonating } from '../utils/impersonation';

/**
 * ProtectedRoute - Guards routes based on authentication and optional role.
 *
 * Roles are stored in Clerk's user metadata:
 * - unsafeMetadata.role (set from client - used during development)
 * - publicMetadata.role (set from backend - used in production)
 *
 * Possible role values: 'tenant', 'manager'
 *
 * Usage:
 *   <ProtectedRoute role="tenant"> ... </ProtectedRoute>
 *   <ProtectedRoute role="manager"> ... </ProtectedRoute>
 *   <ProtectedRoute> ... </ProtectedRoute>  // just requires auth, any role
 */
export default function ProtectedRoute({ children, role }) {
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();

    // Admin impersonation bypass — module is initialized synchronously at app
    // startup from the URL param or sessionStorage, so this is always reliable.
    if (isImpersonating()) {
        return children;
    }

    // Still loading auth state
    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-dark-500 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isSignedIn) {
        return <RedirectToSignIn />;
    }

    const userRole = user?.unsafeMetadata?.role || user?.publicMetadata?.role;

    if (!userRole) {
        return <Navigate to="/select-role" replace />;
    }

    if (role && userRole !== role) {
        if (userRole === 'tenant') return <Navigate to="/tenant/dashboard" replace />;
        if (userRole === 'manager') return <Navigate to="/manager/dashboard" replace />;
        if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
        return <Navigate to="/" replace />;
    }

    return children;
}
