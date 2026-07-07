'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import UserChat from '../components/UserChat';
import AdminDashboard from '../components/AdminDashboard';
import { Shield, MessageSquare, ArrowRight, ExternalLink } from 'lucide-react';

type ViewType = 'chat' | 'admin';

export default function Home() {
  const [view, setView] = useState<ViewType>('chat');
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash === '#/admin' || hash === '#admin' || hash.includes('admin')) {
        setView('admin');
      } else {
        setView('chat');
      }
    };

    // Initial check and state mounting inside timeout to avoid synchronous cascading renders
    const t = setTimeout(() => {
      setHasMounted(true);
      checkHash();
    }, 0);

    // Listen to hash changes
    window.addEventListener('hashchange', checkHash);
    return () => {
      clearTimeout(t);
      window.removeEventListener('hashchange', checkHash);
    };
  }, []);

  // Quick navigation helpers that update hash
  const navigateToAdmin = () => {
    window.location.hash = '#/admin';
  };

  const navigateToChat = () => {
    window.location.hash = '';
  };

  if (!hasMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 bg-slate-50 relative overflow-hidden" id="main-viewport">
      {/* Decorative ambient background accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-100/20 rounded-full blur-3xl -z-10" />

      {/* Main container wrapper */}
      <div className="w-full max-w-5xl flex-1 flex items-center justify-center" id="panel-viewport-wrapper">
        <AnimatePresence mode="wait">
          {view === 'chat' ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full flex justify-center"
            >
              <UserChat />
            </motion.div>
          ) : (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full flex justify-center"
            >
              <AdminDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Humble Footer with credentials */}
      <footer className="w-full max-w-2xl mt-6 flex items-center justify-center gap-3 text-xs text-slate-400 border-t border-slate-200/60 pt-4" id="app-footer">
        <div className="flex items-center space-x-1.5">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-slate-650">LiveConnect Portal</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-400">Tanpa Login & Real-time</span>
        </div>
      </footer>
    </main>
  );
}
