import Application from '../models/Application.js';
import Property from '../models/Property.js';
import Invoice from '../models/Invoice.js';
import Notification from '../models/Notification.js';

/**
 * POST /api/applications
 * Tenant applies for a property
 */
export const createApplication = async (req, res) => {
    try {
        const { propertyId, message, moveInDate, leaseDuration, formDetails } = req.body;

        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Check if already applied
        const existing = await Application.findOne({
            tenant: req.user._id,
            property: propertyId,
            status: 'pending',
        });
        if (existing) {
            return res.status(400).json({ error: 'You already have a pending application for this property.' });
        }

        const application = await Application.create({
            property: propertyId,
            tenant: req.user._id,
            manager: property.owner,
            message,
            moveInDate,
            leaseDuration,
            formDetails,
        });

        // Increment inquiries
        property.inquiries += 1;
        await property.save();

        // Notify Manager
        await Notification.create({
            user: property.owner,
            title: 'New Property Application',
            message: `${req.user.firstName} ${req.user.lastName} has applied for ${property.title}.`,
            type: 'info',
            link: '/manager/applications'
        });

        res.status(201).json({ application });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/applications/my
 * Get applications for the logged-in user (tenant sees their apps, manager sees received apps)
 */
export const getMyApplications = async (req, res) => {
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

        const applications = await Application.find(filter)
            .populate('property', 'title images pricing location propertyType status')
            .populate('tenant', 'firstName lastName email avatar phone')
            .populate('manager', 'firstName lastName email')
            .sort({ createdAt: -1 });

        // For tenant, also fetch related invoices
        if (req.user.role === 'tenant') {
            const appIds = applications.map(a => a._id);
            const invoices = await Invoice.find({ application: { $in: appIds } }).lean();
            const invoiceMap = {};
            invoices.forEach(inv => { invoiceMap[inv.application.toString()] = inv; });

            const appsWithInvoices = applications.map(a => {
                const appObj = a.toObject();
                appObj.invoice = invoiceMap[a._id.toString()] || null;
                return appObj;
            });
            return res.json({ applications: appsWithInvoices });
        }

        res.json({ applications });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * PATCH /api/applications/:id/respond
 * Manager approves or rejects an application
 * On approval → auto-creates an Invoice with 7-day deadline
 */
export const respondToApplication = async (req, res) => {
    try {
        const { status, managerNotes } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
        }

        const application = await Application.findById(req.params.id)
            .populate('property');
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        if (application.manager.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to respond to this application' });
        }

        // Pre-validation for approval — skip if this is a waitlist promotion (primary invoice already declined)
        const isWaitlistPromotion = application.status === 'waitlist';
        if (status === 'approved' && application.property && !isWaitlistPromotion) {
            if (application.property.status === 'awaiting_payment') {
                return res.status(400).json({ error: 'Cannot approve: Property is awaiting payment from another applicant. Add this applicant to the waitlist instead.' });
            }
            if (application.property.status === 'rented') {
                return res.status(400).json({ error: 'Cannot approve: Property is already rented.' });
            }
        }

        application.status = status;
        application.managerNotes = managerNotes || '';
        application.respondedAt = new Date();
        await application.save();

        // Auto-create invoice on approval
        let invoice = null;
        if (status === 'approved' && application.property) {
            const pricing = application.property.pricing || {};
            const rent = pricing.monthlyRent || 0;
            const securityDeposit = pricing.securityDeposit || 0;
            const maintenanceCharges = pricing.maintenanceCharges || 0;
            const totalAmount = rent + securityDeposit + maintenanceCharges;

            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7);

            invoice = await Invoice.create({
                application: application._id,
                property: application.property._id,
                tenant: application.tenant,
                manager: application.manager,
                rent,
                securityDeposit,
                maintenanceCharges,
                totalAmount,
                dueDate,
            });

            // Update property status to awaiting_payment
            application.property.status = 'awaiting_payment';
            await application.property.save();
        }

        // Notify Tenant
        await Notification.create({
            user: application.tenant,
            title: status === 'approved' ? 'Application Approved' : 'Application Rejected',
            message: `Your application for ${application.property?.title} was ${status}.`,
            type: status === 'approved' ? 'success' : 'error',
            link: '/tenant/applications'
        });

        res.json({ application, invoice });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * PATCH /api/applications/:id/withdraw
 * Tenant withdraws their application
 */
export const withdrawApplication = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        if (application.tenant.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        application.status = 'withdrawn';
        await application.save();

        res.json({ application });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
/**
 * PATCH /api/applications/:id/waitlist
 * Manager formally moves a pending applicant to the waitlist
 */
export const waitlistApplication = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id)
            .populate('property')
            .populate('tenant', 'firstName lastName email');

        if (!application) return res.status(404).json({ error: 'Application not found' });

        if (application.manager.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (application.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending applications can be waitlisted' });
        }

        application.status = 'waitlist';
        application.respondedAt = new Date();
        await application.save();

        await Notification.create({
            user: application.tenant._id || application.tenant,
            title: 'Added to Waitlist',
            message: `You have been added to the waitlist for "${application.property?.title}". You will be notified if the current applicant does not complete payment.`,
            type: 'info',
            link: '/tenant/applications',
        });

        res.json({ application });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
