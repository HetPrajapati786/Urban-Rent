import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { apiPost } from '../utils/api';
import { isFreshImpersonation, clearImpersonation } from '../utils/impersonation';

/**
 * UserSync component — Silent background synchronizer to ensure 
 * Clerk user data always exists in MongoDB.
 * Also handles cross-tab/cross-account session invalidation.
 */
export default function UserSync() {
    const { user, isLoaded, isSignedIn } = useUser();
    const syncInProgress = useRef(false);

    // ── Cross-account multi-tab detection ──────────────────────────────────
    // If a different Clerk user signs in (in any tab), invalidate cached data
    useEffect(() => {
        if (!isLoaded) return;

        const STORED_KEY = 'urbanrent_active_user';
        // Keys we want to keep across account switches (UI preferences only)
        const PRESERVE_KEYS = ['urbanrent_tenant_sidebar', 'urbanrent_manager_sidebar'];

        if (isSignedIn && user) {
            const currentUserId = user.id;

            // Stale impersonation cleanup:
            // If a real Clerk user is signed in AND the impersonation is NOT fresh
            // (i.e., no ?impersonate= URL param was used to open this tab),
            // then any sessionStorage impersonation key is stale garbage. Clean it.
            if (!isFreshImpersonation() && sessionStorage.getItem('urbanrent_impersonate')) {
                clearImpersonation();
                // No reload needed - isImpersonating() already returns false
                // because _isFresh is false. The UI will be correct on next render.
            }

            // ── Cross-account multi-tab detection ─────────────────────────
            // If a different Clerk user signs in (in any tab), invalidate cached data
            const storedUserId = localStorage.getItem(STORED_KEY);
            if (storedUserId && storedUserId !== currentUserId) {
                // A DIFFERENT user is now signed in — purge all stale session data
                const allKeys = Object.keys(localStorage);
                allKeys.forEach(key => {
                    if (!PRESERVE_KEYS.includes(key)) {
                        localStorage.removeItem(key);
                    }
                });
                // Set the new user ID before reload
                localStorage.setItem(STORED_KEY, currentUserId);
                // Force full reload so React state is fresh
                window.location.reload();
                return;
            }

            // First login or same user — store ID
            localStorage.setItem(STORED_KEY, currentUserId);
        } else if (!isSignedIn && isLoaded) {
            // Signed out — clear the tracked user ID so next login is clean
            localStorage.removeItem(STORED_KEY);
            // Also clear any impersonation leftovers
            sessionStorage.removeItem('urbanrent_impersonate');
            sessionStorage.removeItem('urbanrent_impersonate_data');
            localStorage.removeItem('urbanrent_impersonate'); // cleaning up any older bugs
            localStorage.removeItem('urbanrent_impersonate_data');
        }
    }, [isLoaded, isSignedIn, user]);

    // ── MongoDB sync ────────────────────────────────────────────────────────
    useEffect(() => {
        const syncUser = async () => {
            if (!isLoaded || !isSignedIn || !user || syncInProgress.current) return;

            const role = user.unsafeMetadata?.role || user.publicMetadata?.role;
            if (!role) return; // Wait until role is selected

            try {
                syncInProgress.current = true;
                await apiPost('/users/sync', {
                    clerkId: user.id,
                    email: user.primaryEmailAddress?.emailAddress,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    avatar: user.imageUrl,
                    role,
                });
            } catch (error) {
                console.error('Background user sync failed:', error);
            } finally {
                syncInProgress.current = false;
            }
        };

        syncUser();
    }, [isLoaded, isSignedIn, user]);

    return null;
}
