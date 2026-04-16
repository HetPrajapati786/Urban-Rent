import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema(
    {
        // ─── Owner ───
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        // ─── Step 1: Basic Info ───
        title: { type: String, required: true, trim: true },
        propertyType: {
            type: String,
            enum: ['House', 'Apartment', 'Shop', 'Office', 'Factory', 'Warehouse'],
            required: true,
        },
        category: {
            type: String,
            enum: ['Residential', 'Commercial', 'PG/Hostel'],
            default: 'Residential',
        },
        listingType: {
            type: String,
            enum: ['Rent', 'Lease'],
            default: 'Rent',
        },
        description: { type: String, required: true },

        // ─── Step 2: Location ───
        location: {
            country: { type: String, default: 'India' },
            state: { type: String, required: true },
            city: { type: String, required: true },
            area: { type: String, required: true },
            fullAddress: { type: String, required: true },
            pinCode: { type: String, required: true },
            coordinates: {
                lat: { type: Number },
                lng: { type: Number },
            },
        },

        // ─── Step 3: Property Details (Residential) ───
        residential: {
            bhkType: { type: String },
            totalRooms: { type: Number },
            bathrooms: { type: Number },
            balconies: { type: Number },
            floorNumber: { type: Number },
            totalFloors: { type: Number },
            furnishing: {
                type: String,
                enum: ['Furnished', 'Semi-Furnished', 'Unfurnished', ''],
                default: '',
            },
        },

        // ─── Step 3: Property Details (Commercial) ───
        commercial: {
            totalArea: { type: Number },
            areaUnit: { type: String, enum: ['sq ft', 'sq meter'], default: 'sq ft' },
            parkingAvailability: { type: Boolean, default: false },
            powerSupplyCapacity: { type: String },
            loadingArea: { type: String },
        },

        // ─── Step 4: Pricing ───
        pricing: {
            monthlyRent: { type: Number, required: true },
            securityDeposit: { type: Number, default: 0 },
            maintenanceCharges: { type: Number, default: 0 },
            minimumLeaseDuration: { type: Number },
            availableFrom: { type: Date },
        },

        // ─── Step 5: Amenities ───
        amenities: [{ type: String }],

        // ─── Step 6: Media ───
        images: [
            {
                url: { type: String, required: true },
                publicId: { type: String }, // Cloudinary public_id
            },
        ],
        video: {
            url: { type: String },
            publicId: { type: String },
        },
        floorPlan: {
            url: { type: String },
            publicId: { type: String },
        },

        // ─── Step 7: Ownership & Verification ───
        ownership: {
            ownerName: { type: String },
            ownerContact: { type: String },
            ownerEmail: { type: String },
            documents: {
                ownershipProof: { url: String, publicId: String },
                propertyDocument: { url: String, publicId: String },
                electricityBill: { url: String, publicId: String },
                taxReceipt: { url: String, publicId: String },
            },
        },

        // ─── Step 8: Additional ───
        additional: {
            nearbyLandmarks: { type: String },
            preferredTenantType: [{ type: String }],
            petAllowed: { type: Boolean, default: false },
            smokingAllowed: { type: Boolean, default: false },
        },

        // ─── Status & Features ───
        status: {
            type: String,
            enum: ['pending', 'active', 'paused', 'rejected', 'awaiting_payment', 'rented'],
            default: 'pending',
        },
        verified: { type: Boolean, default: false },
        verificationStatus: {
            type: String,
            enum: ['none', 'requested', 'in_review', 'verified', 'rejected'],
            default: 'none',
        },
        boosted: { type: Boolean, default: false },
        boostExpiresAt: { type: Date },
        leaseEndsAt: { type: Date }, // set when property is rented, so tenants know availability

        // ─── Analytics ───
        views: { type: Number, default: 0 },
        inquiries: { type: Number, default: 0 },
        savedCount: { type: Number, default: 0 },

        // ─── Suspension Notice ───
        suspensionNotice: {
            issuedAt: { type: Date },
            availableToOthersAt: { type: Date }, // 7 days after issuedAt
            vacateBy: { type: Date }, // 7 days from notice
            noticeType: { type: String, enum: ['suspension', 'deletion'] },
            acknowledged: { type: Boolean, default: false },
        },
    },
    { timestamps: true }
);

// Indexes for common queries
propertySchema.index({ 'location.city': 1, 'pricing.monthlyRent': 1 });
propertySchema.index({ propertyType: 1, status: 1 });
propertySchema.index({ boosted: -1, createdAt: -1 });

export default mongoose.model('Property', propertySchema);
