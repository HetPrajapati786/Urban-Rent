import Property from '../models/Property.js';
import User from '../models/User.js';
import Application from '../models/Application.js';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import AdminIncome from '../models/AdminIncome.js';
import Notification from '../models/Notification.js';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { io } from '../server.js';

/**
 * POST /api/admin/login
 * Verify admin access code and return admin session
 */
export const adminLogin = async (req, res) => {
    try {
        const { email, accessCode } = req.body;

        if (!email || !accessCode) {
            return res.status(400).json({ error: 'Email and access code are required.' });
        }

        // Verify access code
        const validCode = process.env.ADMIN_ACCESS_CODE;
        if (!validCode || accessCode !== validCode) {
            return res.status(401).json({ error: 'Invalid access code.' });
        }

        // Find or create admin user
        let user = await User.findOne({ email, role: 'admin' });

        if (!user) {
            // Create admin user with a unique clerkId (since they don't use Clerk)
            const adminClerkId = `admin_${crypto.randomBytes(8).toString('hex')}`;
            user = await User.create({
                clerkId: adminClerkId,
                email,
                firstName: 'Admin',
                lastName: '',
                role: 'admin',
            });
        }

        res.json({
            message: 'Login successful',
            admin: {
                id: user._id,
                clerkId: user.clerkId,
                email: user.email,
                firstName: user.firstName,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Login failed.' });
    }
};

/**
 * GET /api/admin/stats
 * Dashboard statistics for admin
 */
export const getDashboardStats = async (req, res) => {
    try {
        const [
            totalProperties,
            pendingProperties,
            activeProperties,
            rejectedProperties,
            totalUsers,
            totalManagers,
            totalTenants,
        ] = await Promise.all([
            Property.countDocuments(),
            Property.countDocuments({ status: 'pending' }),
            Property.countDocuments({ status: 'active' }),
            Property.countDocuments({ status: 'rejected' }),
            User.countDocuments(),
            User.countDocuments({ role: 'manager' }),
            User.countDocuments({ role: 'tenant' }),
        ]);

        res.json({
            totalProperties,
            pendingProperties,
            activeProperties,
            rejectedProperties,
            totalUsers,
            totalManagers,
            totalTenants,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/admin/properties?status=pending|active|rejected|all
 * List all properties with optional status filter
 */
export const getAllProperties = async (req, res) => {
    try {
        const { status = 'all', search, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status && status !== 'all') filter.status = status;
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { 'location.city': { $regex: search, $options: 'i' } },
                { 'location.area': { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [properties, total] = await Promise.all([
            Property.find(filter)
                .populate('owner', 'firstName lastName email avatar role clerkId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Property.countDocuments(filter),
        ]);

        res.json({
            properties,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * PATCH /api/admin/properties/:id/approve
 * Approve a property (set status to active, mark as verified)
 */
export const approveProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        property.status = 'active';
        property.verified = true;
        property.verificationStatus = 'verified';
        await property.save();

        res.json({ message: 'Property approved and verified', property });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * PATCH /api/admin/properties/:id/reject
 * Reject a property
 */
export const rejectProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        property.status = 'rejected';
        property.verified = false;
        property.verificationStatus = 'rejected';
        if (req.body.reason) {
            property.rejectionReason = req.body.reason;
        }
        await property.save();

        res.json({ message: 'Property rejected', property });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/admin/users?role=tenant|manager|all&search=
 * List all users with optional filters
 */
export const getAllUsers = async (req, res) => {
    try {
        const { role = 'all', search, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (role && role !== 'all') filter.role = role;
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-__v')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(filter),
        ]);

        // For managers, also get their property count
        const usersWithCounts = await Promise.all(
            users.map(async (u) => {
                const userData = u.toObject();
                if (u.role === 'manager') {
                    userData.propertyCount = await Property.countDocuments({ owner: u._id });
                }
                return userData;
            })
        );

        res.json({
            users: usersWithCounts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/admin/properties/:id
 * Get full property details for admin view
 */
export const getPropertyDetail = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id)
            .populate('owner', 'firstName lastName email avatar phone role createdAt clerkId')
            .lean();

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Fetch tenants for this property
        const applications = await Application.find({ 
            property: property._id,
            status: 'approved'
        }).populate('tenant', 'firstName lastName email phone avatar createdAt').lean();

        property.approvedTenants = applications;

        res.json(property);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * DELETE /api/admin/users/:id
 * Delete a user with 7-day property notice (admin only)
 */
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent deleting admin users
        if (user.role === 'admin') {
            return res.status(403).json({ error: 'Cannot delete admin users' });
        }

        const now = new Date();
        const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // If manager, issue 7-day notice on all their properties
        if (user.role === 'manager') {
            const properties = await Property.find({ owner: user._id });

            for (const property of properties) {
                property.suspensionNotice = {
                    issuedAt: now,
                    availableToOthersAt: sevenDaysLater,
                    vacateBy: sevenDaysLater,
                    noticeType: 'deletion',
                    acknowledged: false,
                };
                await property.save();

                // Notify tenants of these properties
                const activeTenancies = await Application.find({
                    property: property._id,
                    status: 'approved',
                }).populate('tenant');

                for (const tenancy of activeTenancies) {
                    if (tenancy.tenant) {
                        await Notification.create({
                            user: tenancy.tenant._id,
                            title: 'Property Vacate Notice - 7 Days',
                            message: `The property "${property.title}" requires vacating within 7 days due to the property owner's account being removed. Deadline: ${sevenDaysLater.toLocaleDateString('en-IN')}. Non-compliance may result in legal action.`,
                            type: 'warning',
                            link: `/tenant/properties/${property._id}`,
                        });

                        // Emit live notice to tenant
                        io.to(tenancy.tenant.clerkId).emit('property-vacate-notice', {
                            propertyId: property._id.toString(),
                            propertyTitle: property.title,
                            vacateBy: sevenDaysLater.toISOString(),
                            noticeType: 'deletion',
                        });
                    }
                }
            }
        }

        // If tenant, notify managers of properties they are currently renting
        if (user.role === 'tenant') {
            const activeTenancies = await Application.find({
                tenant: user._id,
                status: 'approved',
            }).populate('property');

            for (const tenancy of activeTenancies) {
                if (tenancy.property) {
                    await Notification.create({
                        user: tenancy.property.owner,
                        title: 'Tenant Account Removed',
                        message: `Tenant ${user.firstName} ${user.lastName} account has been removed by admin. The property "${tenancy.property.title}" will need a new tenant.`,
                        type: 'warning',
                    });
                }
            }
        }

        // Emit force-logout event to immediately sign out the user
        io.to(user.clerkId).emit('force-logout', {
            type: 'deletion',
            reason: 'Your account has been permanently removed by the administrator.',
        });

        // Also emit account-deleted for the modal display
        io.to(user.clerkId).emit('account-deleted', {
            reason: 'Your account has been permanently removed by the administrator.',
        });

        // Mark user as permanently deleted - blocks all future logins
        user.isActive = false;
        user.isDeleted = true;
        user.deletedAt = now;
        user.suspendedAt = now;
        user.suspendedReason = 'Account permanently deleted by administrator';
        await user.save();

        res.json({ message: `User ${user.firstName} ${user.lastName} deleted successfully. All login access has been revoked. 7-day property notices have been issued.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/admin/users/:id/impersonate
 * Notify a user that admin is about to impersonate their account.
 * Forces the user's current session to end.
 */
export const impersonateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ error: 'Cannot impersonate admin users' });
        }

        const adminUser = req.user;
        const adminName = `${adminUser.firstName} ${adminUser.lastName}`.trim() || 'Administrator';

        // Emit force-logout to the user being impersonated
        io.to(user.clerkId).emit('force-logout', {
            type: 'impersonation',
            reason: `The platform administrator (${adminName}) has initiated a secure session review of your account. Your current session has been temporarily ended for security purposes.`,
            adminName,
        });

        // Create a notification for the user
        await Notification.create({
            user: user._id,
            title: 'Admin Session Review',
            message: `An administrator has reviewed your account via a secure impersonation session. This is a standard platform audit procedure. If you have concerns, please contact support.`,
            type: 'info',
        });

        res.json({
            message: `User ${user.firstName} ${user.lastName} has been notified and their session has been ended.`,
            user: {
                clerkId: user.clerkId,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * DELETE /api/admin/properties/:id
 * Delete any property (admin only)
 */
export const deleteProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Remove from owner's properties array
        await User.findByIdAndUpdate(property.owner, {
            $pull: { properties: property._id },
        });

        await Property.findByIdAndDelete(req.params.id);

        res.json({ message: 'Property deleted by admin' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * PATCH /api/admin/properties/:id/verify
 * Set property verification status to verified (admin only)
 */
export const verifyProperty = async (req, res) => {
    try {
        const property = await Property.findByIdAndUpdate(
            req.params.id,
            {
                verificationStatus: 'verified',
                verified: true,
            },
            { new: true }
        );

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        res.json({ message: 'Property verified successfully', property });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * PATCH /api/admin/properties/:id/unverify
 * Unverify a property (admin only)
 */
export const unverifyProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        property.verified = false;
        property.verificationStatus = 'none';
        await property.save();

        res.json({ message: 'Property unverified', property });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * PATCH /api/admin/users/:id/status
 * Toggle a user's active status (Suspend / Activate)
 * Body: { reason } - required when suspending
 */
export const toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (user.role === 'admin') {
            return res.status(403).json({ error: 'Cannot suspend an admin user' });
        }

        const wasSuspending = user.isActive; // true means we are about to suspend
        user.isActive = !user.isActive;

        if (wasSuspending) {
            // Suspending the user
            const { reason } = req.body;
            const now = new Date();
            const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            user.suspendedAt = now;
            user.suspendedReason = reason || 'Account suspended by administrator';
            await user.save();

            // Create notification for the suspended user
            await Notification.create({
                user: user._id,
                title: 'Account Suspended',
                message: `Your account has been suspended. Reason: ${user.suspendedReason}. You may submit a reactivation request through the Help & Support section.`,
                type: 'error',
            });

            // Emit live suspension event via Socket.IO
            io.to(user.clerkId).emit('user-suspended', {
                reason: user.suspendedReason,
                suspendedAt: now.toISOString(),
            });

            // Issue 7-day property notices
            if (user.role === 'manager') {
                const properties = await Property.find({ owner: user._id, status: { $in: ['active', 'rented', 'awaiting_payment'] } });

                for (const property of properties) {
                    property.suspensionNotice = {
                        issuedAt: now,
                        availableToOthersAt: sevenDaysLater,
                        vacateBy: sevenDaysLater,
                        noticeType: 'suspension',
                        acknowledged: false,
                    };
                    // Pause the property
                    if (property.status === 'active') {
                        property.status = 'paused';
                    }
                    await property.save();

                    // Notify active tenants about the vacate notice
                    const activeTenancies = await Application.find({
                        property: property._id,
                        status: 'approved',
                    }).populate('tenant');

                    for (const tenancy of activeTenancies) {
                        if (tenancy.tenant) {
                            await Notification.create({
                                user: tenancy.tenant._id,
                                title: 'Property Vacate Notice - 7 Days',
                                message: `The property "${property.title}" requires vacating within 7 days due to the property owner's account suspension. Deadline: ${sevenDaysLater.toLocaleDateString('en-IN')}. Non-compliance may result in legal action.`,
                                type: 'warning',
                                link: `/tenant/properties/${property._id}`,
                            });

                            // Emit live vacate notice to tenant
                            io.to(tenancy.tenant.clerkId).emit('property-vacate-notice', {
                                propertyId: property._id.toString(),
                                propertyTitle: property.title,
                                vacateBy: sevenDaysLater.toISOString(),
                                noticeType: 'suspension',
                            });
                        }
                    }
                }
            }

            // If tenant is suspended, notify their landlords
            if (user.role === 'tenant') {
                const activeTenancies = await Application.find({
                    tenant: user._id,
                    status: 'approved',
                }).populate('property');

                for (const tenancy of activeTenancies) {
                    if (tenancy.property) {
                        await Notification.create({
                            user: tenancy.property.owner,
                            title: 'Tenant Suspended',
                            message: `Tenant ${user.firstName} ${user.lastName} has been suspended by the admin. Their tenancy at "${tenancy.property.title}" is subject to a 7-day vacate notice.`,
                            type: 'warning',
                        });
                    }
                }
            }

        } else {
            // Reactivating the user
            user.suspendedAt = undefined;
            user.suspendedReason = '';
            await user.save();

            // Re-activate paused properties that had suspension notices
            if (user.role === 'manager') {
                await Property.updateMany(
                    { owner: user._id, 'suspensionNotice.noticeType': 'suspension' },
                    { $unset: { suspensionNotice: 1 }, $set: { status: 'active' } }
                );
            }

            // Create notification for the reactivated user
            await Notification.create({
                user: user._id,
                title: 'Account Reactivated',
                message: 'Your account has been reactivated by the administrator. You now have full access to the platform.',
                type: 'success',
            });

            // Emit live reactivation event
            io.to(user.clerkId).emit('user-reactivated', {});
        }

        res.json({ message: `User ${user.isActive ? 'activated' : 'suspended'} successfully`, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/admin/reactivation-requests
 * Get all pending reactivation requests from suspended users
 */
export const getReactivationRequests = async (req, res) => {
    try {
        const { status = 'pending' } = req.query;

        const users = await User.find({
            'reactivationRequests': {
                $elemMatch: { status: status === 'all' ? { $exists: true } : status }
            }
        }).select('firstName lastName email avatar role suspendedAt suspendedReason reactivationRequests isActive').lean();

        // Flatten into request list with user info
        const requests = [];
        for (const user of users) {
            for (const rReq of user.reactivationRequests) {
                if (status === 'all' || rReq.status === status) {
                    requests.push({
                        _id: rReq._id,
                        userId: user._id,
                        userName: `${user.firstName} ${user.lastName}`,
                        userEmail: user.email,
                        userAvatar: user.avatar,
                        userRole: user.role,
                        userIsActive: user.isActive,
                        suspendedAt: user.suspendedAt,
                        suspendedReason: user.suspendedReason,
                        message: rReq.message,
                        status: rReq.status,
                        adminResponse: rReq.adminResponse,
                        requestedAt: rReq.requestedAt,
                        respondedAt: rReq.respondedAt,
                    });
                }
            }
        }

        // Sort by requestedAt descending
        requests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

        res.json({ requests });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * PATCH /api/admin/reactivation-requests/:userId/:requestId
 * Approve or reject a reactivation request
 * Body: { action: 'approve' | 'reject', response: string }
 */
export const handleReactivationRequest = async (req, res) => {
    try {
        const { userId, requestId } = req.params;
        const { action, response } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action. Must be approve or reject.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const request = user.reactivationRequests.id(requestId);
        if (!request) {
            return res.status(404).json({ error: 'Reactivation request not found' });
        }

        request.status = action === 'approve' ? 'approved' : 'rejected';
        request.adminResponse = response || '';
        request.respondedAt = new Date();

        if (action === 'approve') {
            user.isActive = true;
            user.suspendedAt = undefined;
            user.suspendedReason = '';

            // Re-activate suspended properties
            if (user.role === 'manager') {
                await Property.updateMany(
                    { owner: user._id, 'suspensionNotice.noticeType': 'suspension' },
                    { $unset: { suspensionNotice: 1 }, $set: { status: 'active' } }
                );
            }

            // Emit live reactivation event
            io.to(user.clerkId).emit('user-reactivated', {});
        }

        await user.save();

        // Notify the user
        await Notification.create({
            user: user._id,
            title: action === 'approve' ? 'Account Reactivated' : 'Reactivation Request Denied',
            message: action === 'approve'
                ? 'Your account reactivation request has been approved. You now have full access to the platform.'
                : `Your account reactivation request has been denied.${response ? ` Reason: ${response}` : ''} You may submit another request if you believe this was in error.`,
            type: action === 'approve' ? 'success' : 'error',
        });

        res.json({
            message: `Reactivation request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
            user,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/admin/applications
 * Get all applications across the platform
 */
export const getAllApplications = async (req, res) => {
    try {
        const { status, limit = 50 } = req.query;
        let query = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const applications = await Application.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .populate('property', 'title location.city pricing.monthlyRent images manager')
            .populate('tenant', 'firstName lastName email phone')
            .populate('manager', 'firstName lastName email phone');
            
        res.json({ applications });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * PATCH /api/admin/applications/:id/status
 * Force update the status of an application
 */
export const updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const app = await Application.findById(req.params.id);
        if (!app) return res.status(404).json({ error: 'Application not found' });

        app.status = status;
        await app.save();

        res.json({ message: `Application status updated to ${status}`, application: app });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/admin/payments
 * Get all payments globally
 */
export const getAllPayments = async (req, res) => {
    try {
        const { limit = 100 } = req.query;
        const payments = await Payment.find()
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .populate('property', 'title location.city')
            .populate('tenant', 'firstName lastName email')
            .populate('manager', 'firstName lastName email')
            .populate('invoice', 'status month year totalAmount');
            
        res.json({ payments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * PATCH /api/admin/payments/:id/refund
 * Mark a payment as refunded and reopen invoice
 */
export const refundPayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ error: 'Payment not found' });
        
        if (payment.status === 'refunded') {
            return res.status(400).json({ error: 'Already refunded' });
        }

        payment.status = 'refunded';
        await payment.save();

        // Re-open the corresponding invoice
        if (payment.invoice) {
            const invoice = await Invoice.findById(payment.invoice);
            if (invoice) {
                invoice.status = 'pending';
                await invoice.save();
            }
        }

        res.json({ message: 'Payment successfully marked as refunded.', payment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/admin/income
 * Get revenue charts/graph data
 */
export const getAdminIncomeStats = async (req, res) => {
    try {
        const { filter = 'monthly', year, month } = req.query; 
        
        let matchStage = {};
        const now = new Date();
        const tgtYear = year ? Number(year) : now.getFullYear();
        const tgtMonth = month ? Number(month) - 1 : now.getMonth();

        if (filter === 'daily') {
            // Daily for the current/selected month
            matchStage = {
                createdAt: {
                    $gte: new Date(tgtYear, tgtMonth, 1),
                    $lt: new Date(tgtYear, tgtMonth + 1, 1)
                }
            };
        } else if (filter === 'weekly') {
            // Weekly for the current/selected year (or just last 12 weeks)
            // For simplicity, let's just show the whole year grouped by week
            matchStage = {
                createdAt: {
                    $gte: new Date(tgtYear, 0, 1),
                    $lt: new Date(tgtYear + 1, 0, 1)
                }
            };
        } else if (filter === 'monthly') {
            // Monthly for the current/selected year
            matchStage = {
                createdAt: {
                    $gte: new Date(tgtYear, 0, 1),
                    $lt: new Date(tgtYear + 1, 0, 1)
                }
            };
        }
        // If yearly, matchStage is empty (all data)

        // Determine group ID based on filter
        let groupId;
        if (filter === 'daily') groupId = { $dayOfMonth: '$createdAt' };
        else if (filter === 'weekly') groupId = { $isoWeek: '$createdAt' };
        else if (filter === 'monthly') groupId = { $month: '$createdAt' };
        else groupId = { $year: '$createdAt' }; // yearly

        const aggregation = await AdminIncome.aggregate([
            { $match: matchStage },
            { 
                $group: {
                    _id: groupId,
                    credits: {
                        $sum: { $cond: [{ $eq: ['$source', 'credit_purchase'] }, '$amount', 0] }
                    },
                    commissions: {
                        $sum: { $cond: [{ $eq: ['$source', 'lease_commission'] }, '$amount', 0] }
                    },
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        // Format for Recharts 
        let chartData = [];
        
        if (filter === 'daily') {
            // Number of days in the target month
            const daysInMonth = new Date(tgtYear, tgtMonth + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                const found = aggregation.find(a => a._id === i);
                chartData.push({
                    name: `${i} ${new Date(tgtYear, tgtMonth).toLocaleString('default', { month: 'short' })}`,
                    credits: found ? found.credits : 0,
                    commissions: found ? found.commissions : 0,
                    total: found ? found.total : 0,
                });
            }
        } else if (filter === 'weekly') {
            // Usually up to 52/53 weeks in a year
            // Let's just map the existing aggregation data sequentially
            chartData = aggregation.map(a => ({
                name: `Wk ${a._id}`,
                credits: a.credits,
                commissions: a.commissions,
                total: a.total,
            }));
        } else if (filter === 'monthly') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            for (let i = 1; i <= 12; i++) {
                const found = aggregation.find(a => a._id === i);
                chartData.push({
                    name: months[i - 1],
                    credits: found ? found.credits : 0,
                    commissions: found ? found.commissions : 0,
                    total: found ? found.total : 0,
                });
            }
        } else {
            // Yearly
            chartData = aggregation.map(a => ({
                name: a._id.toString(),
                credits: a.credits,
                commissions: a.commissions,
                total: a.total,
            }));
        }

        // Fetch all income transactions
        const recentTransactions = await AdminIncome.find()
            .sort({ createdAt: -1 })
            .populate('user', 'firstName lastName email role');

        const totalLifetime = await AdminIncome.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            chartData,
            recentTransactions,
            totalLifetime: totalLifetime.length > 0 ? totalLifetime[0].total : 0,
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
