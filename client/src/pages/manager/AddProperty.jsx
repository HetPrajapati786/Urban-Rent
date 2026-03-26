import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import ManagerLayout from '../../layouts/ManagerLayout';
import { apiPostForm, apiGet, apiPut, apiPutForm } from '../../utils/api';

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return position === null ? null : (
        <Marker position={position} />
    );
}

const PROPERTY_TYPES = ['House', 'Apartment', 'Shop', 'Office', 'Factory', 'Warehouse'];
const LISTING_TYPES = ['Rent', 'Lease'];
const FURNISHING_TYPES = ['Furnished', 'Semi-Furnished', 'Unfurnished'];
const BHK_TYPES = ['1 RK', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '4+ BHK'];
const TENANT_TYPES = ['Family', 'Bachelor', 'Business'];
const VERIFICATION_STATUSES = ['Pending', 'Verified', 'Rejected'];

const AMENITIES = [
    { id: 'parking', label: 'Parking', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v10m0-10h4a3 3 0 010 6H8" /><rect x="2" y="2" width="20" height="20" rx="3" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></svg> },
    { id: 'lift', label: 'Lift', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={1.5} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v18M8 8l-2 3h4l-2 3M16 10l2-3h-4l2-3" /></svg> },
    { id: 'waterSupply', label: 'Water Supply', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21c-3.5 0-6-2.5-6-6 0-4 6-11 6-11s6 7 6 11c0 3.5-2.5 6-6 6z" /></svg> },
    { id: 'powerBackup', label: 'Power Backup', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg> },
    { id: 'cctv', label: 'CCTV', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
    { id: 'securityGuard', label: 'Security Guard', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
    { id: 'internet', label: 'Internet', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" /></svg> },
    { id: 'airConditioning', label: 'Air Conditioning', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg> },
    { id: 'fireSafety', label: 'Fire Safety', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg> },
    { id: 'washroom', label: 'Washroom', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h18M3 12v4a4 4 0 004 4h10a4 4 0 004-4v-4M3 12V8a4 4 0 014-4h1m8 16v2m-4-2v2" /></svg> },
];

const STEPS = [
    { id: 1, title: 'Basic Info', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { id: 2, title: 'Location', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { id: 3, title: 'Details', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
    { id: 4, title: 'Pricing', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 5, title: 'Amenities', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> },
    { id: 6, title: 'Media', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { id: 7, title: 'Verification', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
    { id: 8, title: 'Additional', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> },
];

// Helper for determining if property type is commercial
function isCommercial(type) {
    return ['Shop', 'Office', 'Factory', 'Warehouse'].includes(type);
}

export default function AddProperty() {
    const navigate = useNavigate();
    const { id: editId } = useParams();
    const isEditMode = !!editId;
    const [currentStep, setCurrentStep] = useState(1);
    const [validationErrors, setValidationErrors] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [isLoadingProperty, setIsLoadingProperty] = useState(false);
    const [formData, setFormData] = useState({
        // Step 1: Basic Info
        title: '',
        propertyType: '',
        listingType: 'Rent',
        description: '',

        // Step 2: Location
        country: 'India',
        state: '',
        city: '',
        area: '',
        fullAddress: '',
        pinCode: '',
        latitude: '',
        longitude: '',

        // Step 3: Property Details (Housing)
        bhkType: '',
        totalRooms: '',
        bathrooms: '',
        balconies: '',
        floorNumber: '',
        totalFloors: '',
        furnishing: '',

        // Step 3: Property Details (Commercial)
        totalArea: '',
        areaUnit: 'sq ft',
        parkingAvailability: false,
        powerSupplyCapacity: '',
        loadingArea: '',

        // Step 4: Pricing
        monthlyRent: '',
        securityDeposit: '',
        maintenanceCharges: '',
        minimumLeaseDuration: '',
        availableFrom: '',

        // Step 5: Amenities
        amenities: [],

        // Step 6: Media
        images: [],
        video: null,
        floorPlan: null,

        // Step 7: Verification
        ownerName: '',
        ownerContact: '',
        ownerEmail: '',
        ownershipProof: null,
        propertyDocument: null,
        electricityBill: null,
        taxReceipt: null,
        verificationStatus: 'Pending',

        // Step 8: Additional
        nearbyLandmarks: '',
        preferredTenantType: [],
        petAllowed: false,
        smokingAllowed: false,
    });

    const fileInputRef = useRef(null);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [floorPlanPreview, setFloorPlanPreview] = useState(null);
    const [existingImages, setExistingImages] = useState([]);

    // ─── Load existing property data in edit mode ───
    useEffect(() => {
        if (!isEditMode) return;
        const loadProperty = async () => {
            setIsLoadingProperty(true);
            try {
                const data = await apiGet(`/properties/${editId}`);
                const p = data.property;
                setFormData({
                    title: p.title || '',
                    propertyType: p.propertyType || '',
                    listingType: p.listingType || 'Rent',
                    description: p.description || '',
                    country: p.location?.country || 'India',
                    state: p.location?.state || '',
                    city: p.location?.city || '',
                    area: p.location?.area || '',
                    fullAddress: p.location?.fullAddress || '',
                    pinCode: p.location?.pinCode || '',
                    latitude: p.location?.coordinates?.lat || '',
                    longitude: p.location?.coordinates?.lng || '',
                    bhkType: p.residential?.bhkType || '',
                    totalRooms: p.residential?.totalRooms || '',
                    bathrooms: p.residential?.bathrooms || '',
                    balconies: p.residential?.balconies || '',
                    floorNumber: p.residential?.floorNumber || '',
                    totalFloors: p.residential?.totalFloors || '',
                    furnishing: p.residential?.furnishing || '',
                    totalArea: p.commercial?.totalArea || '',
                    areaUnit: p.commercial?.areaUnit || 'sq ft',
                    parkingAvailability: p.commercial?.parkingAvailability || false,
                    powerSupplyCapacity: p.commercial?.powerSupplyCapacity || '',
                    loadingArea: p.commercial?.loadingArea || '',
                    monthlyRent: p.pricing?.monthlyRent || '',
                    securityDeposit: p.pricing?.securityDeposit || '',
                    maintenanceCharges: p.pricing?.maintenanceCharges || '',
                    minimumLeaseDuration: p.pricing?.minimumLeaseDuration || '',
                    availableFrom: p.pricing?.availableFrom ? new Date(p.pricing.availableFrom).toISOString().split('T')[0] : '',
                    amenities: p.amenities || [],
                    images: [],
                    video: null,
                    floorPlan: null,
                    ownerName: p.ownership?.ownerName || '',
                    ownerContact: p.ownership?.ownerContact || '',
                    ownerEmail: p.ownership?.ownerEmail || '',
                    ownershipProof: p.ownership?.ownershipProof || null,
                    propertyDocument: p.ownership?.propertyDocument || null,
                    electricityBill: p.ownership?.electricityBill || null,
                    taxReceipt: p.ownership?.taxReceipt || null,
                    verificationStatus: p.verificationStatus || (p.verified ? 'Verified' : 'Pending'),
                    nearbyLandmarks: p.additional?.nearbyLandmarks || '',
                    preferredTenantType: p.additional?.preferredTenantType || [],
                    petAllowed: p.additional?.petAllowed || false,
                    smokingAllowed: p.additional?.smokingAllowed || false,
                });
                // Set existing images from server
                if (p.images?.length > 0) {
                    setExistingImages(p.images);
                    setImagePreviews(p.images.map(img => img.url));
                }
                if (p.floorPlan?.url) {
                    setFloorPlanPreview(p.floorPlan.url);
                }
            } catch (err) {
                console.error('Failed to load property:', err);
                setSubmitError('Failed to load property data for editing.');
            } finally {
                setIsLoadingProperty(false);
            }
        };
        loadProperty();
    }, [editId, isEditMode]);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleAmenity = (amenityId) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenityId)
                ? prev.amenities.filter(id => id !== amenityId)
                : [...prev.amenities, amenityId],
        }));
    };

    const toggleTenantType = (type) => {
        setFormData(prev => ({
            ...prev,
            preferredTenantType: prev.preferredTenantType.includes(type)
                ? prev.preferredTenantType.filter(t => t !== type)
                : [...prev.preferredTenantType, type],
        }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const newImages = [...formData.images, ...files];
        updateField('images', newImages);

        // Generate previews
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        if (isEditMode) {
            const existingCount = existingImages.length;
            if (index < existingCount) {
                // Remove an existing image
                setExistingImages(prev => prev.filter((_, i) => i !== index));
            } else {
                // Remove a newly added image
                const newIndex = index - existingCount;
                updateField('images', formData.images.filter((_, i) => i !== newIndex));
            }
        } else {
            updateField('images', formData.images.filter((_, i) => i !== index));
        }
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleFloorPlanUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            updateField('floorPlan', file);
            const reader = new FileReader();
            reader.onloadend = () => setFloorPlanPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    // ─── Step Validation ───
    const validateStep = (step) => {
        const errors = [];
        switch (step) {
            case 1:
                if (!formData.title.trim()) errors.push('Property Title is required');
                if (!formData.propertyType) errors.push('Property Type is required');
                if (!formData.description.trim()) errors.push('Description is required');
                break;
            case 2:
                if (!formData.state.trim()) errors.push('State is required');
                if (!formData.city.trim()) errors.push('City is required');
                if (!formData.area.trim()) errors.push('Area / Locality is required');
                if (!formData.fullAddress.trim()) errors.push('Full Address is required');
                if (!formData.pinCode.trim()) errors.push('PIN Code is required');
                break;
            case 3:
                if (isCommercial(formData.propertyType)) {
                    if (!formData.totalArea) errors.push('Total Area is required for commercial properties');
                } else {
                    if (!formData.bhkType) errors.push('BHK Type is required');
                    if (!formData.bathrooms) errors.push('Number of Bathrooms is required');
                }
                break;
            case 4:
                if (!formData.monthlyRent) errors.push('Monthly Rent is required');
                break;
            case 5:
                break; // Amenities are optional
            case 6:
                if (formData.images.length === 0 && existingImages.length === 0) errors.push('At least 1 property image is required');
                break;
            case 7:
                if (!formData.ownerName.trim()) errors.push('Owner Name is required');
                if (!formData.ownerContact.trim()) errors.push('Owner Contact is required');
                break;
            case 8:
                break; // Additional info is optional
            default:
                break;
        }
        return errors;
    };

    const handleSubmit = async () => {
        // Validate final step
        const errors = validateStep(currentStep);
        if (errors.length > 0) {
            setValidationErrors(errors);
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');

        try {
            const isDemo = window.location.pathname.startsWith('/demo');

            if (isEditMode) {
                // Edit mode: send FormData via PUT (supports new image uploads)
                const { images, video, floorPlan, ownershipProof, propertyDocument, electricityBill, taxReceipt, ...rest } = formData;
                const updateData = {
                    title: rest.title,
                    propertyType: rest.propertyType,
                    listingType: rest.listingType,
                    description: rest.description,
                    location: {
                        country: rest.country,
                        state: rest.state,
                        city: rest.city,
                        area: rest.area,
                        fullAddress: rest.fullAddress,
                        pinCode: rest.pinCode,
                        coordinates: {
                            lat: rest.latitude ? parseFloat(rest.latitude) : undefined,
                            lng: rest.longitude ? parseFloat(rest.longitude) : undefined,
                        },
                    },
                    residential: {
                        bhkType: rest.bhkType,
                        totalRooms: rest.totalRooms ? parseInt(rest.totalRooms) : undefined,
                        bathrooms: rest.bathrooms ? parseInt(rest.bathrooms) : undefined,
                        balconies: rest.balconies ? parseInt(rest.balconies) : undefined,
                        floorNumber: rest.floorNumber ? parseInt(rest.floorNumber) : undefined,
                        totalFloors: rest.totalFloors ? parseInt(rest.totalFloors) : undefined,
                        furnishing: rest.furnishing,
                    },
                    commercial: {
                        totalArea: rest.totalArea ? parseFloat(rest.totalArea) : undefined,
                        areaUnit: rest.areaUnit,
                        parkingAvailability: rest.parkingAvailability,
                        powerSupplyCapacity: rest.powerSupplyCapacity,
                        loadingArea: rest.loadingArea,
                    },
                    pricing: {
                        monthlyRent: parseFloat(rest.monthlyRent),
                        securityDeposit: rest.securityDeposit ? parseFloat(rest.securityDeposit) : 0,
                        maintenanceCharges: rest.maintenanceCharges ? parseFloat(rest.maintenanceCharges) : 0,
                        minimumLeaseDuration: rest.minimumLeaseDuration ? parseInt(rest.minimumLeaseDuration) : undefined,
                        availableFrom: rest.availableFrom || undefined,
                    },
                    amenities: rest.amenities,
                    ownership: {
                        ownerName: rest.ownerName,
                        ownerContact: rest.ownerContact,
                        ownerEmail: rest.ownerEmail,
                    },
                    additional: {
                        nearbyLandmarks: rest.nearbyLandmarks,
                        preferredTenantType: rest.preferredTenantType,
                        petAllowed: rest.petAllowed,
                        smokingAllowed: rest.smokingAllowed,
                    },
                };

                const fd = new FormData();
                fd.append('propertyData', JSON.stringify(updateData));
                fd.append('existingImages', JSON.stringify(existingImages));
                images.forEach(file => fd.append('images', file));

                await apiPutForm(`/properties/${editId}`, fd);
                navigate(isDemo ? `/demo/manager/properties/${editId}` : `/manager/properties/${editId}`);
            } else {
                // Create mode: send FormData via POST
                const fd = new FormData();
                const { images, video, floorPlan, ownershipProof, propertyDocument, electricityBill, taxReceipt, ...rest } = formData;
                fd.append('propertyData', JSON.stringify(rest));
                images.forEach(file => fd.append('images', file));
                if (video) fd.append('video', video);
                if (floorPlan) fd.append('floorPlan', floorPlan);
                if (ownershipProof) fd.append('ownershipProof', ownershipProof);
                if (propertyDocument) fd.append('propertyDocument', propertyDocument);
                if (electricityBill) fd.append('electricityBill', electricityBill);
                if (taxReceipt) fd.append('taxReceipt', taxReceipt);
                await apiPostForm('/properties', fd);
                navigate(isDemo ? '/demo/manager/properties' : '/manager/properties');
            }
        } catch (error) {
            console.error('Submit error:', error);
            setSubmitError(error.message || 'Failed to submit property. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const nextStep = () => {
        const errors = validateStep(currentStep);
        if (errors.length > 0) {
            setValidationErrors(errors);
            return;
        }
        setValidationErrors([]);
        setCurrentStep(prev => Math.min(prev + 1, 8));
    };
    const prevStep = () => {
        setValidationErrors([]);
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleStepClick = (targetStep) => {
        if (targetStep > currentStep) {
            // Validate all steps from 1 up to targetStep - 1
            for (let i = 1; i < targetStep; i++) {
                const errors = validateStep(i);
                if (errors.length > 0) {
                    setValidationErrors(errors);
                    setCurrentStep(i);
                    return;
                }
            }
        }
        setValidationErrors([]);
        setCurrentStep(targetStep);
    };

    if (isLoadingProperty) {
        return (
            <ManagerLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                </div>
            </ManagerLayout>
        );
    }

    return (
        <ManagerLayout
            breadcrumbs={[
                { label: 'Home', href: '/manager/dashboard' },
                { label: editId ? 'Edit Property' : 'Add Properties' },
            ]}
        >
            <div className="max-w-[1400px] w-full mx-auto px-2 sm:px-4">
                {/* Page Title & Actions */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-dark-900">{editId ? 'Edit Property' : 'Add New Property'}</h1>
                        <p className="text-dark-500 mt-1">{editId ? 'Update the details of your property below.' : 'Fill in the details below to list your property for rent.'}</p>
                    </div>
                    
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/manager/properties')}
                            className="px-5 py-2.5 rounded-xl border border-dark-200 bg-white font-semibold text-sm text-dark-600 hover:bg-dark-50 transition-colors"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all ${isSubmitting ? 'bg-primary-400 cursor-wait' : 'bg-primary-600 hover:bg-primary-700 shadow-sm'}`}
                        >
                            {isSubmitting ? 'Saving...' : 'Save & Exit'}
                        </button>
                    </div>
                </div>

                {/* Step Progress */}
                <div className="bg-white rounded-2xl border border-dark-100 p-2 sm:p-4 mb-8 overflow-x-auto custom-scrollbar">
                    <div className="flex items-center gap-1 sm:gap-2 w-full min-w-max">
                        {STEPS.map((step, index) => (
                            <button
                                key={step.id}
                                onClick={() => handleStepClick(step.id)}
                                className={`flex-1 flex justify-center items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${currentStep === step.id
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                    : currentStep > step.id
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-dark-400 hover:bg-dark-50 hover:text-dark-600'
                                    }`}
                            >
                                {step.icon}
                                <span className="hidden md:inline">{step.title}</span>
                                {currentStep > step.id && (
                                    <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                        <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                            </svg>
                            <div>
                                <p className="text-red-800 text-sm font-semibold mb-1">Please fill in the required fields:</p>
                                <ul className="text-red-700 text-sm space-y-0.5">
                                    {validationErrors.map((err, i) => (
                                        <li key={i}>- {err}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Error */}
                {submitError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                            </svg>
                            <p className="text-red-800 text-sm font-medium">{submitError}</p>
                        </div>
                    </div>
                )}

                {/* Form Content */}
                <div className="bg-white rounded-2xl border border-dark-100 shadow-sm">
                    <div className="p-6 sm:p-8">

                        {/* ───── Step 1: Basic Info ───── */}
                        {currentStep === 1 && (
                            <div className="space-y-6 animate-fade-in">
                                <SectionHeader
                                    title="Basic Property Information"
                                    subtitle="Start with the primary details of your property"
                                />

                                <FormField label="Property Title" required>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e => updateField('title', e.target.value)}
                                        placeholder='e.g., "2 BHK Apartment Near City Center"'
                                        className="form-input"
                                        id="property-title"
                                    />
                                </FormField>

                                <div className="grid sm:grid-cols-2 gap-6">
                                    <FormField label="Property Type" required>
                                        <select
                                            value={formData.propertyType}
                                            onChange={e => updateField('propertyType', e.target.value)}
                                            className="form-input"
                                            id="property-type"
                                        >
                                            <option value="">Select type</option>
                                            {PROPERTY_TYPES.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </FormField>

                                    <FormField label="Listing Type" required>
                                        <div className="flex gap-3">
                                            {LISTING_TYPES.map(type => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => updateField('listingType', type)}
                                                    className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all duration-300 ${formData.listingType === type
                                                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                        : 'border-dark-200 text-dark-500 hover:border-dark-300'
                                                        }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </FormField>
                                </div>

                                <FormField label="Property Description" required>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => updateField('description', e.target.value)}
                                        placeholder="Describe your property — features, nearby landmarks, special highlights..."
                                        rows={5}
                                        className="form-input resize-none"
                                        id="property-description"
                                    />
                                    <p className="text-dark-400 text-xs mt-1.5">{formData.description.length}/1000 characters</p>
                                </FormField>
                            </div>
                        )}

                        {/* ───── Step 2: Location ───── */}
                        {currentStep === 2 && (
                            <div className="space-y-6 animate-fade-in">
                                <SectionHeader
                                    title="Property Location"
                                    subtitle="Help tenants find your property easily"
                                />

                                <div className="grid sm:grid-cols-3 gap-6">
                                    <FormField label="Country" required>
                                        <input
                                            type="text"
                                            value={formData.country}
                                            onChange={e => updateField('country', e.target.value)}
                                            className="form-input"
                                            id="location-country"
                                        />
                                    </FormField>
                                    <FormField label="State" required>
                                        <input
                                            type="text"
                                            value={formData.state}
                                            onChange={e => updateField('state', e.target.value)}
                                            placeholder="e.g., Maharashtra"
                                            className="form-input"
                                            id="location-state"
                                        />
                                    </FormField>
                                    <FormField label="City" required>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={e => updateField('city', e.target.value)}
                                            placeholder="e.g., Mumbai"
                                            className="form-input"
                                            id="location-city"
                                        />
                                    </FormField>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-6">
                                    <FormField label="Area / Locality" required>
                                        <input
                                            type="text"
                                            value={formData.area}
                                            onChange={e => updateField('area', e.target.value)}
                                            placeholder="e.g., Bandra West"
                                            className="form-input"
                                            id="location-area"
                                        />
                                    </FormField>
                                    <FormField label="PIN Code" required>
                                        <input
                                            type="text"
                                            value={formData.pinCode}
                                            onChange={e => updateField('pinCode', e.target.value)}
                                            placeholder="e.g., 400050"
                                            className="form-input"
                                            maxLength={6}
                                            id="location-pin"
                                        />
                                    </FormField>
                                </div>

                                <FormField label="Full Address" required>
                                    <textarea
                                        value={formData.fullAddress}
                                        onChange={e => updateField('fullAddress', e.target.value)}
                                        placeholder="Complete address including building name, street, etc."
                                        rows={3}
                                        className="form-input resize-none"
                                        id="location-address"
                                    />
                                </FormField>

                                <div className="grid sm:grid-cols-2 gap-6">
                                    <FormField label="Latitude" optional>
                                        <input
                                            type="text"
                                            value={formData.latitude}
                                            onChange={e => updateField('latitude', e.target.value)}
                                            placeholder="e.g., 19.0760"
                                            className="form-input"
                                            id="location-lat"
                                        />
                                    </FormField>
                                    <FormField label="Longitude" optional>
                                        <input
                                            type="text"
                                            value={formData.longitude}
                                            onChange={e => updateField('longitude', e.target.value)}
                                            placeholder="e.g., 72.8777"
                                            className="form-input"
                                            id="location-lng"
                                        />
                                    </FormField>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold text-dark-700">Select Location on Map</h4>
                                        <p className="text-xs text-dark-400 italic">Click on the map to set coordinates</p>
                                    </div>
                                    <div className="h-[350px] rounded-2xl overflow-hidden border-2 border-dark-100 relative group">
                                        <MapContainer
                                            center={[20.5937, 78.9629]} // Default center of India
                                            zoom={5}
                                            scrollWheelZoom={true}
                                            className="h-full w-full z-10"
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            <LocationMarker
                                                position={formData.latitude && formData.longitude ? { lat: formData.latitude, lng: formData.longitude } : null}
                                                setPosition={(pos) => {
                                                    updateField('latitude', pos.lat.toFixed(6));
                                                    updateField('longitude', pos.lng.toFixed(6));
                                                }}
                                            />
                                        </MapContainer>

                                        {/* Map Overlay Button (to clear) */}
                                        {(formData.latitude || formData.longitude) && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    updateField('latitude', '');
                                                    updateField('longitude', '');
                                                }}
                                                className="absolute top-4 right-4 z-[1000] bg-white text-red-500 p-2 rounded-lg shadow-md hover:bg-red-50 transition-colors border border-red-100"
                                                title="Clear Marker"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ───── Step 3: Property Details ───── */}
                        {currentStep === 3 && (
                            <div className="space-y-6 animate-fade-in">
                                <SectionHeader
                                    title="Property Details"
                                    subtitle={isCommercial(formData.propertyType) ? 'Specifications for your commercial property' : 'Specifications for your residential property'}
                                />

                                {!formData.propertyType && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                                        <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                                        </svg>
                                        <p className="text-amber-800 text-sm">Please go back to Step 1 and select a Property Type first.</p>
                                    </div>
                                )}

                                {/* Housing Details */}
                                {formData.propertyType && !isCommercial(formData.propertyType) && (
                                    <>
                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <FormField label="BHK Type" required>
                                                <select
                                                    value={formData.bhkType}
                                                    onChange={e => updateField('bhkType', e.target.value)}
                                                    className="form-input"
                                                    id="detail-bhk"
                                                >
                                                    <option value="">Select BHK</option>
                                                    {BHK_TYPES.map(t => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                            </FormField>
                                            <FormField label="Furnishing Type" required>
                                                <div className="flex gap-2">
                                                    {FURNISHING_TYPES.map(type => (
                                                        <button
                                                            key={type}
                                                            type="button"
                                                            onClick={() => updateField('furnishing', type)}
                                                            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border-2 transition-all duration-300 ${formData.furnishing === type
                                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                                : 'border-dark-200 text-dark-500 hover:border-dark-300'
                                                                }`}
                                                        >
                                                            {type}
                                                        </button>
                                                    ))}
                                                </div>
                                            </FormField>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <FormField label="Total Rooms">
                                                <input
                                                    type="number"
                                                    value={formData.totalRooms}
                                                    onChange={e => updateField('totalRooms', e.target.value)}
                                                    placeholder="0"
                                                    className="form-input"
                                                    min="0"
                                                    id="detail-rooms"
                                                />
                                            </FormField>
                                            <FormField label="Bathrooms">
                                                <input
                                                    type="number"
                                                    value={formData.bathrooms}
                                                    onChange={e => updateField('bathrooms', e.target.value)}
                                                    placeholder="0"
                                                    className="form-input"
                                                    min="0"
                                                    id="detail-bathrooms"
                                                />
                                            </FormField>
                                            <FormField label="Balconies">
                                                <input
                                                    type="number"
                                                    value={formData.balconies}
                                                    onChange={e => updateField('balconies', e.target.value)}
                                                    placeholder="0"
                                                    className="form-input"
                                                    min="0"
                                                    id="detail-balconies"
                                                />
                                            </FormField>
                                            <FormField label="Total Area (sq ft)">
                                                <input
                                                    type="number"
                                                    value={formData.totalArea}
                                                    onChange={e => updateField('totalArea', e.target.value)}
                                                    placeholder="0"
                                                    className="form-input"
                                                    min="0"
                                                    id="detail-area"
                                                />
                                            </FormField>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <FormField label="Floor Number">
                                                <input
                                                    type="number"
                                                    value={formData.floorNumber}
                                                    onChange={e => updateField('floorNumber', e.target.value)}
                                                    placeholder="e.g., 3"
                                                    className="form-input"
                                                    min="0"
                                                    id="detail-floor"
                                                />
                                            </FormField>
                                            <FormField label="Total Floors in Building">
                                                <input
                                                    type="number"
                                                    value={formData.totalFloors}
                                                    onChange={e => updateField('totalFloors', e.target.value)}
                                                    placeholder="e.g., 12"
                                                    className="form-input"
                                                    min="0"
                                                    id="detail-total-floors"
                                                />
                                            </FormField>
                                        </div>
                                    </>
                                )}

                                {/* Commercial Details */}
                                {formData.propertyType && isCommercial(formData.propertyType) && (
                                    <>
                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <FormField label="Total Area" required>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        value={formData.totalArea}
                                                        onChange={e => updateField('totalArea', e.target.value)}
                                                        placeholder="e.g., 500"
                                                        className="form-input flex-1"
                                                        min="0"
                                                        id="commercial-area"
                                                    />
                                                    <select
                                                        value={formData.areaUnit}
                                                        onChange={e => updateField('areaUnit', e.target.value)}
                                                        className="form-input w-28"
                                                        id="commercial-area-unit"
                                                    >
                                                        <option>sq ft</option>
                                                        <option>sq meter</option>
                                                    </select>
                                                </div>
                                            </FormField>
                                            <FormField label="Floor Number">
                                                <input
                                                    type="number"
                                                    value={formData.floorNumber}
                                                    onChange={e => updateField('floorNumber', e.target.value)}
                                                    placeholder="e.g., Ground"
                                                    className="form-input"
                                                    id="commercial-floor"
                                                />
                                            </FormField>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <FormField label="Power Supply Capacity">
                                                <input
                                                    type="text"
                                                    value={formData.powerSupplyCapacity}
                                                    onChange={e => updateField('powerSupplyCapacity', e.target.value)}
                                                    placeholder="e.g., 50 KVA"
                                                    className="form-input"
                                                    id="commercial-power"
                                                />
                                            </FormField>
                                            {(formData.propertyType === 'Factory' || formData.propertyType === 'Warehouse') && (
                                                <FormField label="Loading Area">
                                                    <input
                                                        type="text"
                                                        value={formData.loadingArea}
                                                        onChange={e => updateField('loadingArea', e.target.value)}
                                                        placeholder="e.g., 200 sq ft"
                                                        className="form-input"
                                                        id="commercial-loading"
                                                    />
                                                </FormField>
                                            )}
                                        </div>

                                        <FormField label="Parking Availability">
                                            <ToggleSwitch
                                                checked={formData.parkingAvailability}
                                                onChange={val => updateField('parkingAvailability', val)}
                                                label="Parking spaces available"
                                            />
                                        </FormField>
                                    </>
                                )}
                            </div>
                        )}

                        {/* ───── Step 4: Pricing ───── */}
                        {currentStep === 4 && (
                            <div className="space-y-6 animate-fade-in">
                                <SectionHeader
                                    title="Pricing Details"
                                    subtitle="Set your rental pricing and terms"
                                />

                                <div className="grid sm:grid-cols-2 gap-6">
                                    <FormField label="Monthly Rent (₹)" required>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-semibold">₹</span>
                                            <input
                                                type="number"
                                                value={formData.monthlyRent}
                                                onChange={e => updateField('monthlyRent', e.target.value)}
                                                placeholder="e.g., 25000"
                                                className="form-input pl-8"
                                                min="0"
                                                id="pricing-rent"
                                            />
                                        </div>
                                    </FormField>
                                    <FormField label="Security Deposit (₹)" required>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-semibold">₹</span>
                                            <input
                                                type="number"
                                                value={formData.securityDeposit}
                                                onChange={e => updateField('securityDeposit', e.target.value)}
                                                placeholder="e.g., 50000"
                                                className="form-input pl-8"
                                                min="0"
                                                id="pricing-deposit"
                                            />
                                        </div>
                                    </FormField>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-6">
                                    <FormField label="Maintenance Charges (₹/month)">
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-semibold">₹</span>
                                            <input
                                                type="number"
                                                value={formData.maintenanceCharges}
                                                onChange={e => updateField('maintenanceCharges', e.target.value)}
                                                placeholder="e.g., 3000"
                                                className="form-input pl-8"
                                                min="0"
                                                id="pricing-maintenance"
                                            />
                                        </div>
                                    </FormField>
                                    <FormField label="Minimum Lease Duration">
                                        <select
                                            value={formData.minimumLeaseDuration}
                                            onChange={e => updateField('minimumLeaseDuration', e.target.value)}
                                            className="form-input"
                                            id="pricing-lease"
                                        >
                                            <option value="">Select duration</option>
                                            <option value="3">3 Months</option>
                                            <option value="6">6 Months</option>
                                            <option value="11">11 Months</option>
                                            <option value="12">12 Months</option>
                                            <option value="24">24 Months</option>
                                            <option value="36">36 Months</option>
                                        </select>
                                    </FormField>
                                </div>

                                <FormField label="Available From" required>
                                    <input
                                        type="date"
                                        value={formData.availableFrom}
                                        onChange={e => updateField('availableFrom', e.target.value)}
                                        className="form-input"
                                        id="pricing-available"
                                    />
                                </FormField>

                                {/* Pricing Summary */}
                                {formData.monthlyRent && (
                                    <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5">
                                        <h4 className="text-primary-800 font-semibold mb-3 text-sm">Pricing Summary</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between text-dark-600">
                                                <span>Monthly Rent</span>
                                                <span className="font-semibold text-dark-900">₹{Number(formData.monthlyRent).toLocaleString()}</span>
                                            </div>
                                            {formData.securityDeposit && (
                                                <div className="flex justify-between text-dark-600">
                                                    <span>Security Deposit</span>
                                                    <span className="font-semibold text-dark-900">₹{Number(formData.securityDeposit).toLocaleString()}</span>
                                                </div>
                                            )}
                                            {formData.maintenanceCharges && (
                                                <div className="flex justify-between text-dark-600">
                                                    <span>Maintenance</span>
                                                    <span className="font-semibold text-dark-900">₹{Number(formData.maintenanceCharges).toLocaleString()}/mo</span>
                                                </div>
                                            )}
                                            <hr className="border-primary-200" />
                                            <div className="flex justify-between text-primary-800 font-bold">
                                                <span>Move-in Cost</span>
                                                <span>₹{(Number(formData.monthlyRent) + Number(formData.securityDeposit || 0) + Number(formData.maintenanceCharges || 0)).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ───── Step 5: Amenities ───── */}
                        {currentStep === 5 && (
                            <div className="space-y-6 animate-fade-in">
                                <SectionHeader
                                    title="Amenities"
                                    subtitle="Select all amenities available at your property"
                                />

                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                    {AMENITIES.map(amenity => (
                                        <button
                                            key={amenity.id}
                                            type="button"
                                            onClick={() => toggleAmenity(amenity.id)}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${formData.amenities.includes(amenity.id)
                                                ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-100'
                                                : 'border-dark-100 hover:border-dark-200 bg-white'
                                                }`}
                                        >
                                            <div className={`${formData.amenities.includes(amenity.id) ? 'text-primary-600' : 'text-dark-400'}`}>{amenity.icon}</div>
                                            <span className={`text-xs font-semibold ${formData.amenities.includes(amenity.id) ? 'text-primary-700' : 'text-dark-600'}`}>
                                                {amenity.label}
                                            </span>
                                            {formData.amenities.includes(amenity.id) && (
                                                <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <p className="text-dark-400 text-sm">
                                    {formData.amenities.length} amenities selected
                                </p>
                            </div>
                        )}

                        {/* ───── Step 6: Media ───── */}
                        {currentStep === 6 && (
                            <div className="space-y-6 animate-fade-in">
                                <SectionHeader
                                    title="Property Media"
                                    subtitle="Upload images and media to showcase your property"
                                />

                                {/* Image Upload */}
                                <FormField label="Property Images" required>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-dark-200 hover:border-primary-400 rounded-2xl p-8 text-center cursor-pointer transition-colors group"
                                    >
                                        <div className="w-14 h-14 bg-primary-50 group-hover:bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors">
                                            <svg className="w-7 h-7 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-dark-700 font-semibold text-sm">Click to upload images</p>
                                        <p className="text-dark-400 text-xs mt-1">JPG, PNG or WEBP. Max 5MB each. Upload up to 10 images.</p>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        id="property-images"
                                    />
                                </FormField>

                                {/* Image Previews */}
                                {imagePreviews.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {imagePreviews.map((preview, index) => (
                                            <div key={index} className="relative group rounded-xl overflow-hidden aspect-square">
                                                <img src={preview} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        onClick={() => removeImage(index)}
                                                        className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                {index === 0 && (
                                                    <span className="absolute top-2 left-2 bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                        Cover
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Video */}
                                <FormField label="Property Video" optional>
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={e => updateField('video', e.target.files[0])}
                                        className="form-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                        id="property-video"
                                    />
                                </FormField>

                                {/* Floor Plan */}
                                <FormField label="Floor Plan Image" optional>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFloorPlanUpload}
                                        className="form-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                        id="floor-plan"
                                    />
                                    {floorPlanPreview && (
                                        <div className="mt-3 rounded-xl overflow-hidden inline-block border border-dark-200">
                                            <img src={floorPlanPreview} alt="Floor Plan" className="max-h-48 object-contain" />
                                        </div>
                                    )}
                                </FormField>
                            </div>
                        )}

                        {/* ───── Step 7: Verification ───── */}
                        {currentStep === 7 && (
                            <div className="space-y-6 animate-fade-in">
                                <SectionHeader
                                    title="Ownership & Verification"
                                    subtitle="Verified listings build trust and attract more tenants"
                                />

                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                                    <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                    </svg>
                                    <p className="text-blue-800 text-sm">All documents are securely stored and reviewed by our admin team. Verified properties get up to <strong>3x more inquiries</strong>.</p>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-6">
                                    <FormField label="Owner Name" required>
                                        <input
                                            type="text"
                                            value={formData.ownerName}
                                            onChange={e => updateField('ownerName', e.target.value)}
                                            placeholder="Full legal name"
                                            className="form-input"
                                            id="owner-name"
                                        />
                                    </FormField>
                                    <FormField label="Owner Contact Number" required>
                                        <input
                                            type="tel"
                                            value={formData.ownerContact}
                                            onChange={e => updateField('ownerContact', e.target.value)}
                                            placeholder="+91 XXXXX XXXXX"
                                            className="form-input"
                                            id="owner-contact"
                                        />
                                    </FormField>
                                </div>

                                <FormField label="Owner Email" required>
                                    <input
                                        type="email"
                                        value={formData.ownerEmail}
                                        onChange={e => updateField('ownerEmail', e.target.value)}
                                        placeholder="owner@email.com"
                                        className="form-input"
                                        id="owner-email"
                                    />
                                </FormField>

                                <div className="border-t border-dark-100 pt-6">
                                    <h4 className="text-dark-900 font-semibold mb-4">Verification Documents</h4>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <FileUploadCard
                                            label="Ownership Proof"
                                            description="Sale deed, registry, or allotment letter"
                                            file={formData.ownershipProof}
                                            onChange={file => updateField('ownershipProof', file)}
                                            id="doc-ownership"
                                        />
                                        <FileUploadCard
                                            label="Property Document"
                                            description="Property tax receipt or NOC"
                                            file={formData.propertyDocument}
                                            onChange={file => updateField('propertyDocument', file)}
                                            id="doc-property"
                                        />
                                        <FileUploadCard
                                            label="Electricity Bill"
                                            description="Recent utility bill for address proof"
                                            file={formData.electricityBill}
                                            onChange={file => updateField('electricityBill', file)}
                                            id="doc-electricity"
                                        />
                                        <FileUploadCard
                                            label="Tax Receipt"
                                            description="Latest property tax payment receipt"
                                            file={formData.taxReceipt}
                                            onChange={file => updateField('taxReceipt', file)}
                                            id="doc-tax"
                                        />
                                    </div>
                                </div>

                                <FormField label="Verification Status">
                                    <div className="flex gap-3">
                                        {VERIFICATION_STATUSES.map(status => (
                                            <div
                                                key={status}
                                                className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 text-center ${formData.verificationStatus === status
                                                    ? status === 'Verified' ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : status === 'Rejected' ? 'border-red-500 bg-red-50 text-red-700'
                                                            : 'border-amber-500 bg-amber-50 text-amber-700'
                                                    : 'border-dark-200 text-dark-400'
                                                    }`}
                                            >
                                                {status}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-dark-400 text-xs mt-2">Status is managed by the admin team after document review.</p>
                                </FormField>
                            </div>
                        )}

                        {/* ───── Step 8: Additional ───── */}
                        {currentStep === 8 && (
                            <div className="space-y-6 animate-fade-in">
                                <SectionHeader
                                    title="Additional Details"
                                    subtitle="Help tenants know more about the property"
                                />

                                <FormField label="Nearby Landmarks">
                                    <textarea
                                        value={formData.nearbyLandmarks}
                                        onChange={e => updateField('nearbyLandmarks', e.target.value)}
                                        placeholder="e.g., 500m from Metro Station, Near City Mall, Close to International School..."
                                        rows={3}
                                        className="form-input resize-none"
                                        id="additional-landmarks"
                                    />
                                </FormField>

                                <FormField label="Preferred Tenant Type">
                                    <div className="flex gap-3">
                                        {TENANT_TYPES.map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => toggleTenantType(type)}
                                                className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all duration-300 ${formData.preferredTenantType.includes(type)
                                                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                    : 'border-dark-200 text-dark-500 hover:border-dark-300'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </FormField>

                                <div className="grid sm:grid-cols-2 gap-6">
                                    <FormField label="Pet Allowed">
                                        <ToggleSwitch
                                            checked={formData.petAllowed}
                                            onChange={val => updateField('petAllowed', val)}
                                            label="Pets are welcome"
                                        />
                                    </FormField>
                                    <FormField label="Smoking Allowed">
                                        <ToggleSwitch
                                            checked={formData.smokingAllowed}
                                            onChange={val => updateField('smokingAllowed', val)}
                                            label="Smoking permitted"
                                        />
                                    </FormField>
                                </div>

                                {/* Submit Summary */}
                                <div className="bg-dark-900 rounded-2xl p-6 text-white mt-8">
                                    <h4 className="font-bold text-lg mb-2">Ready to submit?</h4>
                                    <p className="text-white/60 text-sm mb-4">
                                        Your property listing will be reviewed by our admin team within 24-48 hours.
                                        Once verified, it will be live for thousands of tenants to discover.
                                    </p>
                                    <div className="flex flex-wrap gap-3 text-xs text-white/50">
                                        <span className="flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                            </svg>
                                            Admin review within 48h
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                            </svg>
                                            Secure document storage
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                            </svg>
                                            Edit anytime
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation Footer */}
                    <div className="border-t border-dark-100 px-6 sm:px-8 py-5 flex items-center justify-between bg-dark-50/50 rounded-b-2xl">
                        <button
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${currentStep === 1
                                ? 'text-dark-300 cursor-not-allowed'
                                : 'text-dark-600 hover:bg-dark-100 hover:text-dark-900'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Previous
                        </button>

                        <span className="text-dark-400 text-sm font-medium">
                            Step {currentStep} of {STEPS.length}
                        </span>

                        {currentStep < 8 ? (
                            <button
                                onClick={nextStep}
                                className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-all hover:shadow-lg hover:shadow-primary-600/20 active:scale-95"
                            >
                                Next
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${isSubmitting
                                    ? 'bg-primary-400 text-white cursor-wait'
                                    : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-600/20'
                                    }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {isEditMode ? 'Saving...' : 'Submitting...'}
                                    </>
                                ) : (
                                    <>
                                        {isEditMode ? 'Save Changes' : 'Submit Property'}
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </ManagerLayout>
    );
}

/* ═══════════════════════════════════════
   Reusable Sub-Components
   ═══════════════════════════════════════ */

function SectionHeader({ title, subtitle }) {
    return (
        <div className="mb-2">
            <h2 className="text-xl font-bold text-dark-900">{title}</h2>
            <p className="text-dark-500 text-sm mt-1">{subtitle}</p>
        </div>
    );
}

function FormField({ label, required, optional, children }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
                {optional && <span className="text-dark-400 font-normal ml-1 text-xs">(optional)</span>}
            </label>
            {children}
        </div>
    );
}

function ToggleSwitch({ checked, onChange, label }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className="flex items-center gap-3 w-full"
        >
            <div className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${checked ? 'bg-primary-600' : 'bg-dark-200'}`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${checked ? 'translate-x-5' : ''}`} />
            </div>
            <span className={`text-sm font-medium ${checked ? 'text-primary-700' : 'text-dark-500'}`}>{label}</span>
        </button>
    );
}

function FileUploadCard({ label, description, file, onChange, id }) {
    const inputRef = useRef(null);

    return (
        <div
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all duration-300 ${file
                ? 'border-primary-300 bg-primary-50'
                : 'border-dark-200 hover:border-dark-300 bg-white'
                }`}
        >
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${file ? 'bg-primary-100' : 'bg-dark-100'}`}>
                    {file ? (
                        <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    )}
                </div>
                <div className="min-w-0">
                    <p className={`text-sm font-semibold ${file ? 'text-primary-700' : 'text-dark-700'}`}>{label}</p>
                    <p className="text-xs text-dark-400 truncate">
                        {file ? (file.name || file.originalName || file.filename || 'Uploaded Document') : description}
                    </p>
                </div>
            </div>
            <input
                ref={inputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => onChange(e.target.files[0])}
                className="hidden"
                id={id}
            />
        </div>
    );
}
