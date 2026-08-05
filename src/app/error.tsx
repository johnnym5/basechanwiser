"use client";

import React, { useEffect } from "react";
import { ServerCrash, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#1E293B] rounded-[40px] p-10 border border-slate-800 shadow-2xl text-center space-y-8 animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
          <ServerCrash className="w-10 h-10 text-rose-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Something went wrong</h1>
          <p className="text-slate-400 text-sm font-bold leading-relaxed">
            Don't worry, we've logged the error. The system might be having a quick breather.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 w-full py-4 bg-white text-gray-900 font-black rounded-full text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-4 bg-slate-800 text-slate-300 font-black rounded-full text-xs uppercase tracking-widest border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <Home className="w-4 h-4" /> Return Home
          </Link>
        </div>

        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          Error ID: {error.digest || "Internal Runtime Error"}
        </p>
      </div>
    </div>
  );
}
