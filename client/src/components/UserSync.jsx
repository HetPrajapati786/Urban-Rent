import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { apiPost } from '../utils/api';

/**
 * UserSync component — Silent background synchronizer to ensure 
 * Clerk user data always exists in MongoDB.
 */
export default function UserSync() {
    const { user, isLoaded, isSignedIn } = useUser();
    const syncInProgress = useRef(false);

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
                // Once synced successfully, we don't need to do it again for this session
                // unless the user object changes significantly.
            } catch (error) {
                console.error('Background user sync failed:', error);
            } finally {
                syncInProgress.current = false;
            }
        };

        syncUser();
    }, [isLoaded, isSignedIn, user]);

    return null; // This component doesn't render anything
}
