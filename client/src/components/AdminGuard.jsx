import { Navigate } from 'react-router-dom';

/**
 * AdminGuard — Protects admin routes by checking localStorage session.
 * Redirects to /admin/login if no valid admin session found.
 */
export default function AdminGuard({ children }) {
    const session = localStorage.getItem('urbanrent_admin');

    if (!session) {
        return <Navigate to="/admin/login" replace />;
    }

    try {
        const admin = JSON.parse(session);
        if (!admin.clerkId || admin.role !== 'admin') {
            localStorage.removeItem('urbanrent_admin');
            return <Navigate to="/admin/login" replace />;
        }
    } catch {
        localStorage.removeItem('urbanrent_admin');
        return <Navigate to="/admin/login" replace />;
    }

    return children;
}
