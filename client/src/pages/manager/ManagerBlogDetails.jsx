import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser, SignInButton } from '@clerk/clerk-react';
import ManagerLayout from '../../layouts/ManagerLayout';
import { apiGet, apiPost } from '../../utils/api';
import toast from 'react-hot-toast';

export default function ManagerBlogDetails() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { isSignedIn } = useUser();
    const [blog, setBlog] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Interactions tracking locally for instant UI update
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await apiGet(`/blogs/${slug}`);
                setBlog(res.blog);
                setComments(res.comments || []);
                setLikeCount(res.blog.likesCount || 0);
            } catch (err) {
                console.error(err);
                toast.error('Failed to load article');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [slug]);

    const handleLike = async () => {
        try {
            const res = await apiPost(`/blogs/interact/${blog._id}`, { type: 'like' });
            setIsLiked(res.active);
            setLikeCount(prev => res.active ? prev + 1 : prev - 1);
        } catch (err) {
            toast.error('Like failed');
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        setSubmittingComment(true);
        try {
            const res = await apiPost(`/blogs/comment/${blog._id}`, { text: commentText });
            setComments([res.comment, ...comments]);
            setCommentText('');
            toast.success('Comment posted!');
        } catch (err) {
            toast.error('Failed to post comment');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: blog.title,
                text: blog.summary,
                url: window.location.href,
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied to clipboard!');
        }
    };

    if (loading) {
        return (
            <ManagerLayout>
                <div className="flex justify-center items-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
            </ManagerLayout>
        );
    }

    if (!blog) {
        return (
            <ManagerLayout>
                <div className="max-w-xl mx-auto py-24 text-center">
                    <h2 className="text-2xl font-bold mb-4">Article Not Found</h2>
                    <button onClick={() => navigate('/manager/blogs')} className="text-primary-600 font-bold hover:underline">
                        Return to Blogs
                    </button>
                </div>
            </ManagerLayout>
        );
    }

    return (
        <ManagerLayout breadcrumbs={[
            { label: 'Dashboard', href: '/manager/dashboard' },
            { label: 'News & Blogs', href: '/manager/blogs' },
            { label: blog.title }
        ]}>
            {/* Hero Image Header */}
            <div className="relative w-full h-[40vh] min-h-[300px] lg:h-[50vh] bg-dark-900 overflow-hidden mb-12">
                <img 
                    src={blog.images?.[0]?.url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&fit=crop'} 
                    alt="Article hero" 
                    className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent flex items-end">
                    <div className="max-w-4xl mx-auto w-full px-6 pb-12">
                        <span className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg inline-block mb-4">
                            {blog.category}
                        </span>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-4 drop-shadow-lg">
                            {blog.title}
                        </h1>
                        <div className="flex items-center gap-4 text-white/80 font-medium text-sm">
                            <span className="flex items-center gap-2">
                                <img src={blog.author?.avatar || '/images/testimonial.png'} className="w-8 h-8 rounded-full border border-white/20 object-cover" alt="Author" />
                                {blog.author ? `${blog.author.firstName} ${blog.author.lastName}` : 'Admin'}
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                            <span>{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                            <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                {blog.views} Reads
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 pb-20 w-full" style={{ minHeight: '60vh' }}>
                <main className="mb-16">
                    {/* Summary Block */}
                    <p className="text-xl md:text-2xl text-dark-500 font-medium leading-relaxed mb-10 border-l-4 border-primary-500 pl-6 py-2 italic font-serif">
                        {blog.summary}
                    </p>

                    {/* Content */}
                    <div 
                        className="prose prose-lg max-w-none text-dark-800 font-serif leading-loose tracking-wide prose-headings:font-black prose-headings:font-sans prose-a:text-primary-600 prose-img:rounded-2xl prose-img:shadow-lg"
                        dangerouslySetInnerHTML={{ __html: blog.content.replace(/\n/g, '<br />') }}
                    />
                    
                    {/* Tags */}
                    {blog.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-dark-100">
                            {blog.tags.map(t => (
                                <span key={t} className="bg-dark-50 text-dark-600 border border-dark-100 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
                                    #{t}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Interaction Bar */}
                    <div className="flex items-center justify-between gap-4 mt-8 bg-dark-50 p-4 rounded-2xl border border-dark-100">
                        <div className="flex gap-2">
                            {isSignedIn ? (
                                <button onClick={handleLike} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 border-2 ${isLiked ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-white border-dark-200 text-dark-600 hover:border-dark-300'}`}>
                                    <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                    {likeCount} Likes
                                </button>
                            ) : (
                                <span className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white border-2 border-dark-200 text-dark-600`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                    {likeCount} Likes
                                </span>
                            )}
                        </div>
                        <button onClick={handleShare} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-dark-900 border-2 border-dark-900 text-white font-bold text-sm transition-all hover:bg-dark-800 active:scale-95 shadow-md">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                            Share 
                        </button>
                    </div>
                </main>

                {/* Comments Section */}
                <section className="bg-white p-6 md:p-8 rounded-3xl border border-dark-100 shadow-sm">
                    <h3 className="text-xl font-black text-dark-900 mb-6 flex items-center gap-2">
                        <span className="w-1 h-5 bg-primary-500 rounded-full" />
                        Discussion ({comments.length})
                    </h3>

                    {isSignedIn ? (
                        <form onSubmit={handleComment} className="flex gap-4 mb-10">
                            <div className="w-10 h-10 rounded-full bg-dark-100 flex-shrink-0 flex items-center justify-center text-dark-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                            <div className="flex-1 relative">
                                <textarea
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Share your thoughts..."
                                    className="w-full bg-dark-50 border border-dark-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-4 pb-12 rounded-xl text-sm font-medium outline-none resize-none min-h-[100px]"
                                />
                                <div className="absolute bottom-3 right-3">
                                    <button type="submit" disabled={submittingComment || !commentText.trim()} className="px-5 py-1.5 bg-primary-600 text-white rounded-lg font-bold text-xs hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                                        Post
                                    </button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="mb-10 text-center bg-dark-50 py-8 rounded-2xl border border-dark-100">
                            <svg className="w-12 h-12 text-dark-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            <h4 className="text-lg font-bold text-dark-900 mb-1">Join the Conversation</h4>
                            <p className="text-sm text-dark-500 mb-4 max-w-sm mx-auto">Sign in to like this article and share your thoughts with the community.</p>
                            <SignInButton mode="modal">
                                <button className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-colors shadow-md">
                                    Sign In to Comment
                                </button>
                            </SignInButton>
                        </div>
                    )}

                    <div className="space-y-6">
                        {comments.length === 0 ? (
                            <p className="text-center py-6 text-dark-400 text-sm font-medium">Be the first to share your thoughts!</p>
                        ) : (
                            comments.map(c => (
                                <div key={c._id} className="flex gap-4 group">
                                    <img src={c.user?.avatar || '/images/testimonial.png'} alt="User" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                    <div className="flex-1 bg-dark-50/50 p-4 rounded-2xl rounded-tl-none border border-dark-50/50">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-dark-900 text-sm">{c.user ? `${c.user.firstName} ${c.user.lastName}` : 'Anonymous'}</span>
                                            {c.user?.role === 'manager' && <span className="bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">Manager</span>}
                                            {c.user?.role === 'admin' && <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">Admin</span>}
                                            <span className="text-[10px] text-dark-400 font-medium">
                                                {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-dark-600 text-[13px] leading-relaxed mt-1">
                                            {c.text}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </ManagerLayout>
    );
}
