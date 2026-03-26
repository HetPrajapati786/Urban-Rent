import User from '../models/User.js';
import Property from '../models/Property.js';
import { Webhook } from 'svix';

/**
 * POST /api/webhooks/clerk
 * Handles Clerk webhook events to sync users into MongoDB.
 */
export const handleClerkWebhook = async (req, res) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        console.error('CLERK_WEBHOOK_SECRET is not set');
        return res.status(500).json({ error: 'Server misconfigured' });
    }

    // Verify the webhook signature
    const headers = {
        'svix-id': req.headers['svix-id'],
        'svix-timestamp': req.headers['svix-timestamp'],
        'svix-signature': req.headers['svix-signature'],
    };

    let event;
    try {
        const wh = new Webhook(WEBHOOK_SECRET);
        event = wh.verify(JSON.stringify(req.body), headers);
    } catch (err) {
        console.error('Webhook verification failed:', err.message);
        return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const { type, data } = event;

    try {
        switch (type) {
            case 'user.created': {
                const existing = await User.findOne({ clerkId: data.id });
                if (!existing) {
                    await User.create({
                        clerkId: data.id,
                        email: data.email_addresses?.[0]?.email_address || '',
                        firstName: data.first_name || '',
                        lastName: data.last_name || '',
                        avatar: data.image_url || '',
                        role: data.unsafe_metadata?.role || 'tenant',
                    });
                    console.log(`User created: ${data.id}`);
                }
                break;
            }

            case 'user.updated': {
                await User.findOneAndUpdate(
                    { clerkId: data.id },
                    {
                        email: data.email_addresses?.[0]?.email_address,
                        firstName: data.first_name || '',
                        lastName: data.last_name || '',
                        avatar: data.image_url || '',
                        role: data.unsafe_metadata?.role || undefined,
                    },
                    { new: true }
                );
                console.log(`User updated: ${data.id}`);
                break;
            }

            case 'user.deleted': {
                await User.findOneAndUpdate(
                    { clerkId: data.id },
                    { isActive: false }
                );
                console.log(`User deactivated: ${data.id}`);
                break;
            }

            default:
                console.log(`Unhandled webhook event: ${type}`);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

/**
 * GET /api/users/me
 * Get current user profile
 */
export const getMe = async (req, res) => {
    try {
        res.json({ user: req.user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * PUT /api/users/me
 * Update current user profile
 */
export const updateMe = async (req, res) => {
    try {
        const { phone, firstName, lastName } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { phone, firstName, lastName },
            { new: true, runValidators: true }
        );

        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/users/sync
 * Sync/create a user from the client side (fallback if webhook hasn't fired yet)
 */
export const syncUser = async (req, res) => {
    try {
        const { clerkId, email, firstName, lastName, avatar, role } = req.body;

        if (!clerkId || !email || !role) {
            return res.status(400).json({ error: 'clerkId, email, and role are required.' });
        }

        let user = await User.findOne({ clerkId });

        if (user) {
            // Update existing
            user.email = email;
            user.firstName = firstName || user.firstName;
            user.lastName = lastName || user.lastName;
            user.avatar = avatar || user.avatar;
            if (role && !user.role) user.role = role;
            await user.save();
        } else {
            // Create new
            user = await User.create({
                clerkId,
                email,
                firstName: firstName || '',
                lastName: lastName || '',
                avatar: avatar || '',
                role,
            });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error('User sync error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/users/favourites/:propertyId
 * Toggle save/unsave a property
 */
export const toggleFavourite = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const propertyId = req.params.propertyId;
        const isSaved = user.savedProperties.includes(propertyId);

        if (isSaved) {
            await User.findByIdAndUpdate(user._id, {
                $pull: { savedProperties: propertyId },
            });
        } else {
            await User.findByIdAndUpdate(user._id, {
                $addToSet: { savedProperties: propertyId },
            });
        }

        const updated = await User.findById(user._id);
        res.json({
            saved: !isSaved,
            savedProperties: updated.savedProperties,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/users/favourites
 * Get current user's saved property IDs
 */
export const getFavourites = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: 'savedProperties',
            match: { status: { $in: ['active', 'awaiting_payment', 'rented'] } },
            populate: { path: 'owner', select: 'firstName lastName avatar' },
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
            savedIds: user.savedProperties.map(p => p._id || p),
            savedProperties: user.savedProperties,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/users/managers
 * Get all managers with their property counts (public)
 */
export const getManagers = async (req, res) => {
    try {
        const managers = await User.find({ role: 'manager', isActive: true })
            .select('firstName lastName avatar email phone createdAt properties')
            .lean();

        // Add property count
        const result = await Promise.all(
            managers.map(async (m) => {
                const propertyCount = await Property.countDocuments({ owner: m._id, status: { $in: ['active', 'awaiting_payment'] } });
                const areas = await Property.distinct('location.area', { owner: m._id, status: { $in: ['active', 'awaiting_payment'] } });
                return {
                    ...m,
                    propertyCount,
                    areas: areas.slice(0, 2),
                };
            })
        );

        res.json({ managers: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
