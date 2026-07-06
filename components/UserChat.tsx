'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, MessageCircle, Info, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  name: string;
  message: string;
  timestamp: string;
  isAdmin?: boolean;
}

export default function UserChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [name, setName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  // Load name from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('chat_user_name');
      if (savedName) {
        const t = setTimeout(() => {
          setName(savedName);
        }, 0);
        return () => clearTimeout(t);
      }
    }
  }, []);

  // Fetch messages function
  const fetchMessages = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await fetch('/api/chat');
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => {
          // If messages count or content changed, update
          if (JSON.stringify(prev) !== JSON.stringify(data.messages)) {
            return data.messages;
          }
          return prev;
        });
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Gagal memuat pesan. Mencoba lagi...');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Poll for new messages every 2 seconds
  useEffect(() => {
    const t = setTimeout(() => {
      fetchMessages();
    }, 0);
    
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 2000);

    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, []);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      // If it's first load or user is already near the bottom, scroll to bottom
      const isNearBottom = 
        container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      
      if (isFirstLoad.current || isNearBottom) {
        chatEndRef.current?.scrollIntoView({ behavior: isFirstLoad.current ? 'auto' : 'smooth' });
        isFirstLoad.current = false;
      }
    }
  }, [messages]);

  // Handle message sending
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setIsSending(true);
    const displayName = name.trim() || 'Anonim';
    
    // Save name to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat_user_name', displayName);
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: displayName,
          message: messageText,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessageText('');
        // Append the message locally for instant responsiveness before next poll
        setMessages((prev) => [...prev, data.message]);
        // Force scroll to bottom after self send
        setTimeout(() => {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      } else {
        setError(data.error || 'Gagal mengirim pesan');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Koneksi bermasalah. Gagal mengirim.');
    } finally {
      setIsSending(false);
    }
  };

  // Helper to get random avatar color based on name string
  const getAvatarColor = (str: string, isAdmin = false) => {
    if (isAdmin) return 'bg-blue-600 text-white font-semibold ring-2 ring-blue-300 ring-offset-1';
    
    const colors = [
      'bg-indigo-500 text-white',
      'bg-violet-500 text-white',
      'bg-pink-500 text-white',
      'bg-rose-500 text-white',
      'bg-amber-500 text-slate-900',
      'bg-orange-500 text-white',
      'bg-blue-500 text-white',
      'bg-teal-500 text-white',
      'bg-cyan-500 text-slate-900',
    ];
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Helper to get random bubble backgrounds for other users (warna warni)
  const getBubbleStyle = (senderName: string, isMe: boolean, isSystemAdmin: boolean) => {
    if (isSystemAdmin) {
      return 'bg-blue-50 text-slate-800 rounded-tl-none border border-blue-100/50 shadow-xs';
    }
    if (isMe) {
      return 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-100';
    }

    // Other users: "warna warni" soft and aesthetic pastel styles
    const bubbleColors = [
      'bg-indigo-50 text-indigo-950 border border-indigo-100 rounded-tl-none',
      'bg-purple-50 text-purple-950 border border-purple-100 rounded-tl-none',
      'bg-rose-50 text-rose-950 border border-rose-100 rounded-tl-none',
      'bg-emerald-50 text-emerald-950 border border-emerald-100 rounded-tl-none',
      'bg-amber-50 text-amber-950 border border-amber-100 rounded-tl-none',
      'bg-orange-50 text-orange-950 border border-orange-100 rounded-tl-none',
      'bg-pink-50 text-pink-950 border border-pink-100 rounded-tl-none',
      'bg-teal-50 text-teal-950 border border-teal-100 rounded-tl-none',
      'bg-cyan-50 text-cyan-950 border border-cyan-100 rounded-tl-none',
    ];

    let hash = 0;
    for (let i = 0; i < senderName.length; i++) {
      hash = senderName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % bubbleColors.length;
    return bubbleColors[index];
  };

  // Format time beautifully (e.g., 14:32)
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-[85vh] sm:h-[90vh] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden" id="user-chat-container">
      {/* Chat Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0" id="chat-header">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-slate-800 tracking-tight">
              LiveConnect <span className="text-blue-600">Portal</span>
            </h1>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-xs text-slate-500 font-medium">Bebas & Tanpa Login</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end text-right">
          <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">
            User Panel
          </span>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Mendukung Real-time</p>
        </div>
      </div>

      {/* Connection status/error messages */}
      {error && (
        <div className="bg-rose-50 border-b border-rose-100 text-rose-600 text-xs py-2 px-4 flex items-center justify-between animate-fade-in" id="error-banner">
          <span className="flex items-center space-x-1">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </span>
          <button onClick={() => fetchMessages()} className="font-semibold underline hover:text-rose-700 cursor-pointer">
            Muat ulang
          </button>
        </div>
      )}

      {/* Messages Feed Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200"
        id="chat-messages-scrollable"
      >
        {isLoading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3" id="loading-spinner">
            <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            <p className="text-xs text-slate-500 font-medium">Memuat obrolan...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4" id="empty-state">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <p className="font-display font-bold text-slate-800">Obrolan Masih Kosong</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Jadilah yang pertama menuliskan sesuatu di sini! Masukkan nama dan ketik pesan Anda di bawah.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4" id="messages-list">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isSystemAdmin = !!msg.isAdmin;
                const isMe = !isSystemAdmin && msg.name.trim().toLowerCase() === (name.trim() || 'Anonim').toLowerCase();
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    className={`flex items-start space-x-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse space-x-reverse' : 'mr-auto flex-row'}`}
                  >
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0 ${getAvatarColor(msg.name, isSystemAdmin)}`}>
                      {isSystemAdmin ? 'AD' : msg.name.substring(0, 2).toUpperCase()}
                    </div>

                    {/* Bubble Content */}
                    <div className="flex flex-col space-y-1">
                      {/* Name & Badge */}
                      <div className={`flex items-center space-x-1.5 text-xs ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className="font-bold text-slate-700">{msg.name}</span>
                        {isSystemAdmin && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold text-white bg-blue-600 rounded tracking-wider uppercase">
                            Admin
                          </span>
                        )}
                      </div>

                      {/* Bubble box */}
                      <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm break-words leading-relaxed ${getBubbleStyle(msg.name, isMe, isSystemAdmin)}`}>
                        <p>{msg.message}</p>
                      </div>

                      {/* Timestamp */}
                      <span className={`text-[9px] text-slate-400 font-mono ${isMe ? 'text-right' : 'text-left'}`}>
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Send Message Form */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 space-y-3" id="message-form">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          {/* Name Input */}
          <div className="relative flex-shrink-0 sm:w-44">
            <span className="absolute left-3 top-2.5 text-slate-400">
              <User className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Nama Anda..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition"
              id="name-input"
            />
          </div>

          {/* Message Text Input */}
          <div className="flex-1 flex space-x-2">
            <input
              type="text"
              placeholder="Ketik kata-kata obrolan..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              maxLength={500}
              disabled={isSending}
              className="flex-1 px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition"
              id="message-input"
            />
            
            <button
              type="submit"
              disabled={isSending || !messageText.trim()}
              className={`px-4 py-2 rounded-xl text-white font-bold text-sm flex items-center justify-center space-x-1.5 transition ${
                messageText.trim() 
                  ? 'bg-blue-600 hover:bg-blue-700 active:scale-95 cursor-pointer shadow-lg shadow-blue-100' 
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
              id="send-button"
            >
              {isSending ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>Kirim</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400 px-1">
          <span>* Nama default adalah &quot;Anonim&quot; jika dikosongkan.</span>
          <span>{messageText.length}/500</span>
        </div>
      </form>
    </div>
  );
}
