import Blog from '../models/Blog.js';
import BlogInteraction from '../models/BlogInteraction.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { generateBlogTopics, generateBlogSummary, improveContent, personalizeFeed } from '../services/aiService.js';
import { io } from '../server.js';

/* ===========================
 * PUBLIC / FEED ENDPOINTS 
 * =========================== */

// Get published blogs (Latest, Trending, Personalized logic applied here)
export const getBlogs = async (req, res) => {
    try {
        const { filter = 'latest', category, search } = req.query;

        let query = { status: 'published' };

        if (category && category !== 'All') {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        let sortOption = { publishedAt: -1 }; // latest default

        if (filter === 'trending') {
            // Sort by a mix of views + likes
            sortOption = { views: -1, likesCount: -1 };
        } else if (filter === 'personalized' && req.user) {
            // Fetch AI personalization context
            const personalization = await personalizeFeed(req.user._id, []);
            if (personalization.recommendedCategories?.length > 0) {
                // Prioritize their recommended categories unless overridden
                if (!category) {
                    query.category = { $in: personalization.recommendedCategories };
                }
            }
        }

        const blogs = await Blog.find(query).sort(sortOption).limit(20);

        res.json({ blogs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching blogs' });
    }
};

export const getBlogBySlug = async (req, res) => {
    try {
        const blog = await Blog.findOne({ slug: req.params.slug });
        if (!blog) return res.status(404).json({ message: 'Not found' });

        // Safely record view if user logged in
        if (req.user) {
            try {
                await BlogInteraction.create({ user: req.user._id, blog: blog._id, type: 'view' });
                await Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } });
                blog.views += 1; // Update local obj for response
            } catch (ignored) {
                // If they already viewed it, ignore the duplicate unique constraint error
            }
        }

        // Fetch comments
        const comments = await Comment.find({ blog: blog._id }).sort({ createdAt: -1 }).limit(30);

        res.json({ blog, comments });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching blog' });
    }
};

/* ===========================
 * AUTHOR / ADMIN ENDPOINTS 
 * =========================== */

export const createBlog = async (req, res) => {
    try {
        const { title, summary, content, category, tags, images, isHighImpact } = req.body;
        
        let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);
        
        // Define status. Manager submits -> pending_approval. Admin submits -> published (or draft).
        const status = req.user.role === 'admin' ? 'published' : 'pending_approval';
        const publishedAt = status === 'published' ? new Date() : null;

        const newBlog = await Blog.create({
            title,
            slug,
            summary,
            content,
            category,
            tags: tags ? tags.map(t => t.trim()) : [],
            images: images || [],
            author: req.user._id,
            status,
            publishedAt,
            isHighImpact: req.user.role === 'admin' ? isHighImpact : false
        });

        // Trigger smart toaster real-time notification if Admin publishes High Impact news immediately
        if (status === 'published' && newBlog.isHighImpact) {
            io.emit('new-blog-alert', {
                id: newBlog._id,
                slug: newBlog.slug,
                title: newBlog.title,
                summary: newBlog.summary,
                category: newBlog.category
            });
        }

        // Send bell-icon notification to all tenants & managers
        if (status === 'published') {
            try {
                const allUsers = await User.find({ role: { $in: ['tenant', 'manager'] }, isActive: true }).select('_id');
                const notifications = allUsers.map(u => ({
                    user: u._id,
                    title: `📰 New: ${newBlog.title}`,
                    message: newBlog.summary || 'A new article has been published on the platform.',
                    type: 'info',
                    link: `/tenant/blogs/${newBlog.slug}`
                }));
                if (notifications.length > 0) {
                    await Notification.insertMany(notifications);
                }
            } catch (notifErr) {
                console.error('Failed to send blog notifications:', notifErr);
            }
        }

        res.status(201).json({ message: status === 'published' ? 'Published live!' : 'Submitted for review.', blog: newBlog });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating blog' });
    }
};

export const getManagerBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ author: req.user._id }).sort({ updatedAt: -1 });
        res.json({ blogs });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching your blogs' });
    }
};

export const getPendingApprovals = async (req, res) => {
    try {
        const blogs = await Blog.find({ status: 'pending_approval' }).sort({ createdAt: 1 });
        res.json({ blogs });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching pending blogs' });
    }
};

export const reviewBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, feedback, isHighImpact } = req.body; // action: 'approve' or 'reject'

        const blog = await Blog.findById(id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });

        if (action === 'approve') {
            blog.status = 'published';
            blog.publishedAt = new Date();
            blog.isHighImpact = isHighImpact || false;
            if (feedback) blog.adminFeedback = feedback;
            await blog.save();

            // Notify all clients of new content publication if flagged high impact
            if (blog.isHighImpact) {
                io.emit('new-blog-alert', {
                    id: blog._id,
                    slug: blog.slug,
                    title: blog.title,
                    summary: blog.summary,
                    category: blog.category
                });
            }

            return res.json({ message: 'Blog approved and published', blog });
        } else if (action === 'reject') {
            blog.status = 'rejected';
            blog.adminFeedback = feedback || 'Does not meet our community guidelines.';
            await blog.save();
            return res.json({ message: 'Blog rejected', blog });
        }

        res.status(400).json({ message: 'Invalid action' });
    } catch (err) {
        res.status(500).json({ message: 'Error reviewing blog' });
    }
};

export const getAdminBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });
        res.json({ blog });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching blog data' });
    }
};

export const updateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, summary, content, category, tags, images, isHighImpact } = req.body;
        
        let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);
        
        const blog = await Blog.findByIdAndUpdate(id, {
            title,
            slug, // Keep slug updating dynamically to match the title
            summary,
            content,
            category,
            tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
            images: images || [],
            isHighImpact,
            updatedAt: new Date()
        }, { new: true });

        res.json({ message: 'Updated logically', blog });
    } catch (err) {
        res.status(500).json({ message: 'Error updating blog metadata' });
    }
};

export const deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;
        await Blog.findByIdAndDelete(id);
        
        // Cleanup associated dependencies
        await BlogInteraction.deleteMany({ blog: id });
        await Comment.deleteMany({ blog: id });

        res.json({ message: 'Blog eradicated completely' });
    } catch (err) {
        res.status(500).json({ message: 'Critical failure attempting deletion' });
    }
};

/* ===========================
 * INTERACTIONS (LIKE, MARK) 
 * =========================== */

export const toggleInteraction = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.body; // 'like' or 'bookmark'

        if (!['like', 'bookmark'].includes(type)) return res.status(400).json({ message: 'Invalid interaction' });

        const blog = await Blog.findById(id);
        if (!blog) return res.status(404).json({ message: 'Not found' });

        // Check if exists
        const existing = await BlogInteraction.findOne({ user: req.user._id, blog: id, type });

        if (existing) {
            // Remove
            await BlogInteraction.findByIdAndDelete(existing._id);
            if (type === 'like') await Blog.findByIdAndUpdate(id, { $inc: { likesCount: -1 } });
            if (type === 'bookmark') await Blog.findByIdAndUpdate(id, { $inc: { bookmarksCount: -1 } });
            res.json({ message: `Removed ${type}`, active: false });
        } else {
            // Add
            await BlogInteraction.create({ user: req.user._id, blog: id, type });
            if (type === 'like') await Blog.findByIdAndUpdate(id, { $inc: { likesCount: 1 } });
            if (type === 'bookmark') await Blog.findByIdAndUpdate(id, { $inc: { bookmarksCount: 1 } });
            res.json({ message: `Added ${type}`, active: true });
        }
    } catch (err) {
        res.status(500).json({ message: 'Interaction failed' });
    }
};

/* ===========================
 * COMMENTS 
 * =========================== */

export const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        const comment = await Comment.create({
            blog: id,
            user: req.user._id,
            text
        });

        await Blog.findByIdAndUpdate(id, { $inc: { commentsCount: 1 } });

        // refetch to populate user
        const popComment = await Comment.findById(comment._id);
        res.status(201).json({ comment: popComment });
    } catch (err) {
        res.status(500).json({ message: 'Failed to post comment' });
    }
};

/* ===========================
 * AI AGENT ENDPOINTS 
 * =========================== */

export const getAITopics = async (req, res) => {
    try {
        const topics = await generateBlogTopics();
        res.json({ topics });
    } catch (err) {
        res.status(500).json({ message: 'AI failed to generate topics' });
    }
};

export const getAISummary = async (req, res) => {
    try {
        const { content } = req.body;
        const summary = await generateBlogSummary(content);
        res.json({ summary });
    } catch (err) {
        res.status(500).json({ message: 'AI failed to summarize' });
    }
};

export const enhanceBlogContent = async (req, res) => {
    try {
        const { content } = req.body;
        const enhanced = await improveContent(content);
        res.json({ enhanced });
    } catch (err) {
        res.status(500).json({ message: 'AI failed to enhance text' });
    }
};

export const getUserReadingHistory = async (req, res) => {
    try {
        const history = await BlogInteraction.find({ user: req.user._id, type: 'view' })
            .populate('blog', 'title slug images createdAt category')
            .sort({ createdAt: -1 })
            .limit(10);
        res.json({ history });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch history' });
    }
};
