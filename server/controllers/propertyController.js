import Property from '../models/Property.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';

/**
 * Check if Cloudinary is configured
 */
const isCloudinaryConfigured = () => {
    return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
};

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop';

/**
 * Helper: Upload buffer to Cloudinary
 */
const uploadToCloudinary = (buffer, folder, resourceType = 'image') => {
    if (!isCloudinaryConfigured()) {
        console.log(`Cloudinary not configured — returning placeholder for ${folder}`);
        // Return placeholder for images, empty for others
        const url = folder === 'properties' ? PLACEHOLDER_IMAGE : '';
        return Promise.resolve({ url, publicId: '' });
    }
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: `urbanrent/${folder}`, resource_type: resourceType },
            (error, result) => {
                if (error) reject(error);
                else resolve({ url: result.secure_url, publicId: result.public_id });
            }
        );
        stream.end(buffer);
    });
};

/**
 * POST /api/properties
 * Create a new property (Manager only)
 */
export const createProperty = async (req, res) => {
    console.log('--- Create Property Start ---');
    console.log('User:', req.user?._id, req.user?.role);
    console.log('Body Fields:', Object.keys(req.body));

    try {
        const propertyDataStr = req.body.propertyData;
        console.log('Raw propertyData string:', propertyDataStr ? (propertyDataStr.substring(0, 100) + '...') : 'undefined');

        const propertyData = JSON.parse(propertyDataStr || '{}');
        console.log('Parsed title:', propertyData.title);

        // Upload images
        let images = [];
        if (req.files?.images) {
            console.log(`Processing ${req.files.images.length} images...`);
            const uploadPromises = req.files.images.map(file =>
                uploadToCloudinary(file.buffer, 'properties')
            );
            images = await Promise.all(uploadPromises);
        }

        // Upload video
        let video = {};
        if (req.files?.video?.[0]) {
            video = await uploadToCloudinary(req.files.video[0].buffer, 'videos', 'video');
        }

        // Upload floor plan
        let floorPlan = {};
        if (req.files?.floorPlan?.[0]) {
            floorPlan = await uploadToCloudinary(req.files.floorPlan[0].buffer, 'properties');
        }

        // Upload documents
        let documents = {};
        const docFields = ['ownershipProof', 'propertyDocument', 'electricityBill', 'taxReceipt'];
        for (const field of docFields) {
            if (req.files?.[field]?.[0]) {
                documents[field] = await uploadToCloudinary(req.files[field][0].buffer, 'documents');
            }
        }

        console.log('Final mapping to Property model...');
        const property = await Property.create({
            owner: req.user._id,
            title: propertyData.title,
            propertyType: propertyData.propertyType,
            listingType: propertyData.listingType || 'Rent',
            description: propertyData.description,
            location: {
                country: propertyData.country || 'India',
                state: propertyData.state,
                city: propertyData.city,
                area: propertyData.area,
                fullAddress: propertyData.fullAddress,
                pinCode: propertyData.pinCode,
                coordinates: {
                    lat: propertyData.latitude ? parseFloat(propertyData.latitude) : undefined,
                    lng: propertyData.longitude ? parseFloat(propertyData.longitude) : undefined,
                },
            },
            residential: {
                bhkType: propertyData.bhkType,
                totalRooms: propertyData.totalRooms ? parseInt(propertyData.totalRooms) : undefined,
                bathrooms: propertyData.bathrooms ? parseInt(propertyData.bathrooms) : undefined,
                balconies: propertyData.balconies ? parseInt(propertyData.balconies) : undefined,
                floorNumber: propertyData.floorNumber ? parseInt(propertyData.floorNumber) : undefined,
                totalFloors: propertyData.totalFloors ? parseInt(propertyData.totalFloors) : undefined,
                furnishing: propertyData.furnishing,
            },
            commercial: {
                totalArea: propertyData.totalArea ? parseFloat(propertyData.totalArea) : undefined,
                areaUnit: propertyData.areaUnit || 'sq ft',
                parkingAvailability: propertyData.parkingAvailability === true,
                powerSupplyCapacity: propertyData.powerSupplyCapacity,
                loadingArea: propertyData.loadingArea,
            },
            pricing: {
                monthlyRent: parseFloat(propertyData.monthlyRent),
                securityDeposit: propertyData.securityDeposit ? parseFloat(propertyData.securityDeposit) : 0,
                maintenanceCharges: propertyData.maintenanceCharges ? parseFloat(propertyData.maintenanceCharges) : 0,
                minimumLeaseDuration: propertyData.minimumLeaseDuration ? parseInt(propertyData.minimumLeaseDuration) : undefined,
                availableFrom: propertyData.availableFrom || undefined,
            },
            amenities: propertyData.amenities || [],
            images,
            video,
            floorPlan,
            ownership: {
                ownerName: propertyData.ownerName,
                ownerContact: propertyData.ownerContact,
                ownerEmail: propertyData.ownerEmail,
                documents,
            },
            additional: {
                nearbyLandmarks: propertyData.nearbyLandmarks,
                preferredTenantType: propertyData.preferredTenantType || [],
                petAllowed: propertyData.petAllowed === true,
                smokingAllowed: propertyData.smokingAllowed === true,
            },
            status: 'pending',
        });

        console.log('Property created successfully:', property._id);

        // Add to manager's property list
        await User.findByIdAndUpdate(req.user._id, {
            $push: { properties: property._id },
        });

        res.status(201).json({ property });
    } catch (error) {
        console.error('--- Create Property Error ---');
        console.error('Error name:', error.name);
        console.error('Message:', error.message);
        if (error.errors) console.error('Validation errors:', Object.keys(error.errors));
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/properties
 * Get all properties (public — supports search, filter, pagination)
 */
export const getProperties = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            search,
            city,
            propertyType,
            minRent,
            maxRent,
            furnishing,
            bhkType,
            verified,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = req.query;

        const filter = { status: { $in: ['active', 'awaiting_payment'] } };

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { 'location.area': { $regex: search, $options: 'i' } },
                { 'location.city': { $regex: search, $options: 'i' } },
            ];
        }

        if (city) filter['location.city'] = { $regex: city, $options: 'i' };
        if (propertyType) filter.propertyType = propertyType;
        if (furnishing) filter['residential.furnishing'] = furnishing;
        if (bhkType) filter['residential.bhkType'] = bhkType;
        if (verified === 'true') filter.verified = true;
        if (minRent || maxRent) {
            filter['pricing.monthlyRent'] = {};
            if (minRent) filter['pricing.monthlyRent'].$gte = parseInt(minRent);
            if (maxRent) filter['pricing.monthlyRent'].$lte = parseInt(maxRent);
        }

        const sort = {};
        // Boosted properties first
        sort.boosted = -1;
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [properties, total] = await Promise.all([
            Property.find(filter)
                .populate('owner', 'firstName lastName avatar phone')
                .sort(sort)
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
 * GET /api/properties/my
 * Get all properties owned by the logged-in manager
 */
export const getMyProperties = async (req, res) => {
    try {
        const { status, search } = req.query;

        const filter = { owner: req.user._id };
        if (status && status !== 'all') filter.status = status;
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { 'location.area': { $regex: search, $options: 'i' } },
            ];
        }

        const properties = await Property.find(filter).sort({ createdAt: -1 });

        res.json({ properties });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/properties/feed
 * Get curated property feed for tenant home page
 */
export const getPropertyFeed = async (req, res) => {
    try {
        const [featured, mostViewed, latest] = await Promise.all([
            // Featured = boosted properties
            Property.find({ status: { $in: ['active', 'awaiting_payment', 'rented'] }, boosted: true })
                .populate('owner', 'firstName lastName avatar')
                .sort({ boostExpiresAt: -1 })
                .limit(6)
                .lean(),
            // Most viewed
            Property.find({ status: { $in: ['active', 'awaiting_payment', 'rented'] } })
                .populate('owner', 'firstName lastName avatar')
                .sort({ views: -1 })
                .limit(6)
                .lean(),
            // Latest
            Property.find({ status: { $in: ['active', 'awaiting_payment', 'rented'] } })
                .populate('owner', 'firstName lastName avatar')
                .sort({ createdAt: -1 })
                .limit(6)
                .lean(),
        ]);

        res.json({ featured, mostViewed, latest });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/properties/:id
 * Get single property by ID (read-only, no side effects)
 */
export const getPropertyById = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id)
            .populate('owner', 'firstName lastName avatar phone email');

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        res.json({ property });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/properties/:id/view
 * Increment property views (tenant only — managers/owners are excluded)
 */
export const incrementPropertyViews = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Only tenants can increment views, not managers/owners
        if (req.user.role !== 'tenant') {
            return res.json({ message: 'View not counted for managers', views: property.views });
        }

        // Don't count if the viewer is somehow the owner
        if (property.owner.toString() === req.user._id.toString()) {
            return res.json({ message: 'View not counted for owner', views: property.views });
        }

        property.views += 1;
        await property.save();

        res.json({ message: 'View counted', views: property.views });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * PUT /api/properties/:id
 * Update a property (owner only)
 */
export const updateProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        if (property.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to edit this property' });
        }

        // Parse the JSON property data from FormData
        const updates = JSON.parse(req.body.propertyData || '{}');

        // Parse existing images the user chose to keep
        let keptImages = [];
        try {
            keptImages = JSON.parse(req.body.existingImages || '[]');
        } catch { keptImages = []; }

        // Upload new images to Cloudinary
        let newImages = [];
        if (req.files?.images) {
            const uploadPromises = req.files.images.map(file =>
                uploadToCloudinary(file.buffer, 'properties')
            );
            newImages = await Promise.all(uploadPromises);
        }

        // Merge kept existing images with newly uploaded images
        const finalImages = [...keptImages, ...newImages];

        // Apply all updates
        Object.assign(property, {
            title: updates.title,
            propertyType: updates.propertyType,
            listingType: updates.listingType,
            description: updates.description,
            location: updates.location,
            residential: updates.residential,
            commercial: updates.commercial,
            pricing: updates.pricing,
            amenities: updates.amenities,
            ownership: updates.ownership,
            additional: updates.additional,
            images: finalImages,
        });

        await property.save();

        res.json({ property });
    } catch (error) {
        console.error('Update Property Error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * DELETE /api/properties/:id
 * Delete a property (owner only)
 */
export const deleteProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        if (property.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to delete this property' });
        }

        // Remove images from Cloudinary (if configured)
        if (isCloudinaryConfigured()) {
            for (const img of property.images) {
                if (img.publicId) {
                    try { await cloudinary.uploader.destroy(img.publicId); } catch { /* ignore */ }
                }
            }
        }

        await Property.findByIdAndDelete(req.params.id);

        // Remove from user's properties array
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { properties: property._id },
        });

        res.json({ message: 'Property deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * PATCH /api/properties/:id/status
 * Toggle property status (pause/resume)
 */
export const togglePropertyStatus = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property || property.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        property.status = property.status === 'paused' ? 'active' : 'paused';
        await property.save();

        res.json({ property });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * PATCH /api/properties/:id/boost
 * Boost a property using credits
 * Body: { duration: 7 | 30 }
 * Costs: 7 days = 10 credits, 30 days = 25 credits
 */
export const toggleBoost = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property || property.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // If already boosted, allow un-boosting (no refund)
        if (property.boosted) {
            property.boosted = false;
            property.boostExpiresAt = null;
            await property.save();
            return res.json({ property, message: 'Boost removed' });
        }

        // Boost costs
        const BOOST_COSTS = { 7: 10, 30: 25 };
        const duration = parseInt(req.body.duration) || 7;
        const cost = BOOST_COSTS[duration] || BOOST_COSTS[7];

        // Check credits
        const user = await User.findById(req.user._id);
        if (!user || user.credits < cost) {
            return res.status(400).json({
                error: `Insufficient credits. Need ${cost} credits, you have ${user?.credits || 0}.`,
                creditsNeeded: cost,
                creditsAvailable: user?.credits || 0,
            });
        }

        // Deduct credits and boost
        user.credits -= cost;
        await user.save();

        property.boosted = true;
        property.boostExpiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
        await property.save();

        res.json({
            property,
            message: `Property boosted for ${duration} days`,
            creditsUsed: cost,
            creditsRemaining: user.credits,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * PATCH /api/properties/:id/verify
 * Request verification for a property
 */
export const requestVerification = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property || property.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        property.verificationStatus = 'requested';
        await property.save();

        res.json({ property });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
