import Property from '../models/Property.js';
import Application from '../models/Application.js';
import Invoice from '../models/Invoice.js';

/**
 * GET /api/dashboard/manager
 * Aggregated dashboard data for the logged-in manager
 */
export const getManagerDashboard = async (req, res) => {
    try {
        const managerId = req.user._id;

        // Get all manager's properties
        const properties = await Property.find({ owner: managerId })
            .sort({ createdAt: -1 })
            .lean();

        // Get applications for this manager
        const applications = await Application.find({ manager: managerId })
            .populate('property', 'title images pricing location propertyType')
            .populate('tenant', 'firstName lastName email avatar phone')
            .sort({ createdAt: -1 })
            .lean();

        // Need invoices to know which approved applications actually paid
        const paidInvoices = await Invoice.find({ manager: managerId, status: 'paid' }).lean();
        const paidApplicationIds = new Set(paidInvoices.map(inv => inv.application?.toString()));

        // ─── Compute Stats ───
        const totalProperties = properties.length;
        const activeListings = properties.filter(p => p.status === 'active').length;
        const pendingListings = properties.filter(p => p.status === 'pending').length;
        const pausedListings = properties.filter(p => p.status === 'paused').length;
        const verifiedProperties = properties.filter(p => p.verified).length;
        const boostedProperties = properties.filter(p => p.boosted).length;

        const totalViews = properties.reduce((sum, p) => sum + (p.views || 0), 0);
        const totalInquiries = properties.reduce((sum, p) => sum + (p.inquiries || 0), 0);

        // Monthly revenue = sum of monthlyRent from active properties
        const monthlyRevenue = properties
            .filter(p => p.status === 'active')
            .reduce((sum, p) => sum + (p.pricing?.monthlyRent || 0), 0);

        // Application stats
        const pendingApplications = applications.filter(a => a.status === 'pending');
        const trueActiveTenants = applications.filter(a => a.status === 'approved' && paidApplicationIds.has(a._id.toString()));
        const totalApplications = applications.length;

        // ─── Properties with their approved tenants ───
        const propertiesWithTenants = properties.map(property => {
            const propertyApps = applications.filter(
                a => a.property?._id?.toString() === property._id.toString() ||
                    a.property?.toString() === property._id.toString()
            );
            return {
                ...property,
                approvedTenants: propertyApps.filter(a => a.status === 'approved' && paidApplicationIds.has(a._id.toString())),
                pendingApplications: propertyApps.filter(a => a.status === 'pending').length,
            };
        });

        res.json({
            stats: {
                totalProperties,
                activeListings,
                pendingListings,
                pausedListings,
                verifiedProperties,
                boostedProperties,
                totalViews,
                totalInquiries,
                monthlyRevenue,
                totalApplications,
                pendingApplicationsCount: pendingApplications.length,
                approvedTenantsCount: trueActiveTenants.length,
            },
            recentApplications: pendingApplications.slice(0, 5),
            properties: propertiesWithTenants,
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: error.message });
    }
};
