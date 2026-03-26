import { useState } from 'react';
import { Link } from 'react-router-dom';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop';

/**
 * TenantPropertyCard
 * Used in AllProperties, Favourites pages for renters.
 *
 * Props:
 *  property    — the full property object from API
 *  isFavourite — boolean (controlled externally)
 *  onToggleFav — callback(propertyId)
 *  isDemo      — boolean
 */
export default function TenantPropertyCard({ property, isFavourite = false, onToggleFav, isDemo = false }) {
    const [imgError, setImgError] = useState(false);
    const [saving, setSaving] = useState(false);

    const imageUrl = (!imgError && property.images?.[0]?.url) || PLACEHOLDER_IMAGE;
    const locationStr = [property.location?.area, property.location?.city].filter(Boolean).join(', ') || 'Location not set';
    const beds = property.residential?.totalRooms || property.residential?.bhkType?.replace(/\D/g, '') || '-';
    const baths = property.residential?.bathrooms || '-';
    const area = property.commercial?.totalArea || property.residential?.totalArea || '-';
    const rent = property.pricing?.monthlyRent || 0;
    const deposit = property.pricing?.securityDeposit || 0;
    const type = property.propertyType || 'Residential';

    const detailPath = isDemo
        ? `/demo/tenant/properties/${property._id}`
        : `/tenant/properties/${property._id}`;

    const handleFav = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (saving) return;
        setSaving(true);
        await onToggleFav?.(property._id);
        setSaving(false);
    };

    return (
        <div className={`bg-white rounded-2xl border overflow-hidden group hover:shadow-xl transition-all duration-300 relative ${property.status === 'awaiting_payment' ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.15)]' : property.status === 'rented' ? 'border-dark-300' : 'border-dark-100 hover:-translate-y-0.5'}`}>
            {/* ── Image Area ── */}
            <div className="relative overflow-hidden">
                <Link to={detailPath} className="block relative h-48 w-full overflow-hidden bg-dark-50">
                    <img
                        src={imageUrl}
                        alt={property.title}
                        onError={() => setImgError(true)}
                        className={`w-full h-full object-cover transition-transform duration-500 ${['awaiting_payment', 'rented'].includes(property.status) ? 'opacity-90 saturate-50 group-hover:scale-105' : 'group-hover:scale-105'}`}
                    />
                    
                    {/* Hover Overlay for Waitlist/Occupied */}
                    {['awaiting_payment', 'rented'].includes(property.status) && (
                        <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {property.status === 'awaiting_payment' ? (
                                <>
                                    <svg className="w-8 h-8 text-amber-400 mb-2 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                    <span className="text-white font-bold text-sm mb-1 tracking-wide uppercase">Waitlist Open</span>
                                    <span className="text-white/80 text-[10px] leading-snug max-w-[80%]">Another applicant's payment is pending. Apply now to join the waitlist.</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-8 h-8 text-dark-300 mb-2 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                    <span className="text-white font-bold text-sm mb-1 tracking-wide uppercase">Property Occupied</span>
                                    <span className="text-white/80 text-[10px] leading-snug max-w-[80%]">This property is currently occupied and unavailable.</span>
                                </>
                            )}
                        </div>
                    )}
                </Link>

                {/* Top-left: type pill */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/90 backdrop-blur-sm text-dark-700 border border-dark-100 shadow-sm capitalize w-fit">
                        {type}
                    </span>
                    {property.status === 'awaiting_payment' && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/90 backdrop-blur-sm text-white shadow-sm w-fit uppercase tracking-wider">
                            Awaiting Payment
                        </span>
                    )}
                    {property.status === 'rented' && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-dark-800/90 backdrop-blur-sm text-white shadow-sm w-fit uppercase tracking-wider">
                            Occupied
                        </span>
                    )}
                </div>

                {/* Top-right badges + heart */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                    {property.verified && (
                        <span
                            title="Verified"
                            className="px-2 py-1 rounded-lg bg-emerald-500 text-white text-[9px] font-bold shadow-sm"
                        >
                            VERIFIED
                        </span>
                    )}
                    {property.boosted && (
                        <span
                            title="Featured"
                            className="px-2 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[9px] font-bold shadow-sm"
                        >
                            FEATURED
                        </span>
                    )}

                    {/* Heart / Save */}
                    <button
                        onClick={handleFav}
                        disabled={saving}
                        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-300 active:scale-90 ${
                            isFavourite
                                ? 'bg-rose-500 text-white'
                                : 'bg-white/90 backdrop-blur-sm text-dark-400 hover:text-rose-500 hover:bg-white'
                        }`}
                        title={isFavourite ? 'Remove from favourites' : 'Save to favourites'}
                    >
                        <svg className="w-4 h-4" fill={isFavourite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                </div>

                {/* Bottom-left: availability */}
                <div className="absolute bottom-3 left-3">
                    {property.status === 'rented' && property.leaseEndsAt ? (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-indigo-600/90 backdrop-blur-sm text-white shadow-sm">
                            Available ~{new Date(property.leaseEndsAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </span>
                    ) : property.availability ? (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-black/60 backdrop-blur-sm text-white shadow-sm">
                            Available {property.availability}
                        </span>
                    ) : null}
                </div>
            </div>

            {/* ── Card Body ── */}
            <div className="p-4">
                {/* Location */}
                <div className="flex items-center gap-1 text-dark-400 text-[11px] mb-1.5">
                    <svg className="w-3 h-3 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <span className="truncate">{locationStr}</span>
                </div>

                {/* Title */}
                <Link to={detailPath}>
                    <h3 className="text-dark-900 font-bold text-sm leading-snug mb-3 hover:text-primary-600 transition-colors line-clamp-2">
                        {property.title}
                    </h3>
                </Link>

                {/* Specs row */}
                <div className="flex items-center gap-3 text-dark-500 text-[11px] mb-4 pb-3 border-b border-dark-50">
                    <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        {beds} Bed
                    </span>
                    <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                        {baths} Bath
                    </span>
                    {area !== '-' && (
                        <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                            {area} sqft
                        </span>
                    )}
                </div>

                {/* Reduced Card Heights (No Extra Banners required anymore) */}

                {/* Price + CTA */}
                <div className={`flex items-end justify-between pt-3 ${['awaiting_payment', 'rented'].includes(property.status) ? 'opacity-60' : ''}`}>
                    <div>
                        <p className="text-[10px] text-dark-400 font-semibold uppercase tracking-wider">Monthly Rent</p>
                        <p className="text-lg font-black text-dark-900 leading-none">
                            ₹{rent.toLocaleString()}
                            <span className="text-xs font-medium text-dark-400">/mo</span>
                        </p>
                        {deposit > 0 && (
                            <p className="text-[10px] text-dark-400 mt-0.5">
                                Deposit: ₹{deposit.toLocaleString()}
                            </p>
                        )}
                    </div>

                    {['awaiting_payment', 'rented'].includes(property.status) ? (
                        <Link
                            to={detailPath}
                            className={`px-4 py-2 text-xs font-semibold rounded-xl text-white whitespace-nowrap transition-all shadow-md active:scale-95 ${
                                property.status === 'rented' 
                                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25' 
                                : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
                            }`}
                        >
                            {property.status === 'rented' ? 'Advance Apply' : 'Join Waitlist'}
                        </Link>
                    ) : (
                        <Link
                            to={detailPath}
                            className="px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-all hover:shadow-lg hover:shadow-primary-600/25 active:scale-95 whitespace-nowrap"
                        >
                            View Details
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
