import User from '../models/User.js';

/**
 * Middleware to verify user from Clerk.
 * Expects the frontend to send clerkId in Authorization header
 * or as a query param for simple requests.
 *
 * In production, you'd verify the Clerk session JWT here.
 * For now, we trust the clerkId sent from the authenticated frontend.
 */
export const authenticateUser = async (req, res, next) => {
    try {
        const clerkId = req.headers['x-clerk-user-id'];

        if (!clerkId) {
            return res.status(401).json({ error: 'Authentication required. Missing user ID.' });
        }

        let user = await User.findOne({ clerkId });

        // Auto-create demo users for demo mode
        if (!user && (clerkId === 'demo-manager' || clerkId === 'demo-tenant' || clerkId === 'demo-admin')) {
            const roleMap = { 'demo-manager': 'manager', 'demo-tenant': 'tenant', 'demo-admin': 'admin' };
            const role = roleMap[clerkId];
            user = await User.create({
                clerkId,
                email: `${role}@demo.urbanrent.com`,
                firstName: 'Demo',
                lastName: role.charAt(0).toUpperCase() + role.slice(1),
                role,
            });
            console.log(`Demo ${role} user created: ${user._id}`);
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found. Please complete registration.' });
        }

        if (!user.isActive) {
            return res.status(403).json({ error: 'Account is deactivated.' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication failed.' });
    }
};

/**
 * Optional authentication middleware.
 * Attempts to authenticate user but does NOT reject unauthenticated requests.
 * Sets req.user if valid credentials are present, otherwise proceeds with req.user = null.
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const clerkId = req.headers['x-clerk-user-id'];
        if (!clerkId) return next();

        const user = await User.findOne({ clerkId });
        if (user && user.isActive) {
            req.user = user;
        }
        next();
    } catch (error) {
        // Silently proceed without auth
        next();
    }
};

/**
 * Role-based access control middleware.
 * Usage: requireRole('manager') or requireRole('tenant', 'admin')
 */
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Access denied. Requires role: ${roles.join(' or ')}` });
        }

        next();
    };
};
