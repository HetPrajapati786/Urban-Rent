import Application from '../models/Application.js';
import Property from '../models/Property.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';

/**
 * POST /api/applications/:id/terminate/request
 * Tenant or Manager requests early termination of an active rental
 */
export const requestTermination = async (req, res) => {
    try {
        const { reason } = req.body;

        const application = await Application.findById(req.params.id)
            .populate('property', 'title status')
            .populate('tenant', 'firstName lastName')
            .populate('manager', 'firstName lastName');

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // Must be an active rental (approved + paid)
        if (application.status !== 'approved') {
            return res.status(400).json({ error: 'Only active rentals can be terminated' });
        }

        // Check property is rented
        if (application.property?.status !== 'rented') {
            return res.status(400).json({ error: 'Property is not currently rented' });
        }

        // Only tenant or manager of this application can request
        const userId = req.user._id.toString();
        const isTenant = application.tenant._id.toString() === userId;
        const isManager = application.manager._id.toString() === userId;

        if (!isTenant && !isManager) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Check if already requested
        if (application.termination?.status) {
            return res.status(400).json({ error: 'Termination already requested or processed' });
        }

        const requestedBy = isTenant ? 'tenant' : 'manager';

        application.termination = {
            requestedBy,
            requestedAt: new Date(),
            reason: reason || '',
            status: 'requested',
        };
        await application.save();

        // Notify the other party
        const notifyUserId = isTenant ? application.manager._id : application.tenant._id;
        const requesterName = isTenant
            ? `${application.tenant.firstName} ${application.tenant.lastName}`
            : `${application.manager.firstName} ${application.manager.lastName}`;

        await Notification.create({
            user: notifyUserId,
            title: 'Early Termination Requested',
            message: `${requesterName} has requested early termination for "${application.property.title}".${reason ? ` Reason: ${reason}` : ''}`,
            type: 'warning',
            link: isTenant ? '/manager/applications' : '/tenant/applications',
        });

        res.json({ message: 'Termination request submitted', application });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/applications/:id/terminate/preview
 * Preview auto-calculated termination deductions before processing
 */
export const previewTermination = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id)
            .populate('property', 'title status pricing');

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        if (application.status !== 'approved') {
            return res.status(400).json({ error: 'Only active rentals can be previewed for termination' });
        }

        const invoice = await Invoice.findOne({
            application: application._id,
            status: 'paid',
        });

        if (!invoice) {
            return res.status(400).json({ error: 'No paid invoice found for this rental' });
        }

        const securityDeposit = invoice.securityDeposit || 0;
        const monthlyRent = invoice.rent || application.property?.pricing?.monthlyRent || 0;

        // Calculate stayed duration
        let stayedDuration = 0;
        if (application.moveInDate) {
            const moveIn = new Date(application.moveInDate);
            const now = new Date();
            stayedDuration = Math.max(0, Math.ceil((now - moveIn) / (1000 * 60 * 60 * 24)));
        }

        // Auto-calculate: deduct pro-rata rent for days beyond full months
        // Full months already paid via rent, so we calculate extra days
        const fullMonthsStayed = Math.floor(stayedDuration / 30);
        const extraDays = stayedDuration - (fullMonthsStayed * 30);
        const dailyRent = monthlyRent / 30;
        const proRataDeduction = Math.round(extraDays * dailyRent);
        const autoDeduction = Math.min(proRataDeduction, securityDeposit);
        const autoRefund = Math.max(0, securityDeposit - autoDeduction);

        res.json({
            securityDeposit,
            monthlyRent,
            stayedDuration,
            fullMonthsStayed,
            extraDays,
            dailyRent: Math.round(dailyRent),
            autoDeduction,
            autoRefund,
            moveInDate: application.moveInDate,
            reason: application.termination?.reason || '',
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/applications/:id/terminate/process
 * Manager processes the termination — auto-calculates refund, updates statuses
 */
export const processTermination = async (req, res) => {
    try {
        const { deductionReason } = req.body;

        const application = await Application.findById(req.params.id)
            .populate('property', 'title status pricing')
            .populate('tenant', 'firstName lastName email')
            .populate('manager', 'firstName lastName');

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // Only the manager can process
        if (application.manager._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only the property manager can process termination' });
        }

        // Must be an approved application
        if (application.status !== 'approved') {
            return res.status(400).json({ error: 'Only active rentals can be terminated' });
        }

        // Get the paid invoice for this application to find the security deposit
        const invoice = await Invoice.findOne({
            application: application._id,
            status: 'paid',
        });

        if (!invoice) {
            return res.status(400).json({ error: 'No paid invoice found for this rental' });
        }

        const securityDeposit = invoice.securityDeposit || 0;
        const monthlyRent = invoice.rent || application.property?.pricing?.monthlyRent || 0;

        // Calculate stayed duration
        let stayedDuration = 0;
        if (application.moveInDate) {
            const moveIn = new Date(application.moveInDate);
            const now = new Date();
            stayedDuration = Math.max(0, Math.ceil((now - moveIn) / (1000 * 60 * 60 * 24)));
        }

        // ── Auto-calculate deduction based on days spent ──
        // Logic: Tenant has paid first month's rent. For early termination,
        // we calculate pro-rata rent for extra days beyond full months stayed
        // and deduct that from the security deposit. Rest is refunded.
        const fullMonthsStayed = Math.floor(stayedDuration / 30);
        const extraDays = stayedDuration - (fullMonthsStayed * 30);
        const dailyRent = monthlyRent / 30;
        const proRataDeduction = Math.round(extraDays * dailyRent);
        const autoDeduction = Math.min(proRataDeduction, securityDeposit);
        const refund = Math.max(0, securityDeposit - autoDeduction);

        const autoDeductionReason = extraDays > 0
            ? `Pro-rata rent for ${extraDays} extra day(s) at ₹${Math.round(dailyRent)}/day = ₹${autoDeduction}`
            : 'No extra days beyond full months — full security deposit refunded';

        // Update application status to terminated
        application.status = 'terminated';
        application.termination = {
            ...(application.termination || {}),
            requestedBy: application.termination?.requestedBy || 'manager',
            requestedAt: application.termination?.requestedAt || new Date(),
            reason: application.termination?.reason || '',
            status: 'processed',
            refundAmount: refund,
            deductionAmount: autoDeduction,
            deductionReason: deductionReason || autoDeductionReason,
            processedAt: new Date(),
            stayedDuration,
        };
        await application.save();

        // Create a refund payment record if refund > 0
        if (refund > 0) {
            await Payment.create({
                invoice: invoice._id,
                property: application.property._id,
                tenant: application.tenant._id,
                manager: application.manager._id,
                amount: refund,
                method: 'refund',
                transactionId: `REFUND-${application._id}-${Date.now()}`,
                breakdown: {
                    securityDeposit: refund,
                },
                status: 'refunded',
            });
        }

        // Revert property status to active
        await Property.findByIdAndUpdate(application.property._id, {
            status: 'active',
            $unset: { leaseEndsAt: 1 },
        });

        // Notify tenant
        const deductionText = autoDeduction > 0
            ? ` ₹${autoDeduction.toLocaleString()} was deducted (${autoDeductionReason}).`
            : '';

        await Notification.create({
            user: application.tenant._id,
            title: 'Rental Terminated — Refund Processed',
            message: `Your rental for "${application.property.title}" has been terminated. Stayed: ${stayedDuration} days. Refund: ₹${refund.toLocaleString()}.${deductionText}`,
            type: refund > 0 ? 'success' : 'warning',
            link: '/tenant/applications',
        });

        // Notify manager confirmation
        await Notification.create({
            user: application.manager._id,
            title: 'Termination Processed',
            message: `Rental for "${application.property.title}" terminated. Deduction: ₹${autoDeduction.toLocaleString()}, Refund: ₹${refund.toLocaleString()}. Property is now active.`,
            type: 'info',
            link: '/manager/properties',
        });

        res.json({
            message: 'Termination processed successfully',
            application,
            refundAmount: refund,
            deductionAmount: autoDeduction,
            securityDeposit,
            stayedDuration,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
