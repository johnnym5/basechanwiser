"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Counselor Students Error Boundary:
 * Catches unhandled errors or data fetching timeouts on /counselor/students.
 * Displays a user-friendly error card with a primary "Refresh / Retry" button calling reset().
 */
export default function CounselorStudentsError({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log the error for diagnostic tracking
    console.error("[CounselorStudents Error Boundary Caught]:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-800 border border-rose-100 dark:border-rose-900/30 rounded-[40px] p-10 max-w-lg w-full shadow-2xl text-center space-y-6 animate-in zoom-in duration-300">
        {/* Error Icon Header */}
        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800/40">
          <AlertCircle size={40} />
        </div>

        {/* User-facing error message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
            Unable to load workspace
          </h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm font-bold leading-relaxed max-w-sm mx-auto">
            Unable to load workspace. Please check your connection and try again.
          </p>
          {error?.message && (
            <p className="text-[10px] font-mono text-rose-500 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200/50 dark:border-rose-900/30 mt-3 overflow-hidden text-ellipsis">
              {error.message}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} /> Refresh / Retry
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-4 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 font-black rounded-2xl text-xs uppercase tracking-widest transition-all hover:bg-gray-200 dark:hover:bg-slate-600 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
