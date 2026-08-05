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

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white/50 dark:bg-slate-900/50 rounded-[40px] border-2 border-dashed border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-gray-50 dark:bg-[#0F172A] rounded-3xl flex items-center justify-center mb-6 shadow-inner">
        <Icon size={48} className="text-gray-300 dark:text-slate-600" />
      </div>

      <div className="space-y-2 max-w-sm">
        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">
          {title}
        </h3>
        <p className="text-sm font-bold text-gray-400 dark:text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-8 px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-full text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
