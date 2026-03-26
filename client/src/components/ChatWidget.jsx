import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { apiGet, apiPost, apiPatch } from '../utils/api';
import { io } from 'socket.io-client';

export default function ChatWidget() {
    const { user } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [activeContact, setActiveContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const [socket, setSocket] = useState(null);

    // Initial setup and socket connection
    useEffect(() => {
        if (!user) return;
        fetchConversations();
        
        const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('setup', { clerkId: user.id });
        });

        const handleOpenEvt = (e) => {
            setIsOpen(true);
            handleOpenChat(e.detail);
        };
        window.addEventListener('open-chat', handleOpenEvt);

        return () => {
            window.removeEventListener('open-chat', handleOpenEvt);
            newSocket.disconnect();
        };
    }, [user]);

    // Handle incoming websocket messages
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (msg) => {
            // If the message is from our currently open active chat
            if (activeContact && String(msg.sender) === String(activeContact._id)) {
                setMessages((prev) => [...prev, msg]);
                setTimeout(scrollToBottom, 100);
                // Auto-mark as read since we are looking at it
                apiPatch(`/messages/${activeContact._id}/read`, {}).catch(console.error);
            }
            // Always refresh conversations to pick up latest message snippet or unread count
            fetchConversations();
        };

        socket.on('new_message', handleNewMessage);
        return () => socket.off('new_message', handleNewMessage);
    }, [socket, activeContact]);

    const fetchConversations = async () => {
        try {
            const data = await apiGet('/messages');
            setConversations(data.conversations || []);
        } catch (err) {
            console.error('Failed to fetch conversations', err);
        }
    };

    const fetchMessages = async (contactId) => {
        setLoading(true);
        try {
            const data = await apiGet(`/messages/${contactId}`);
            setMessages(data.messages || []);
            // Mark as read immediately
            await apiPatch(`/messages/${contactId}/read`, {});
            fetchConversations(); // refresh unread counters
            setTimeout(scrollToBottom, 100);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChat = (contact) => {
        setActiveContact(contact);
        fetchMessages(contact._id);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeContact) return;
        
        const text = newMessage;
        setNewMessage(''); // optimistic clear
        
        try {
            const data = await apiPost(`/messages/${activeContact._id}`, { text });
            setMessages((prev) => [...prev, data.message]);
            setTimeout(scrollToBottom, 100);
            fetchConversations(); // update latest message preview
        } catch (err) {
            console.error('Failed to send message', err);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const unreadTotal = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

    return (
        <div className="relative">
            {/* Widget Toggle Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-dark-500 hover:text-dark-900 focus:outline-none transition-colors rounded-full hover:bg-dark-50"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {unreadTotal > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-rose-500 border-2 border-white rounded-full">
                        {unreadTotal > 9 ? '9+' : unreadTotal}
                    </span>
                )}
            </button>

            {/* Chat Overlay */}
            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40 bg-transparent" 
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-3 w-[340px] max-h-[500px] h-[70vh] bg-white border border-dark-100 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-slide-up origin-top-right transform">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-dark-100 bg-dark-25 flex items-center justify-between shrink-0">
                            {activeContact ? (
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setActiveContact(null)}
                                        className="p-1.5 -ml-1.5 hover:bg-dark-100 rounded-lg text-dark-500 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 bg-primary-100 text-primary-700 font-bold rounded-full flex items-center justify-center text-xs">
                                            {activeContact.firstName?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-dark-900 leading-none">{activeContact.firstName} {activeContact.lastName}</p>
                                            <p className="text-[10px] text-dark-400 capitalize">{activeContact.role}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <h3 className="text-sm font-bold text-dark-900">Messages</h3>
                            )}
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-dark-100 rounded-lg text-dark-400 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Body */}
                        {!activeContact ? (
                            /* Contacts List */
                            <div className="flex-1 overflow-y-auto w-full bg-white divide-y divide-dark-50">
                                {conversations.length === 0 ? (
                                    <div className="p-6 text-center text-dark-400 text-sm mt-10">
                                        <svg className="w-10 h-10 mx-auto text-dark-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                        No messages yet.
                                    </div>
                                ) : (
                                    conversations.map((c) => (
                                        <button 
                                            key={c.contact._id} 
                                            onClick={() => handleOpenChat(c.contact)}
                                            className="w-full text-left p-4 hover:bg-dark-25 transition-colors flex items-center gap-3 relative"
                                        >
                                            <div className="w-10 h-10 bg-primary-100 text-primary-700 font-bold rounded-full flex shrink-0 items-center justify-center text-sm">
                                                {c.contact.firstName?.[0]}
                                            </div>
                                            <div className="flex-1 min-w-0 pr-2">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <p className="text-sm font-bold text-dark-900 truncate">{c.contact.firstName} {c.contact.lastName}</p>
                                                </div>
                                                <p className="text-xs text-dark-500 truncate">{c.lastMessage.text}</p>
                                            </div>
                                            <div className="flex flex-col items-end shrink-0 gap-1 ml-auto">
                                                <span className="text-[10px] text-dark-400">
                                                    {new Date(c.lastMessage.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                                {c.unreadCount > 0 && (
                                                    <div className="w-5 h-5 bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm">
                                                        {c.unreadCount}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        ) : (
                            /* Active Chat Box */
                            <>
                                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#f0f2f5] custom-scrollbar">
                                    {loading ? (
                                        <div className="flex justify-center py-4">
                                            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : (
                                        messages.map((msg, idx) => {
                                            // _id might literally be current DB user ID, but we just compare sender
                                            // The backend uses req.user._id, which is stringified from DB. But let's check
                                            // `msg.sender` versus `activeContact._id`. If it's NOT activeContact, it's us.
                                            const isMe = String(msg.sender) !== String(activeContact._id);
                                            return (
                                                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[80%] px-3.5 py-2 text-sm shadow-sm ${
                                                        isMe 
                                                        ? 'bg-primary-600 text-white rounded-2xl rounded-tr-sm' 
                                                        : 'bg-white text-dark-900 border border-dark-100 rounded-2xl rounded-tl-sm'
                                                    }`}>
                                                        <p className="break-words">{msg.text}</p>
                                                        <span className={`text-[9px] block mt-1 text-right ${isMe ? 'text-primary-200' : 'text-dark-400'}`}>
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                                <div className="p-3 bg-white border-t border-dark-100 shrink-0">
                                    <form onSubmit={handleSendMessage} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 bg-dark-50 border border-dark-200 text-sm rounded-full px-4 py-2 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={!newMessage.trim()}
                                            className="w-10 h-10 shrink-0 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
