import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { isImpersonating, clearImpersonation } from '../utils/impersonation';
import SuspensionModal from './SuspensionModal';
import PropertyVacateNoticeModal from './PropertyVacateNoticeModal';
import AccountDeletedModal from './AccountDeletedModal';
import AdminImpersonatingModal from './AdminImpersonatingModal';

const API_BASE = 'http://localhost:5000';

/**
 * SuspensionGuard - Global component that monitors for live admin actions.
 * 
 * Handles:
 * 1. Suspension - shows SuspensionModal (with reactivation request)
 * 2. Account Deletion - shows AccountDeletedModal (auto sign-out, no recovery)
 * 3. Admin Impersonation - shows AdminImpersonatingModal (auto sign-out)
 * 4. Property Vacate Notice - shows PropertyVacateNoticeModal
 * 5. API-level suspension detection from 403 responses
 */
export default function SuspensionGuard() {
    const { user, isLoaded, isSignedIn } = useUser();
    const clerk = useClerk();
    const location = useLocation();

    // Never run on admin routes — admin panel has its own auth system
    // and should never react to user-targeted socket events
    const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/demo/admin');
    const isImpersonationTab = isImpersonating();

    // Modal states - only one should be active at a time
    const [suspended, setSuspended] = useState(false);
    const [suspensionData, setSuspensionData] = useState({});
    
    const [deleted, setDeleted] = useState(false);
    const [deletionData, setDeletionData] = useState({});
    
    const [impersonated, setImpersonated] = useState(false);
    const [impersonationData, setImpersonationData] = useState({});
    
    const [vacateNotice, setVacateNotice] = useState(null);
    
    const socketRef = useRef(null);
    const clerkId = user?.id;

    // Sign out handler — also cleans up impersonation state
    const handleSignOut = useCallback(async () => {
        try {
            clearImpersonation();
            if (clerk && clerk.signOut) {
                await clerk.signOut();
            }
            window.location.href = '/';
        } catch {
            clearImpersonation();
            window.location.href = '/';
        }
    }, [clerk]);

    // Check suspension/deletion status on load
    const checkSuspensionStatus = useCallback(async () => {
        if (!clerkId) return;

        try {
            const res = await fetch(`${API_BASE}/api/users/suspension-status`, {
                headers: { 'x-clerk-user-id': clerkId },
            });
            const data = await res.json();

            if (data.deleted) {
                setDeleted(true);
                setDeletionData({ reason: data.reason || 'Your account has been permanently removed.' });
            } else if (data.suspended) {
                setSuspended(true);
                setSuspensionData({
                    reason: data.reason,
                    suspendedAt: data.suspendedAt,
                    reactivationRequests: data.reactivationRequests || [],
                });
            }
        } catch (err) {
            console.error('Suspension status check failed:', err);
        }
    }, [clerkId]);

    useEffect(() => {
        if (isLoaded && isSignedIn && clerkId) {
            checkSuspensionStatus();
        }
    }, [isLoaded, isSignedIn, clerkId, checkSuspensionStatus]);

    // Listen for API-level suspension/deletion detection (from api.js error handler)
    useEffect(() => {
        const handleApiSuspension = (e) => {
            setSuspended(true);
            setSuspensionData({
                reason: e.detail?.reason || 'Account suspended by administrator',
                suspendedAt: e.detail?.suspendedAt,
                reactivationRequests: [],
            });
        };

        const handleApiDeletion = (e) => {
            setDeleted(true);
            setDeletionData({
                reason: e.detail?.reason || 'Your account has been permanently removed.',
            });
        };

        window.addEventListener('user-suspended-api', handleApiSuspension);
        window.addEventListener('user-deleted-api', handleApiDeletion);
        return () => {
            window.removeEventListener('user-suspended-api', handleApiSuspension);
            window.removeEventListener('user-deleted-api', handleApiDeletion);
        };
    }, []);

    // Socket.IO connection for live events
    useEffect(() => {
        if (!clerkId) return;

        const newSocket = io(API_BASE, {
            withCredentials: true,
        });

        newSocket.on('connect', () => {
            newSocket.emit('setup', { clerkId });
        });

        // ── Force Logout (handles both deletion and impersonation) ──
        newSocket.on('force-logout', (data) => {
            if (data.type === 'deletion') {
                setDeleted(true);
                setDeletionData({
                    reason: data.reason || 'Your account has been permanently removed.',
                });
            } else if (data.type === 'impersonation') {
                setImpersonated(true);
                setImpersonationData({
                    adminName: data.adminName || 'Administrator',
                    reason: data.reason,
                });
            }
        });

        // ── Live suspension event ──
        newSocket.on('user-suspended', (data) => {
            setSuspended(true);
            setSuspensionData({
                reason: data.reason,
                suspendedAt: data.suspendedAt,
                reactivationRequests: [],
            });
        });

        // ── Live reactivation event ──
        newSocket.on('user-reactivated', () => {
            setSuspended(false);
            setSuspensionData({});
        });

        // ── Live account deletion event (legacy fallback) ──
        newSocket.on('account-deleted', (data) => {
            setDeleted(true);
            setDeletionData({
                reason: data.reason || 'Your account has been permanently removed by the administrator.',
            });
        });

        // ── Live property vacate notice ──
        newSocket.on('property-vacate-notice', (data) => {
            setVacateNotice(data);
        });

        socketRef.current = newSocket;

        return () => {
            newSocket.disconnect();
        };
    }, [clerkId]);

    const handleVacateAcknowledge = () => {
        if (vacateNotice?.propertyId) {
            const key = `urbanrent_vacate_ack_${vacateNotice.propertyId}`;
            localStorage.setItem(key, 'true');
        }
        setVacateNotice(null);
    };

    // Don't render anything if not authenticated, on admin routes, or in an impersonation tab
    if (!isLoaded || !isSignedIn || isAdminRoute || isImpersonationTab) return null;

    // Check if vacate notice was already acknowledged
    const shouldShowVacateNotice = vacateNotice && 
        !localStorage.getItem(`urbanrent_vacate_ack_${vacateNotice.propertyId}`);

    // Priority order: deletion > impersonation > suspension > vacate notice
    return (
        <>
            {deleted && (
                <AccountDeletedModal
                    reason={deletionData.reason}
                    onSignOut={handleSignOut}
                />
            )}

            {!deleted && impersonated && (
                <AdminImpersonatingModal
                    adminName={impersonationData.adminName}
                    reason={impersonationData.reason}
                    onSignOut={handleSignOut}
                />
            )}

            {!deleted && !impersonated && suspended && (
                <SuspensionModal
                    reason={suspensionData.reason}
                    suspendedAt={suspensionData.suspendedAt}
                    reactivationRequests={suspensionData.reactivationRequests}
                    onRequestSubmitted={checkSuspensionStatus}
                    onSignOut={handleSignOut}
                    clerkId={clerkId}
                />
            )}

            {!deleted && !impersonated && !suspended && shouldShowVacateNotice && (
                <PropertyVacateNoticeModal
                    propertyTitle={vacateNotice.propertyTitle}
                    vacateBy={vacateNotice.vacateBy}
                    noticeType={vacateNotice.noticeType}
                    onAcknowledge={handleVacateAcknowledge}
                />
            )}
        </>
    );
}
