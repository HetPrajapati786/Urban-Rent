import { useAuth, useUser, RedirectToSignIn } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

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

    // Check for admin impersonation bypass BEFORE clerk auth checks.
    // IMPORTANT: Only allow bypass when:
    //   1. A valid admin session exists in localStorage
    //   2. An impersonation target is set
    //   3. The current user is NOT signed into Clerk (a real user session)
    //      — if they are, the impersonation keys are stale and should be cleaned up
    const adminSession = localStorage.getItem('urbanrent_admin');
    const impersonating = localStorage.getItem('urbanrent_impersonate');

    if (adminSession && impersonating) {
        // Validate admin session structure
        let validAdmin = false;
        try {
            const parsed = JSON.parse(adminSession);
            validAdmin = !!(parsed.clerkId && parsed.role === 'admin');
        } catch { /* invalid JSON */ }

        if (validAdmin) {
            // If Clerk auth is loaded and a real user is signed in, this means
            // a regular user logged in on a browser that has stale impersonation keys.
            // Clean them up instead of bypassing auth.
            if (isLoaded && isSignedIn) {
                localStorage.removeItem('urbanrent_impersonate');
                localStorage.removeItem('urbanrent_impersonate_data');
            } else {
                // No real Clerk session → this is genuinely an admin impersonation tab
                return children;
            }
        } else {
            // Invalid admin session — clean up everything
            localStorage.removeItem('urbanrent_impersonate');
            localStorage.removeItem('urbanrent_impersonate_data');
        }
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

    // Not signed in → redirect to sign-in securely using Clerk
    if (!isSignedIn) {
        return <RedirectToSignIn />;
    }

    // Check role from both unsafeMetadata (client-set) and publicMetadata (server-set)
    const userRole = user?.unsafeMetadata?.role || user?.publicMetadata?.role;

    // If no role assigned yet, redirect to role selection
    if (!userRole) {
        return <Navigate to="/select-role" replace />;
    }

    // If a specific role is required but user has a different role
    if (role && userRole !== role) {
        // Redirect to the appropriate dashboard based on their actual role
        if (userRole === 'tenant') {
            return <Navigate to="/tenant/dashboard" replace />;
        } else if (userRole === 'manager') {
            return <Navigate to="/manager/dashboard" replace />;
        } else if (userRole === 'admin') {
            return <Navigate to="/admin/dashboard" replace />;
        }
        return <Navigate to="/" replace />;
    }

    return children;
}
