import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useUser, SignInButton } from '@clerk/clerk-react';
import { apiGet } from '../utils/api';
import BlogCard from './tenant/BlogCard';

export default function LandingBlogs() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isSignedIn } = useAuth();
    const { user } = useUser();

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                // Fetch just the latest 2 published blogs
                const data = await apiGet('/blogs/published?limit=2&page=1');
                setBlogs(data.blogs);
            } catch (err) {
                console.error('Failed to load landing blogs:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchBlogs();
    }, []);

    if (loading || blogs.length === 0) return null;

    const userRole = user?.unsafeMetadata?.role || user?.publicMetadata?.role;
    const viewAllLink = isSignedIn 
        ? (userRole === 'manager' ? '/manager/knowledge-base' : '/blogs') 
        : null;

    return (
        <section className="py-20 bg-dark-25">
            <div className="max-w-[1400px] mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-black text-dark-900 mb-4">Latest News & Updates</h2>
                    <p className="text-dark-500 max-w-2xl mx-auto">Stay updated with the latest tips, tricks, and news from Urban Rent.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-10">
                    {blogs.slice(0, 2).map(blog => (
                        <div key={blog._id} className="h-full">
                            <BlogCard 
                                blog={blog} 
                                // Since these are on landing page, let's link them to the blog detail if signed in
                                // Or trigger sign in if not? The Prompt: "put a button which says view all and to view all you have to login" implies the blogs themselves should probably just show info, but clicking them might also trigger login. Let's make the whole card do login if signed out.
                            />
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    {isSignedIn ? (
                        <Link 
                            to={viewAllLink}
                            className="inline-flex items-center gap-2 bg-dark-900 text-white font-bold px-8 py-4 rounded-xl hover:bg-dark-800 transition-colors"
                        >
                            View All News
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    ) : (
                        <SignInButton mode="modal">
                            <button className="inline-flex items-center gap-2 bg-dark-900 text-white font-bold px-8 py-4 rounded-xl hover:bg-dark-800 transition-colors">
                                View All News
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </button>
                        </SignInButton>
                    )}
                </div>
            </div>
        </section>
    );
}
