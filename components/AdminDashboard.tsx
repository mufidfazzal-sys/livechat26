'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, AlertTriangle, ShieldCheck, Search, Send, ArrowLeft, RefreshCw, Layers, Lock } from 'lucide-react';

interface ChatMessage {
  id: string;
  name: string;
  message: string;
  timestamp: string;
  isAdmin?: boolean;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('admin_authenticated') === 'true';
    }
    return false;
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'surabaya2026') {
      setIsAuthenticated(true);
      setLoginError('');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('admin_authenticated', 'true');
      }
    } else {
      setLoginError('Password salah, silakan coba lagi.');
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isAdminSending, setIsAdminSending] = useState(false);
  const [adminName, setAdminName] = useState('Admin');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const adminChatEndRef = useRef<HTMLDivElement>(null);
  const adminChatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  const fetchMessages = async (silent = false) => {
    try {
      if (!silent) setIsRefreshing(true);
      const res = await fetch('/api/chat');
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        setError(null);
      } else {
        setError(data.error || 'Gagal memuat pesan admin');
      }
    } catch (err) {
      console.error('Error fetching admin messages:', err);
      setError('Masalah jaringan. Gagal sinkronisasi data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Poll messages every 2 seconds
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

  // Delete message
  const handleDeleteMessage = async (id: string) => {
    try {
      const res = await fetch(`/api/chat?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.filter((msg) => msg.id !== id));
      } else {
        alert(data.error || 'Gagal menghapus pesan');
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      alert('Gagal menghapus pesan karena kendala koneksi.');
    }
  };

  // Clear all messages
  const handleClearAll = async () => {
    try {
      const res = await fetch('/api/chat?clearAll=true', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMessages([]);
        setShowClearConfirm(false);
      } else {
        alert(data.error || 'Gagal membersihkan percakapan');
      }
    } catch (err) {
      console.error('Error clearing messages:', err);
      alert('Gagal membersihkan percakapan karena kendala koneksi.');
    }
  };

  // Handle Admin Message / Reply
  const handleAdminSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsAdminSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: adminName.trim() || 'Admin',
          message: replyText,
          isAdmin: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReplyText('');
        setMessages((prev) => [...prev, data.message]);
        setTimeout(() => {
          adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      } else {
        alert(data.error || 'Gagal mengirim balasan admin');
      }
    } catch (err) {
      console.error('Error sending admin reply:', err);
      alert('Gagal mengirim balasan admin karena kendala koneksi.');
    } finally {
      setIsAdminSending(false);
    }
  };

  // Filter messages based on search query
  const filteredMessages = messages.filter((msg) => {
    const term = searchQuery.toLowerCase();
    return (
      msg.name.toLowerCase().includes(term) ||
      msg.message.toLowerCase().includes(term)
    );
  });

  // Format timestamp
  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      return `${dateStr}, ${timeStr}`;
    } catch {
      return '';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col justify-center items-center py-12 px-4" id="admin-login-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-3 shadow-sm ring-4 ring-blue-500/10">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Login Panel Admin</h2>
            <p className="text-xs text-slate-400 mt-1">Gunakan password administrator untuk melanjutkan</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Password Admin
              </label>
              <input
                type="password"
                placeholder="Masukkan password..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition text-slate-800 font-medium"
                id="admin-password-input"
                autoFocus
              />
            </div>

            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-rose-50 text-rose-600 text-xs font-semibold rounded-lg border border-rose-100 flex items-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </motion.div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-100 transition cursor-pointer flex items-center justify-center space-x-2"
              id="admin-login-submit"
            >
              <span>Masuk Panel</span>
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[85vh] sm:h-[90vh] bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-800 overflow-hidden" id="admin-dashboard-container">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 gap-3" id="admin-header">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-lg text-slate-800 tracking-tight">
                Admin Dashboard
              </h1>
              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded uppercase">Live</span>
            </div>
            <p className="text-xs text-blue-600 font-mono mt-0.5">domain.com/#/admin</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 self-start sm:self-center">
          <button
            onClick={() => fetchMessages()}
            className="p-1.5 text-xs bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-slate-600 active:scale-95 transition cursor-pointer shadow-sm"
            title="Refresh manual"
            id="refresh-btn"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Admin Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 bg-slate-50/50 border-b border-slate-200 text-xs text-slate-500 px-6 py-3 gap-4" id="admin-metrics">
        <div>
          Total Komentar: <span className="font-mono text-slate-800 font-bold">{messages.length}</span>
        </div>
        <div>
          Hasil Filter: <span className="font-mono text-slate-800 font-bold">{filteredMessages.length}</span>
        </div>
        <div className="col-span-2 sm:col-span-1 flex items-center justify-end sm:justify-start">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-green-500 animate-pulse"></span>
            Server Active
          </span>
        </div>
      </div>

      {/* Filter and Clear Box */}
      <div className="p-4 bg-slate-50/30 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center" id="admin-tools">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <span className="absolute left-3.5 top-2.5 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Cari nama pengirim atau isi komentar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-850 transition"
            id="admin-search"
          />
        </div>

        {/* Clear All Button */}
        <div className="flex-shrink-0 w-full sm:w-auto">
          {showClearConfirm ? (
            <div className="flex items-center space-x-2" id="clear-confirm-block">
              <span className="text-xs text-amber-600 flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Yakin hapus semua?
              </span>
              <button
                onClick={handleClearAll}
                className="px-2.5 py-1 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer transition shadow-sm"
                id="confirm-clear-btn"
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-2.5 py-1 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer transition"
                id="cancel-clear-btn"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={messages.length === 0}
              className={`w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition ${
                messages.length > 0
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer shadow-sm'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
              id="clear-all-btn"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Obrolan</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200" ref={adminChatContainerRef} id="admin-messages-feed">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3" id="admin-loading">
            <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            <p className="text-xs text-slate-500 font-medium">Sinkronisasi komentar...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3 text-slate-400" id="admin-empty">
            <Layers className="w-8 h-8 opacity-40" />
            <div>
              <p className="text-sm font-bold text-slate-700">Tidak ada pesan yang cocok</p>
              <p className="text-xs opacity-80 mt-1">Mungkin belum ada obrolan masuk atau coba ubah kata kunci pencarian Anda.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3" id="admin-messages-list">
            <AnimatePresence initial={false}>
              {filteredMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-start justify-between p-4 rounded-xl border transition ${
                    msg.isAdmin
                      ? 'bg-blue-50/40 border-blue-100 border-l-4 border-l-blue-500 hover:bg-blue-50/60'
                      : 'bg-white border-slate-100 hover:bg-slate-50/80 shadow-sm'
                  }`}
                >
                  <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0 ${
                      msg.isAdmin ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {msg.isAdmin ? 'AD' : msg.name.substring(0, 2).toUpperCase()}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-800">{msg.name}</span>
                        {msg.isAdmin && (
                          <span className="px-1.5 py-0.5 text-[9px] font-black text-white bg-blue-600 rounded uppercase tracking-wider">
                            Admin
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDateTime(msg.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-650 mt-1.5 whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition active:scale-90 cursor-pointer flex-shrink-0 ml-4"
                    title="Hapus komentar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={adminChatEndRef} />
          </div>
        )}
      </div>

      {/* Admin Reply Form */}
      <form onSubmit={handleAdminSend} className="p-4 bg-slate-50/80 border-t border-slate-200 space-y-3" id="admin-reply-form">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          {/* Admin Identity Label */}
          <div className="relative flex-shrink-0 sm:w-44">
            <span className="absolute left-3.5 top-2.5 text-blue-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Nama Admin..."
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              maxLength={20}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold transition"
              id="admin-name-input"
            />
          </div>

          {/* Admin message area */}
          <div className="flex-1 flex space-x-2">
            <input
              type="text"
              placeholder="Kirim tanggapan resmi Admin ke obrolan publik..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={isAdminSending}
              maxLength={500}
              className="flex-1 px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 transition"
              id="admin-reply-input"
            />
            
            <button
              type="submit"
              disabled={isAdminSending || !replyText.trim()}
              className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center justify-center space-x-1.5 transition ${
                replyText.trim()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95 cursor-pointer shadow-lg shadow-blue-100'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              id="admin-reply-send"
            >
              {isAdminSending ? (
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
          <span>* Tanggapan Anda akan ditandai dengan lencana resmi berwarna biru di obrolan publik.</span>
          <span>{replyText.length}/500</span>
        </div>
      </form>
    </div>
  );
}
