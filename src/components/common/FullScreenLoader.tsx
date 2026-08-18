"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCcw } from 'lucide-react';

export default function FullScreenLoader() {
  const [showRetry, setShowShowRetry] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowShowRetry(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0F172A] text-slate-200 p-6 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4"/>
      <div className="space-y-2">
        <p className="text-lg font-black uppercase tracking-tighter animate-pulse">Synchronizing Workspace</p>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Establishing secure uplink to mission control...</p>
      </div>

      {showRetry && (
        <div className="mt-12 animate-in fade-in zoom-in duration-500 space-y-4">
           <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">Network delay detected</p>
           <button
             onClick={() => window.location.reload()}
             className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
           >
             <RefreshCcw size={14} /> Force Refresh
           </button>
        </div>
      )}
    </div>
  );
}
