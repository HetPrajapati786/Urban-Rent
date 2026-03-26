import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Property from '../models/Property.js';
import Application from '../models/Application.js';
import Notification from '../models/Notification.js';
import AdminIncome from '../models/AdminIncome.js';
import crypto from 'crypto';

/**
 * GET /api/invoices/my
 * Get invoices for the logged-in user (tenant or manager)
 */
export const getMyInvoices = async (req, res) => {
    try {
        const { status } = req.query;
        let filter = {};

        if (req.user.role === 'tenant') {
            filter.tenant = req.user._id;
        } else if (req.user.role === 'manager') {
            filter.manager = req.user._id;
        }

        if (status && status !== 'all') {
            filter.status = status;
        }

        // Auto-mark overdue invoices
        const overdueInvoices = await Invoice.find({ status: 'pending', dueDate: { $lt: new Date() } });
        if (overdueInvoices.length > 0) {
            const overdueIds = overdueInvoices.map(i => i._id);
            const propertyIds = overdueInvoices.map(i => i.property);

            await Invoice.updateMany(
                { _id: { $in: overdueIds } },
                { $set: { status: 'overdue' } }
            );

            // Revert properties back to active if they were awaiting_payment
            await Property.updateMany(
                { _id: { $in: propertyIds }, status: 'awaiting_payment' },
                { $set: { status: 'active' } }
            );
        }

        const invoices = await Invoice.find(filter)
            .populate('property', 'title images pricing location propertyType')
            .populate('tenant', 'firstName lastName email avatar')
            .populate('manager', 'firstName lastName email')
            .populate('application', 'message moveInDate leaseDuration')
            .sort({ createdAt: -1 });

        res.json({ invoices });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/invoices/:id/pay
 * Tenant pays an invoice (Razorpay integration)
 */
export const payInvoice = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
             return res.status(400).json({ error: 'Missing payment details' });
        }
        const invoice = await Invoice.findById(req.params.id)
            .populate('property', 'title');

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        if (invoice.tenant.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to pay this invoice' });
        }

        if (invoice.status === 'paid') {
            return res.status(400).json({ error: 'Invoice is already paid' });
        }

        if (invoice.status === 'void') {
            return res.status(400).json({ error: 'Invoice has been voided' });
        }

        // Verify Razorpay Signature
        const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }

        const transactionId = razorpay_payment_id;

        // Create payment record
        const payment = await Payment.create({
            invoice: invoice._id,
            property: invoice.property._id || invoice.property,
            tenant: invoice.tenant,
            manager: invoice.manager,
            amount: invoice.totalAmount,
            method: req.body.method || 'card',
            transactionId,
            breakdown: {
                rent: invoice.rent,
                securityDeposit: invoice.securityDeposit,
                maintenanceCharges: invoice.maintenanceCharges,
            },
        });

        // Record 2% platform commission in AdminIncome
        const platformFee = Math.round(invoice.totalAmount * 0.02);
        if (platformFee > 0) {
            await AdminIncome.create({
                source: 'lease_commission',
                amount: platformFee,
                user: invoice.tenant,
                description: `2% platform fee on ₹${invoice.totalAmount} rental payment for ${invoice.property.title || 'Property'}`,
                transactionId: razorpay_payment_id
            });
        }

        // Mark invoice as paid
        invoice.status = 'paid';
        invoice.paidAt = new Date();
        invoice.paymentId = payment._id;
        await invoice.save();

        // Update Property status to rented and set leaseEndsAt
        if (invoice.property) {
            let leaseEndsAt = null;
            if (invoice.application) {
                const appObj = await Application.findById(invoice.application._id || invoice.application);
                if (appObj && appObj.moveInDate && appObj.leaseDuration) {
                    const endDate = new Date(appObj.moveInDate);
                    endDate.setMonth(endDate.getMonth() + appObj.leaseDuration);
                    leaseEndsAt = endDate;
                }
            }

            const propUpdate = { status: 'rented' };
            if (leaseEndsAt) propUpdate.leaseEndsAt = leaseEndsAt;

            await Property.findByIdAndUpdate(invoice.property._id || invoice.property, propUpdate);
        }

        // Notify Manager
        await Notification.create({
            user: invoice.manager,
            title: 'Invoice Paid',
            message: `A payment of ₹${invoice.totalAmount} was made for the property.`,
            type: 'success',
            link: '/manager/payments'
        });

        res.json({
            payment,
            invoice,
            message: 'Payment successful!',
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/invoices/payments/history
 * Payment history for the logged-in user (tenant or manager)
 */
export const getPaymentHistory = async (req, res) => {
    try {
        let filter = {};

        if (req.user.role === 'tenant') {
            filter.tenant = req.user._id;
        } else if (req.user.role === 'manager') {
            filter.manager = req.user._id;
        }

        const payments = await Payment.find(filter)
            .populate('property', 'title images location propertyType')
            .populate('tenant', 'firstName lastName email avatar')
            .populate('manager', 'firstName lastName email')
            .populate('invoice', 'rent securityDeposit maintenanceCharges dueDate')
            .sort({ createdAt: -1 });

        // Compute summary
        const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);
        const thisMonthAmount = payments
            .filter(p => new Date(p.createdAt) >= thisMonth)
            .reduce((sum, p) => sum + p.amount, 0);

        res.json({
            payments,
            summary: {
                totalAmount,
                thisMonthAmount,
                totalTransactions: payments.length,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/invoices/earnings
 * Manager earnings dashboard — only real paid invoices
 */
export const getManagerEarnings = async (req, res) => {
    try {
        const payments = await Payment.find({ manager: req.user._id })
            .populate('property', 'title images location propertyType pricing')
            .populate('tenant', 'firstName lastName email avatar')
            .sort({ createdAt: -1 });

        // Total earned
        const totalEarned = payments.reduce((sum, p) => sum + p.amount, 0);

        // This month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthPayments = payments.filter(p => new Date(p.createdAt) >= monthStart);
        const thisMonthEarned = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);

        // Pending invoices (not yet paid)
        const pendingInvoices = await Invoice.find({
            manager: req.user._id,
            status: { $in: ['pending', 'overdue'] },
        }).countDocuments();

        // Per-property breakdown
        const propertyMap = {};
        for (const p of payments) {
            const propId = p.property?._id?.toString();
            if (!propId) continue;
            if (!propertyMap[propId]) {
                propertyMap[propId] = {
                    property: p.property,
                    totalEarned: 0,
                    paymentCount: 0,
                };
            }
            propertyMap[propId].totalEarned += p.amount;
            propertyMap[propId].paymentCount += 1;
        }

        res.json({
            summary: {
                totalEarned,
                thisMonthEarned,
                pendingInvoices,
                totalTransactions: payments.length,
            },
            recentPayments: payments.slice(0, 10),
            propertyBreakdown: Object.values(propertyMap),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
/**
 * POST /api/invoices/:id/decline
 * Tenant declines their pending invoice (gives up their spot)
 */
export const declineInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('property', 'title status')
            .populate('application');

        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

        if (invoice.tenant.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (invoice.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending invoices can be declined' });
        }

        // Void the invoice
        invoice.status = 'void';
        await invoice.save();

        // Revert property to active
        await Property.findByIdAndUpdate(invoice.property._id || invoice.property, { status: 'active' });

        // Reject the associated application
        if (invoice.application) {
            await Application.findByIdAndUpdate(
                invoice.application._id || invoice.application,
                { status: 'rejected', managerNotes: 'Tenant declined the invoice.' }
            );
        }

        // Notify manager
        await Notification.create({
            user: invoice.manager,
            title: 'Invoice Declined',
            message: `The tenant declined the invoice for "${invoice.property?.title}". The property is now active again for new applicants.`,
            type: 'warning',
            link: '/manager/applications',
        });

        res.json({ message: 'Invoice declined. Property is now available again.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
