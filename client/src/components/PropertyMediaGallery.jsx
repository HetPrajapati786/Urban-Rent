import { useState } from 'react';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop';

/**
 * Reusable property media gallery with image slider + video player
 * 
 * Props:
 *  - images: [{ url, publicId }]
 *  - video: { url, publicId }
 *  - title: string (alt text)
 */
export default function PropertyMediaGallery({ images = [], video, title = '' }) {
    const allImages = images.length > 0 ? images : [{ url: PLACEHOLDER_IMAGE }];
    const [activeIndex, setActiveIndex] = useState(0);
    const [showVideo, setShowVideo] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);

    const hasVideo = video?.url && !video.url.includes('unsplash.com');
    const total = allImages.length;

    const prev = () => setActiveIndex((i) => (i - 1 + total) % total);
    const next = () => setActiveIndex((i) => (i + 1) % total);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowLeft') prev();
        else if (e.key === 'ArrowRight') next();
        else if (e.key === 'Escape') setFullscreen(false);
    };

    return (
        <>
            <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden shadow-sm">
                {/* Tab: Photos / Video */}
                {hasVideo && (
                    <div className="flex border-b border-dark-100">
                        <button
                            onClick={() => setShowVideo(false)}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${!showVideo ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/30' : 'text-dark-400 hover:text-dark-600'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Photos ({total})
                        </button>
                        <button
                            onClick={() => setShowVideo(true)}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${showVideo ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/30' : 'text-dark-400 hover:text-dark-600'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            Video Tour
                        </button>
                    </div>
                )}

                {/* Video View */}
                {showVideo && hasVideo ? (
                    <div className="aspect-video bg-black">
                        <video
                            src={video.url}
                            controls
                            className="w-full h-full object-contain"
                            preload="metadata"
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                ) : (
                    /* Image Slider */
                    <div className="relative" onKeyDown={handleKeyDown} tabIndex={0}>
                        {/* Main Image */}
                        <div
                            className="aspect-video bg-dark-50 overflow-hidden relative cursor-pointer group"
                            onClick={() => setFullscreen(true)}
                        >
                            <img
                                src={allImages[activeIndex]?.url}
                                alt={`${title} - Photo ${activeIndex + 1}`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            />

                            {/* Counter Badge */}
                            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg font-bold backdrop-blur-sm flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                {activeIndex + 1} / {total}
                            </div>

                            {/* Fullscreen hint */}
                            <div className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                            </div>
                        </div>

                        {/* Prev / Next Arrows */}
                        {total > 1 && (
                            <>
                                <button
                                    onClick={prev}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-90 backdrop-blur-sm border border-dark-100"
                                    aria-label="Previous image"
                                >
                                    <svg className="w-5 h-5 text-dark-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <button
                                    onClick={next}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-90 backdrop-blur-sm border border-dark-100"
                                    aria-label="Next image"
                                >
                                    <svg className="w-5 h-5 text-dark-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Thumbnail Strip */}
                {!showVideo && total > 1 && (
                    <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
                        {allImages.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveIndex(idx)}
                                className={`w-[72px] h-[52px] rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${activeIndex === idx
                                    ? 'border-primary-500 shadow-md ring-2 ring-primary-500/20'
                                    : 'border-transparent opacity-60 hover:opacity-100'
                                    }`}
                            >
                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}

                        {/* Video thumbnail */}
                        {hasVideo && (
                            <button
                                onClick={() => setShowVideo(true)}
                                className="w-[72px] h-[52px] rounded-lg overflow-hidden flex-shrink-0 border-2 border-transparent opacity-60 hover:opacity-100 transition-all relative bg-dark-900"
                            >
                                <div className="absolute inset-0 flex items-center justify-center text-white">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                </div>
                                <span className="absolute bottom-0.5 left-0 right-0 text-[8px] font-bold text-white text-center">VIDEO</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Fullscreen Lightbox */}
            {fullscreen && (
                <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center" onClick={() => setFullscreen(false)}>
                    {/* Close */}
                    <button
                        onClick={() => setFullscreen(false)}
                        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    {/* Counter */}
                    <div className="absolute top-4 left-4 text-white/70 text-sm font-bold">
                        {activeIndex + 1} / {total}
                    </div>

                    {/* Image */}
                    <img
                        src={allImages[activeIndex]?.url}
                        alt=""
                        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {/* Arrows */}
                    {total > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); prev(); }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); next(); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </>
                    )}

                    {/* Dot indicators */}
                    {total > 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                            {allImages.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); setActiveIndex(idx); }}
                                    className={`w-2 h-2 rounded-full transition-all ${activeIndex === idx ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
