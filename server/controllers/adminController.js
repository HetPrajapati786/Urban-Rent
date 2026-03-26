import Property from '../models/Property.js';
import User from '../models/User.js';
import Application from '../models/Application.js';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import AdminIncome from '../models/AdminIncome.js';
import mongoose from 'mongoose';
import crypto from 'crypto';

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
                .populate('owner', 'firstName lastName email avatar role')
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
            .populate('owner', 'firstName lastName email avatar phone role createdAt')
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
 * Delete a user and all their properties (admin only)
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

        // If manager, delete all their properties first
        if (user.role === 'manager') {
            await Property.deleteMany({ owner: user._id });
        }

        // Delete the user
        await User.findByIdAndDelete(req.params.id);

        res.json({ message: `User ${user.firstName} ${user.lastName} deleted successfully` });
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
 * Toggle a user's active status (Suspend / Unsuspend)
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

        user.isActive = !user.isActive;
        await user.save();

        res.json({ message: `User ${user.isActive ? 'activated' : 'suspended'} successfully`, user });
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
