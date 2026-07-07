'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { Send, User, MessageCircle, Info, Sparkles, Upload, X, Check, Image as ImageIcon } from 'lucide-react';

interface ChatMessage {
  id: string;
  name: string;
  message: string;
  timestamp: string;
  isAdmin?: boolean;
  avatar?: string;
}

const TEMPLATE_AVATARS = [
  { id: 't1', type: 'emoji', value: '🦊', label: 'Fox' },
  { id: 't2', type: 'emoji', value: '🦁', label: 'Lion' },
  { id: 't3', type: 'emoji', value: '🐼', label: 'Panda' },
  { id: 't4', type: 'emoji', value: '🤖', label: 'Robot' },
  { id: 't5', type: 'emoji', value: '👽', label: 'Alien' },
  { id: 't6', type: 'emoji', value: '🧑‍🚀', label: 'Astronaut' },
  { id: 't7', type: 'emoji', value: '🐱', label: 'Cat' },
  { id: 't8', type: 'emoji', value: '🐶', label: 'Dog' },
  { id: 't9', type: 'emoji', value: '🦄', label: 'Unicorn' },
  { id: 't10', type: 'emoji', value: '🧙', label: 'Wizard' },
  { id: 't11', type: 'emoji', value: '🐸', label: 'Frog' },
  { id: 't12', type: 'emoji', value: '🐉', label: 'Dragon' },
];

export default function UserChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [name, setName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chat_user_name') || '';
    }
    return '';
  });
  const [userAvatar, setUserAvatar] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chat_user_avatar') || '';
    }
    return '';
  });
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  // Sync name to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat_user_name', name);
    }
  }, [name]);

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
    if (messages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: isFirstLoad.current ? 'auto' : 'smooth' });
      isFirstLoad.current = false;
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
          avatar: userAvatar || undefined,
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

  // Helper to render user avatar
  const renderAvatar = (msg: ChatMessage, isSystemAdmin = false) => {
    if (isSystemAdmin) {
      return (
        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0 ring-2 ring-blue-300 ring-offset-1">
          AD
        </div>
      );
    }

    if (msg.avatar) {
      if (msg.avatar.startsWith('data:image/') || msg.avatar.startsWith('http')) {
        return (
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm flex-shrink-0 border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={msg.avatar} alt={msg.name} className="w-full h-full object-cover" />
          </div>
        );
      }
      return (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm flex-shrink-0 bg-slate-50 border border-slate-200">
          {msg.avatar}
        </div>
      );
    }

    // Fallback to name initials
    const initials = msg.name ? msg.name.trim().substring(0, 2).toUpperCase() : 'AN';
    return (
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0 ${getAvatarColor(msg.name, false)}`}>
        {initials}
      </div>
    );
  };

  // Helper to compress uploaded file from device
  const compressAndSetAvatar = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 96;
        const MAX_HEIGHT = 96;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setUserAvatar(dataUrl);
          if (typeof window !== 'undefined') {
            localStorage.setItem('chat_user_avatar', dataUrl);
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-[85vh] sm:h-[90vh] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden" id="user-chat-container">
      {/* Chat Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0" id="chat-header">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-transparent rounded-lg flex items-center justify-center overflow-hidden relative">
            <Image 
              src="https://upload.wikimedia.org/wikipedia/commons/b/ba/City_of_Surabaya_Logo.svg" 
              alt="Logo Surabaya" 
              width={36}
              height={36}
              className="object-contain"
              referrerPolicy="no-referrer"
            />
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
                    {renderAvatar(msg, isSystemAdmin)}

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
          {/* Avatar & Name Input Wrapper */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Custom Avatar Selector Button */}
            <button
              type="button"
              onClick={() => setIsAvatarModalOpen(true)}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 active:scale-95 transition flex items-center justify-center cursor-pointer shadow-sm relative group"
              title="Ganti Avatar"
              id="avatar-picker-trigger"
            >
              {userAvatar ? (
                userAvatar.startsWith('data:image/') || userAvatar.startsWith('http') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userAvatar} alt="My Avatar" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <span className="text-xl leading-none">{userAvatar}</span>
                )
              ) : (
                <User className="w-4 h-4 text-slate-500 group-hover:text-slate-700 transition" />
              )}
              {/* Plus indicator */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 border border-white text-white text-[8px] font-black flex items-center justify-center shadow-sm">
                +
              </div>
            </button>

            {/* Name Input */}
            <div className="relative w-36 sm:w-40">
              <input
                type="text"
                placeholder="Nama Anda..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition font-medium text-slate-700"
                id="name-input"
              />
            </div>
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

      {/* Avatar Selection Modal */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs bg-slate-900/50"
            id="avatar-modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-150 flex flex-col"
              id="avatar-modal-content"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Ubah Avatar Anda</h2>
                    <p className="text-[10px] text-slate-400">Pilih dari templat atau unggah foto</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
                {/* Active Avatar Preview */}
                <div className="flex items-center space-x-4 p-3 bg-slate-50 rounded-xl border border-slate-150">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                    {userAvatar ? (
                      userAvatar.startsWith('data:image/') || userAvatar.startsWith('http') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={userAvatar} alt="Current Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl leading-none">{userAvatar}</span>
                      )
                    ) : (
                      <span className="text-xs font-bold text-slate-400">Default</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-700">Preview Avatar</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Ini adalah tampilan avatar Anda saat mengirim pesan.</p>
                    {userAvatar && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserAvatar('');
                          if (typeof window !== 'undefined') {
                            localStorage.removeItem('chat_user_avatar');
                          }
                        }}
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-700 underline mt-1.5 block cursor-pointer"
                      >
                        Hapus Avatar & Gunakan Inisial
                      </button>
                    )}
                  </div>
                </div>

                {/* Templates Section */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih dari Templat</p>
                  <div className="grid grid-cols-4 gap-3">
                    {TEMPLATE_AVATARS.map((tpl) => {
                      const isSelected = userAvatar === tpl.value;

                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => {
                            setUserAvatar(tpl.value);
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('chat_user_avatar', tpl.value);
                            }
                          }}
                          className={`h-12 rounded-xl flex items-center justify-center text-2xl transition cursor-pointer relative ${
                            isSelected
                              ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
                              : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          <span>{tpl.value}</span>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* File Upload Section */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unggah dari Device</p>
                  <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition hover:bg-slate-50/50 group">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) compressAndSetAvatar(file);
                      }}
                    />
                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition mb-1.5" />
                    <span className="text-xs font-bold text-slate-700">Pilih file gambar</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG atau WebP (akan dikompres otomatis)</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-100 transition cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
