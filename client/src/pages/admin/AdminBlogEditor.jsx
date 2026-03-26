import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiPost, apiGet, apiPut, apiDelete } from '../../utils/api';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function AdminBlogEditor() {
    const navigate = useNavigate();
    const { id } = useParams();
    const quillRef = useRef(null);
    
    const [form, setForm] = useState({
        title: '',
        category: 'Market Trends',
        tags: '',
        summary: '',
        content: '',
        coverImage: '',
        isHighImpact: false
    });
    
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(!!id);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [mediaModal, setMediaModal] = useState({ open: false, type: '' }); // 'image' | 'video'
    const [mediaUrl, setMediaUrl] = useState('');

    const categories = ['Market Trends', 'Legal Updates', 'Announcements', 'Locality Insights', 'Offers', 'Guides', 'Other'];

    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                [{ 'align': [] }],
                ['link', 'image', 'video'],
                ['clean']
            ]
        }
    }), []);

    const formats = [
        'header', 'bold', 'italic', 'underline', 'strike', 'blockquote',
        'color', 'background',
        'list', 'bullet', 'indent', 'align',
        'link', 'image', 'video'
    ];

    useEffect(() => {
        if (id) {
            apiGet(`/blogs/admin/${id}`)
                .then(res => {
                    const b = res.blog;
                    setForm({
                        title: b.title || '',
                        category: b.category || 'Market Trends',
                        tags: b.tags?.join(', ') || '',
                        summary: b.summary || '',
                        content: b.content || '',
                        coverImage: b.images?.[0]?.url || '',
                        isHighImpact: b.isHighImpact || false
                    });
                })
                .catch(() => toast.error('Failed to load article'))
                .finally(() => setLoading(false));
        }
    }, [id]);

    // Open modal for image/video
    const openMediaModal = (type) => {
        setMediaUrl('');
        setMediaModal({ open: true, type });
    };

    // Insert media from modal
    const handleInsertMedia = () => {
        if (!mediaUrl.trim()) return toast.error('Please enter a valid URL');
        const editor = quillRef.current?.getEditor();
        if (!editor) return;
        const range = editor.getSelection(true);

        if (mediaModal.type === 'image') {
            editor.insertEmbed(range.index, 'image', mediaUrl.trim());
        } else if (mediaModal.type === 'video') {
            editor.insertEmbed(range.index, 'video', mediaUrl.trim());
        }
        editor.setSelection(range.index + 1);
        setMediaModal({ open: false, type: '' });
        setMediaUrl('');
        toast.success(`${mediaModal.type === 'image' ? 'Image' : 'Video'} inserted!`);
    };

    const insertToEditor = (type) => {
        const editor = quillRef.current?.getEditor();
        if (!editor) return;
        const range = editor.getSelection(true);

        switch (type) {
            case 'divider':
                editor.insertText(range.index, '\n───────────────────\n');
                editor.setSelection(range.index + 22);
                break;
            case 'heading':
                editor.insertText(range.index, '\n');
                editor.formatLine(range.index + 1, 1, 'header', 2);
                editor.setSelection(range.index + 1);
                break;
            case 'quote':
                editor.insertText(range.index, '\nYour quote here...\n');
                editor.formatLine(range.index + 1, 1, 'blockquote', true);
                editor.setSelection(range.index + 1, 18);
                break;
            case 'list':
                editor.insertText(range.index, '\nFirst item\nSecond item\nThird item\n');
                editor.formatLine(range.index + 1, 1, 'list', 'bullet');
                editor.formatLine(range.index + 12, 1, 'list', 'bullet');
                editor.formatLine(range.index + 24, 1, 'list', 'bullet');
                break;
            default:
                break;
        }
    };

    const handleSave = async (shouldPublish = false) => {
        if (!form.title.trim()) return toast.error('Title is required');
        if (!form.content.trim() || form.content === '<p><br></p>') return toast.error('Content is required');
        if (!form.summary.trim()) return toast.error('Summary is required for SEO');

        setSubmitting(true);
        try {
            const payload = {
                ...form,
                tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
                images: form.coverImage 
                    ? [{ url: form.coverImage }] 
                    : [{ url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&fit=crop' }]
            };
            
            if (id) {
                await apiPut(`/blogs/admin/${id}`, payload);
                toast.success('Article updated!');
            } else {
                await apiPost('/blogs', payload);
                toast.success('Article published!');
            }

            if (shouldPublish) navigate('/admin/blogs');
        } catch (err) {
            toast.error('Failed to save article');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        try {
            await apiDelete(`/blogs/admin/${id}`);
            toast.success('Article deleted');
            navigate('/admin/blogs');
        } catch {
            toast.error('Failed to delete');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
            <div className="text-center">
                <div className="w-10 h-10 rounded-full border-[3px] border-gray-200 border-t-primary-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-400 font-medium text-sm">Loading editor...</p>
            </div>
        </div>
    );

    return (
        <div className="h-screen bg-[#F7F8FA] flex flex-col font-sans overflow-hidden">
            
            {/* ─── Top Bar ─── */}
            <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-5 shrink-0 z-40 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/blogs')} className="text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1.5 transition-colors text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back
                    </button>
                    <div className="h-4 w-px bg-gray-200" />
                    <span className="text-gray-600 font-semibold text-sm">{id ? 'Edit Article' : 'New Article'}</span>
                    {form.isHighImpact && (
                        <span className="bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-rose-200">
                            ⚡ Alert
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {id && (
                        <button onClick={() => setShowDeleteConfirm(true)} className="px-3 py-1.5 text-rose-500 hover:bg-rose-50 rounded-lg text-sm font-semibold transition-colors">
                            Delete
                        </button>
                    )}
                    <button onClick={() => handleSave(false)} disabled={submitting} className="px-4 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                        Save Draft
                    </button>
                    <button onClick={() => handleSave(true)} disabled={submitting} className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-full shadow-md shadow-primary-500/20 transition-all active:scale-95 disabled:opacity-50">
                        {submitting ? 'Publishing...' : 'Publish'}
                    </button>
                </div>
            </header>

            {/* ─── Main Body ─── */}
            <div className="flex flex-1 min-h-0">

                {/* ─── Left Sidebar: Independently Scrollable ─── */}
                <aside className="w-[320px] bg-white border-r border-gray-200 shrink-0 shadow-[2px_0_16px_rgba(0,0,0,0.02)] flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto p-6">
                        <h2 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Post Details
                        </h2>

                        <div className="space-y-5">
                            {/* Category */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Category</label>
                                <select 
                                    value={form.category}
                                    onChange={e => setForm({...form, category: e.target.value})}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-semibold text-sm text-gray-800 cursor-pointer transition-all"
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Tags</label>
                                <input 
                                    type="text" 
                                    value={form.tags}
                                    onChange={e => setForm({...form, tags: e.target.value})}
                                    placeholder="rental, tips, legal (comma separated)"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium text-sm transition-all"
                                />
                            </div>

                            {/* Cover Image URL */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Cover Image</label>
                                <input 
                                    type="text" 
                                    value={form.coverImage}
                                    onChange={e => setForm({...form, coverImage: e.target.value})}
                                    placeholder="Paste image URL..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium text-sm transition-all"
                                />
                                {form.coverImage && (
                                    <img src={form.coverImage} alt="Cover preview" className="mt-2 w-full h-32 object-cover rounded-lg border border-gray-200" onError={e => e.target.style.display = 'none'} />
                                )}
                            </div>

                            {/* Summary */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Summary / Excerpt</label>
                                <textarea 
                                    rows="3"
                                    value={form.summary}
                                    onChange={e => setForm({...form, summary: e.target.value})}
                                    placeholder="Brief description shown on cards & search..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium text-sm resize-none transition-all leading-relaxed"
                                />
                            </div>

                            {/* High Impact Toggle */}
                            <div className="pt-3 border-t border-gray-100">
                                <button 
                                    onClick={() => setForm(f => ({ ...f, isHighImpact: !f.isHighImpact }))}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${form.isHighImpact ? 'bg-rose-50 border-rose-400 text-rose-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                >
                                    <span className="font-bold text-sm flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.1l6.4 12.9H5.6L12 6.1zM11 10v4h2v-4h-2zm0 5v2h2v-2h-2z" /></svg>
                                        High Impact Alert
                                    </span>
                                    <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.isHighImpact ? 'bg-rose-500' : 'bg-gray-300'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${form.isHighImpact ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </button>
                                <p className="text-[10px] text-gray-400 mt-1.5 leading-snug px-1">Sends a real-time toast popup to all active users.</p>
                            </div>
                        </div>

                        {/* ─── Quick Insert Tools ─── */}
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wide">Quick Insert</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { label: 'Image', type: 'image', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
                                    { label: 'Video', type: 'video', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /> },
                                    { label: 'Divider', type: 'divider', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" /> },
                                    { label: 'Heading', type: 'heading', icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12h10" /></> },
                                    { label: 'Quote', type: 'quote', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /> },
                                    { label: 'List', type: 'list', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" /> }
                                ].map(item => (
                                    <button 
                                        key={item.type}
                                        onClick={() => {
                                            if (item.type === 'image' || item.type === 'video') {
                                                openMediaModal(item.type);
                                            } else {
                                                insertToEditor(item.type);
                                            }
                                        }}
                                        className="border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center hover:border-primary-400 hover:bg-primary-50 transition-all cursor-pointer bg-white group active:scale-95"
                                    >
                                        <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-600 mb-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
                                        <span className="text-[10px] font-semibold text-gray-500 group-hover:text-primary-600 transition-colors">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ─── Main Editor Canvas ─── */}
                <main className="flex-1 overflow-y-auto flex justify-center py-8 px-6 lg:px-16 min-h-0">
                    <div className="w-full max-w-4xl">
                        <div className="bg-white shadow-lg shadow-gray-200/60 rounded-2xl overflow-hidden border border-gray-100 min-h-[780px] flex flex-col editor-wrapper">
                            
                            {/* Title Area */}
                            <div className="px-8 md:px-12 pt-12 pb-2">
                                <input 
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm({...form, title: e.target.value})}
                                    placeholder="Your article headline..."
                                    className="w-full text-3xl sm:text-4xl font-black text-gray-900 outline-none placeholder:text-gray-300 leading-tight bg-transparent"
                                />
                                <div className="h-[2px] w-12 bg-primary-500 mt-5 rounded-full" />
                            </div>

                            {/* Quill Editor */}
                            <div className="flex-1 px-4 md:px-8 pb-20 quill-body">
                                <ReactQuill 
                                    ref={quillRef}
                                    theme="snow" 
                                    value={form.content} 
                                    onChange={val => setForm({...form, content: val})} 
                                    modules={modules}
                                    formats={formats}
                                    placeholder="Start writing your article..."
                                />
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* ─── Media Insert Modal ─── */}
            {mediaModal.open && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setMediaModal({ open: false, type: '' })}>
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${mediaModal.type === 'image' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                                {mediaModal.type === 'image' ? (
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                ) : (
                                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Insert {mediaModal.type === 'image' ? 'Image' : 'Video'}
                                </h3>
                                <p className="text-xs text-gray-400">
                                    {mediaModal.type === 'image' ? 'Paste the direct URL to an image file' : 'Paste a YouTube, Vimeo, or direct video link'}
                                </p>
                            </div>
                        </div>
                        
                        <input 
                            type="text"
                            value={mediaUrl}
                            onChange={e => setMediaUrl(e.target.value)}
                            placeholder={mediaModal.type === 'image' ? 'https://example.com/photo.jpg' : 'https://youtube.com/watch?v=...'}
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && handleInsertMedia()}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium text-sm transition-all mb-2"
                        />

                        {/* Live Preview */}
                        {mediaUrl && mediaModal.type === 'image' && (
                            <div className="mb-4 mt-2">
                                <img 
                                    src={mediaUrl} 
                                    alt="Preview" 
                                    className="w-full h-36 object-cover rounded-lg border border-gray-200" 
                                    onError={e => e.target.style.display = 'none'}
                                />
                            </div>
                        )}
                        
                        <div className="flex gap-3 mt-4">
                            <button 
                                onClick={() => setMediaModal({ open: false, type: '' })} 
                                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleInsertMedia} 
                                disabled={!mediaUrl.trim()}
                                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors disabled:opacity-40"
                            >
                                Insert
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Delete Confirmation Modal ─── */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete this article?</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">This will permanently remove the article along with all comments. This cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors">Cancel</button>
                            <button onClick={handleDelete} className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-semibold text-sm hover:bg-rose-700 transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Editor Styles ─── */}
            <style dangerouslySetInnerHTML={{__html: `
                .editor-wrapper .ql-toolbar.ql-snow {
                    border: none;
                    background: #f8fafc;
                    border-radius: 10px;
                    padding: 10px 12px;
                    margin: 16px 16px 12px;
                    border: 1px solid #e2e8f0;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                .editor-wrapper .ql-container.ql-snow {
                    border: none;
                    font-size: 1.05rem;
                    font-family: inherit;
                }
                .editor-wrapper .ql-editor {
                    min-height: 500px;
                    padding: 8px 16px;
                    line-height: 1.9;
                    color: #1e293b;
                }
                .editor-wrapper .ql-editor p { margin-bottom: 1em; }
                .editor-wrapper .ql-editor h1 { font-size: 2em; font-weight: 800; margin-bottom: 0.5em; }
                .editor-wrapper .ql-editor h2 { font-size: 1.5em; font-weight: 700; margin-bottom: 0.5em; }
                .editor-wrapper .ql-editor h3 { font-size: 1.25em; font-weight: 600; margin-bottom: 0.5em; }
                .editor-wrapper .ql-editor blockquote {
                    border-left: 4px solid #6366f1;
                    padding-left: 16px;
                    color: #64748b;
                    font-style: italic;
                    margin: 1em 0;
                }
                .editor-wrapper .ql-editor img {
                    border-radius: 12px;
                    margin: 1em 0;
                    max-width: 100%;
                }
                .editor-wrapper .ql-editor.ql-blank::before {
                    font-style: italic;
                    color: #cbd5e1;
                    font-size: 1.05rem;
                }
                .editor-wrapper .ql-snow .ql-stroke { stroke: #64748b; }
                .editor-wrapper .ql-snow .ql-fill { fill: #64748b; }
                .editor-wrapper .ql-snow .ql-picker { color: #475569; font-weight: 600; }
                .editor-wrapper .ql-snow button:hover .ql-stroke { stroke: #6366f1; }
                .editor-wrapper .ql-snow button:hover .ql-fill { fill: #6366f1; }
                .editor-wrapper .ql-snow button.ql-active .ql-stroke { stroke: #6366f1; }
                .editor-wrapper .ql-snow button.ql-active .ql-fill { fill: #6366f1; }
            `}} />
        </div>
    );
}
