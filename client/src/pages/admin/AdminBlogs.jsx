import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { apiGet, apiDelete } from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminBlogs() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, blogId: null, isDeleting: false });

    const fetchContent = async () => {
        setLoading(true);
        try {
            // Need a new route /admin/blogs just for all blogs with drafts, or we can use the regular route if they are all published.
            const blogsRes = await apiGet('/blogs?filter=latest&category=All');
            setBlogs(blogsRes.blogs || []);
        } catch (err) {
            toast.error('Failed to load blog database');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteModalState({ isOpen: true, blogId: id, isDeleting: false });
    };

    const confirmDelete = async () => {
        const id = deleteModalState.blogId;
        if (!id) return;
        setDeleteModalState(prev => ({ ...prev, isDeleting: true }));
        try {
            await apiDelete(`/blogs/admin/${id}`);
            toast.success("Article removed securely");
            fetchContent();
        } catch (error) {
            toast.error("Failed to delete the article.");
        } finally {
            setDeleteModalState({ isOpen: false, blogId: null, isDeleting: false });
        }
    };

    useEffect(() => {
        fetchContent();
    }, []);

    const handleApproval = async (id, action, isHighImpact = false) => {
        try {
            const feedback = action === 'reject' ? window.prompt('Provide rejection reason for the manager:') : undefined;
            if (action === 'reject' && feedback === null) return; // cancelled

            await apiPut(`/blogs/admin/review/${id}`, { action, feedback, isHighImpact });
            toast.success(action === 'approve' ? 'Article Live!' : 'Article Rejected');
            fetchContent();
        } catch (err) {
            toast.error('Action failed');
        }
    };

    return (
        <AdminLayout breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Content Moderation' }]}>
            <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-end gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-dark-900 mb-2">Editorial Desk</h1>
                    <p className="text-dark-500 text-sm">Approve community-submitted articles, moderate spam, and publish high-impact news pieces.</p>
                </div>
                <Link to="/admin/blogs/create" className="px-5 py-2.5 bg-dark-900 text-white text-sm font-bold rounded-xl hover:bg-dark-800 transition-colors shadow-md">
                    + Write Official News
                </Link>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
            {loading ? (
                 <div className="text-center py-20 bg-white rounded-3xl border border-dark-100 shadow-sm animate-pulse">
                     <div className="w-8 h-8 rounded-full border-t-2 border-primary-500 animate-spin mx-auto mb-3" />
                     Waiting on database...
                 </div>
            ) : (
                /* PUBLISHED TABLE */
                <div className="bg-white rounded-3xl shadow-sm border border-dark-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] font-black uppercase text-dark-400 bg-dark-50 border-b border-dark-100 tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Article Title</th>
                                    <th className="px-6 py-4">Author</th>
                                    <th className="px-6 py-4">Engagement</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-100 font-medium">
                                {blogs.map(blog => (
                                    <tr key={blog._id} className="hover:bg-dark-50/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <Link to={`/admin/blogs/edit/${blog._id}`} className="font-bold text-dark-900 block max-w-sm truncate hover:text-primary-600 transition-colors">
                                                {blog.title}
                                            </Link>
                                            <span className="text-[11px] text-dark-400 mt-1 block">{blog.category}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <img src={blog.author?.avatar || '/images/testimonial.png'} className="w-6 h-6 rounded-full" alt="" />
                                                <span className="text-dark-700">{blog.author?.firstName || 'Admin'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4 text-[11px] font-bold text-dark-400">
                                                <span className="flex items-center gap-1" title="Views"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> {blog.views}</span>
                                                <span className="flex items-center gap-1" title="Likes"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> {blog.likesCount}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                                                Live
                                            </span>
                                            {blog.isHighImpact && <span className="ml-2 bg-rose-100 text-rose-700 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest">Alert</span>}
                                        </td>
                                        <td className="px-6 py-5 text-right flex items-center justify-end gap-3">
                                            <Link to={`/admin/blogs/edit/${blog._id}`} className="text-dark-400 hover:text-primary-600 transition-colors" title="Edit Article">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </Link>
                                            <button onClick={() => handleDeleteClick(blog._id)} className="text-dark-400 hover:text-rose-500 transition-colors" title="Delete Article">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {blogs.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-dark-400 text-sm font-bold">No published articles yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalState.isOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !deleteModalState.isDeleting && setDeleteModalState({ isOpen: false, blogId: null, isDeleting: false })}>
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4 mx-auto">
                            <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-center text-dark-900 mb-2">Delete Article?</h3>
                        <p className="text-sm text-center text-dark-500 mb-6">This action is permanent and cannot be undone.</p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setDeleteModalState({ isOpen: false, blogId: null, isDeleting: false })} 
                                disabled={deleteModalState.isDeleting}
                                className="flex-1 px-4 py-2.5 bg-dark-50 text-dark-700 rounded-xl font-semibold text-sm hover:bg-dark-100 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete} 
                                disabled={deleteModalState.isDeleting}
                                className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-xl font-semibold text-sm hover:bg-rose-600 transition-colors shadow-sm shadow-rose-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleteModalState.isDeleting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
