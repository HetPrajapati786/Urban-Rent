import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function SmartToaster({ userRole }) {
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Only initialize socket if they are a user.
        // Also avoid connecting unnecessarily if they strictly suppress all notifications.
        const allowNotifications = localStorage.getItem('urbanrent_allow_blog_notifications') !== 'false';
        if (!allowNotifications) return;

        const newSocket = io(SOCKET_URL, { withCredentials: true });
        setSocket(newSocket);

        newSocket.on('new-blog-alert', (blog) => {
            // Intelligent flash toast!
            // Do not spam admins with their own publishes via this avenue
            if (userRole === 'admin') return; 

            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden border border-primary-200 cursor-pointer hover:bg-primary-50 transition-colors`}
                    onClick={() => {
                        toast.dismiss(t.id);
                        const basePath = userRole === 'tenant' ? '/tenant' : (userRole === 'manager' ? '/manager' : '');
                        navigate(`${basePath}/blogs/${blog.slug}`);
                    }}
                >
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary-400 to-primary-600 flex items-center justify-center text-white shadow-inner">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                                </div>
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">Breaking News • {blog.category}</p>
                                <p className="text-sm font-black text-dark-900 leading-tight">
                                    {blog.title}
                                </p>
                                <p className="mt-1 text-[13px] text-dark-500 line-clamp-2 leading-snug">
                                    {blog.summary}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex border-l border-dark-100">
                        <button
                            onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }}
                            className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-medium text-dark-400 hover:text-dark-600 focus:outline-none"
                        >
                            Close
                        </button>
                    </div>
                </div>
            ), { duration: 8000, position: 'bottom-right' });
        });

        return () => newSocket.close();
    }, [userRole, navigate]);

    return null; // Logic-only headless component injecting intelligent toasts
}
