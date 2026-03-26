import { useState, useEffect } from 'react';
import ManagerLayout from '../../layouts/ManagerLayout';
import BlogCard from '../../components/tenant/BlogCard';
import { apiGet } from '../../utils/api';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

export default function ManagerBlogs() {
    const [ref, isVisible] = useScrollAnimation(0.05);
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('latest');
    const [category, setCategory] = useState('All');
    const [search, setSearch] = useState('');

    const categories = ['All', 'Market Trends', 'Legal Updates', 'Announcements', 'Locality Insights', 'Offers', 'Guides', 'Other'];

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            query.append('filter', filter);
            if (category !== 'All') query.append('category', category);
            if (search) query.append('search', search);

            const res = await apiGet(`/blogs?${query.toString()}`);
            setBlogs(res.blogs || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
        // eslint-disable-next-line
    }, [filter, category]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchBlogs();
    };

    return (
        <ManagerLayout breadcrumbs={[{ label: 'Dashboard', href: '/manager/dashboard' }, { label: 'Platform News' }]}>
            <div className="max-w-7xl mx-auto flex flex-col h-full min-h-0">
                
                {/* Header */}
                <div ref={ref} className={`flex-shrink-0 mb-4 transition-all duration-700 flex flex-col md:flex-row md:items-center justify-between gap-4 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div>
                        <div className="flex items-center gap-3 mb-1.5">
                            <span className="inline-block text-primary-600 font-bold text-[10px] uppercase tracking-widest bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                                Admin Bulletins
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black text-dark-900 leading-tight">
                                Platform News & <span className="gradient-text">Updates</span>
                            </h1>
                        </div>
                        <p className="text-dark-500 text-sm max-w-2xl">
                            Stay informed on recent administrative operations, legal compliance shifts, and localized market insights.
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex-shrink-0 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-dark-100 mb-4 z-30">
                    <div className="flex flex-col lg:flex-row gap-3 justify-between items-center">
                        <div className="flex-1 w-full flex flex-wrap gap-1.5">
                            {['latest', 'trending', 'personalized'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all active:scale-95 ${filter === f ? 'bg-dark-900 text-white shadow-md' : 'bg-dark-50 text-dark-600 hover:bg-dark-100 border border-dark-100'}`}
                                >
                                    {f === 'personalized' ? (
                                        <span className="flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5 text-primary-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                            For You
                                        </span>
                                    ) : f}
                                </button>
                            ))}
                        </div>

                        <div className="flex w-full lg:w-auto gap-3 items-center">
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="bg-dark-50 border border-dark-100 text-dark-800 text-xs font-semibold rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2 outline-none cursor-pointer"
                            >
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <form onSubmit={handleSearch} className="relative w-full lg:w-48">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                                    <svg className="w-3.5 h-3.5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="bg-dark-50 border border-dark-100 text-dark-900 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-8 p-2 outline-none font-medium placeholder-dark-400"
                                    placeholder="Search blogs..."
                                />
                            </form>
                        </div>
                    </div>
                </div>

                {/* Grid - scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pb-4">
                {loading ? (
                    <div className="flex flex-col gap-5 lg:gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="animate-pulse bg-white rounded-2xl border border-dark-100 h-[240px] flex shadow-sm">
                                <div className="w-[320px] bg-dark-50 rounded-l-2xl border-r border-dark-100" />
                                <div className="p-8 flex flex-col flex-1 justify-center space-y-4">
                                    <div className="h-4 bg-dark-50 rounded w-1/4" />
                                    <div className="h-6 bg-dark-50 rounded w-3/4" />
                                    <div className="h-4 bg-dark-50 rounded w-full" />
                                    <div className="h-4 bg-dark-50 rounded w-5/6" />
                                    <div className="h-6 bg-dark-50 rounded-xl w-32 mt-6" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : blogs.length > 0 ? (
                    <div className="flex flex-col gap-5 lg:gap-6">
                        {blogs.map((blog, idx) => (
                            <div key={blog._id} className="animate-fade-in" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}>
                                <BlogCard blog={blog} userRole="manager" basePath="/tenant/blogs" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white border border-dark-100 border-dashed rounded-3xl mx-auto shadow-sm max-w-3xl">
                        <svg className="w-16 h-16 mx-auto text-dark-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                        <h3 className="text-xl font-bold text-dark-900 mb-2">No Updates Found</h3>
                        <p className="text-dark-400 text-sm max-w-sm mx-auto">Looks like the Admin desk hasn't posted anything under these filters. Check back later!</p>
                        <button onClick={() => { setFilter('latest'); setCategory('All'); setSearch(''); }} className="mt-6 px-6 py-2.5 bg-dark-900 text-white rounded-xl font-bold text-sm hover:bg-dark-800 transition-colors shadow-lg shadow-dark-900/10 active:scale-[0.98]">
                            Clear Filters
                        </button>
                    </div>
                )}
                </div>
            </div>
        </ManagerLayout>
    );
}
