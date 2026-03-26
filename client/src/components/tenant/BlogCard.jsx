import { Link } from 'react-router-dom';

export default function BlogCard({ blog, userRole, basePath }) {
    const imageUrl = blog.images && blog.images.length > 0 
        ? blog.images[0].url 
        : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&fit=crop';
    
    // Fallback path resolution
    const routeUrl = basePath ? `${basePath}/${blog.slug}` : `/blogs/${blog.slug}`;
    
    return (
        <article className="group bg-white rounded-xl border border-dark-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 relative focus-within:ring-2 focus-within:ring-primary-500 flex flex-col sm:flex-row min-h-[160px]">
            {/* Image Container */}
            <Link to={routeUrl} className="block relative h-44 sm:h-auto sm:w-[200px] md:w-[240px] lg:w-[280px] flex-shrink-0 z-10 overflow-hidden outline-none bg-dark-50">
                <img 
                    src={imageUrl} 
                    alt={blog.title} 
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Overlays */}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-dark-900/80 to-transparent flex items-end">
                    <span className="bg-primary-600 text-white px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm border border-primary-500/30 line-clamp-1 max-w-[90%]">
                        {blog.category}
                    </span>
                </div>

                {/* Important Tag Overlay */}
                {blog.isHighImpact && (
                    <div className="absolute top-3 left-3 flex gap-1 items-center bg-rose-500 text-white px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-md animate-pulse">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.1l6.4 12.9H5.6L12 6.1zM11 10v4h2v-4h-2zm0 5v2h2v-2h-2z" /></svg>
                        Important
                    </div>
                )}
            </Link>
            
            {/* Content Container */}
            <div className="p-4 sm:p-4 lg:p-5 flex flex-col flex-1 min-w-0">
                
                {/* Metadata: Date & Views */}
                <div className="flex items-center gap-2.5 mb-2 text-[10px] sm:text-[11px] text-dark-400 font-bold uppercase tracking-wider">
                    <span>
                        {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-dark-200" />
                    <span className="flex items-center gap-1 text-primary-600 font-black">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        {blog.views || 0} Views
                    </span>
                </div>
                
                {/* Title & Description */}
                <h3 className="text-base sm:text-lg font-black text-dark-900 mb-1.5 leading-snug group-hover:text-primary-600 transition-colors line-clamp-2">
                    <Link to={routeUrl} className="outline-none">
                        {blog.title}
                    </Link>
                </h3>
                
                <p className="text-dark-500 text-xs leading-relaxed line-clamp-2 mb-3">
                    {blog.summary}
                </p>
                
                {/* Action Bar */}
                <div className="mt-auto pt-3 border-t border-dark-100 flex items-center justify-between">
                    <Link 
                        to={routeUrl} 
                        className="inline-flex items-center gap-1.5 text-xs font-black text-dark-900 hover:text-primary-600 group/btn transition-colors outline-none"
                    >
                        Read Article 
                        <svg className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                    </Link>
                </div>
            </div>
            
            {/* Status Overlays for Editors/Admins */}
            {(userRole === 'admin' || userRole === 'manager') && blog.status !== 'published' && (
                <div className="absolute top-3 right-3 z-20">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm border ${blog.status === 'pending_approval' ? 'bg-amber-100 text-amber-700 border-amber-200' : blog.status === 'draft' ? 'bg-dark-100 text-dark-600 border-dark-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {blog.status.replace('_', ' ')}
                    </span>
                </div>
            )}
        </article>
    );
}
