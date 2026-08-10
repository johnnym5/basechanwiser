"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

/**
 * EmptyState: Reusable UI component for empty data fallbacks.
 * Adheres to high-density dark-mode aesthetic with dashed borders.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-800/10 dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-700 animate-in fade-in zoom-in duration-500">
      <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-gray-100 dark:border-slate-800">
        <Icon size={32} className="text-slate-400 dark:text-slate-500" />
      </div>

      <div className="space-y-2 max-w-sm">
        <h3 className="text-lg font-black text-gray-900 dark:text-slate-300 uppercase tracking-tighter">
          {title}
        </h3>
        <p className="text-xs font-bold text-gray-400 dark:text-slate-500 leading-relaxed uppercase tracking-wider">
          {description}
        </p>
      </div>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-8 px-8 py-3 bg-blue-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
