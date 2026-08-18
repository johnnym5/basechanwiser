"use client";

import React, { useState } from "react";
import { 
  X, 
  ExternalLink, 
  CalendarClock,
  TrendingUp, 
  ShieldCheck,
  User,
  ArrowRight,
  Clock,
  CheckCircle2,
  FileText,
  StickyNote
} from "lucide-react";
import { UserProfile } from "@/types";
import Link from "next/link";
import SetReminderModal from "./SetReminderModal";
import QuickNoteModal from "./QuickNoteModal";

interface QuickPortfolioModalProps {
  student: UserProfile;
  onClose: () => void;
}

export default function QuickPortfolioModal({ student, onClose }: QuickPortfolioModalProps) {
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  const statusColor = student.readinessStatus === "Green" ? "text-emerald-500" : student.readinessStatus === "Yellow" ? "text-amber-500" : student.readinessStatus === 'Orange' ? 'text-orange-600' : "text-rose-500";
  const statusBg = student.readinessStatus === "Green" ? "bg-emerald-50" : student.readinessStatus === "Yellow" ? "bg-amber-50" : student.readinessStatus === 'Orange' ? 'bg-orange-50' : "bg-rose-50";

  return (
    <>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#1E293B] w-full max-w-lg rounded-[40px] shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-in zoom-in duration-200">
          
          {/* Header */}
          <div className="p-8 border-b border-gray-50 dark:border-slate-800 flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-[#0F172A] flex items-center justify-center font-black text-2xl text-[#1a73e8] shadow-inner">
                {(student.displayName || "S").charAt(0)}
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">{student.displayName}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{student.studentId || "ID-PENDING"}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${statusBg} ${statusColor} border-current`}>● {student.readinessStatus || "Red"}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Body Stats */}
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-5 rounded-3xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black text-blue-500 uppercase">Learning Progress</p>
                    <TrendingUp className="w-3 h-3 text-blue-400" />
                  </div>
                  <p className="text-2xl font-black dark:text-white leading-none">{student.learningProgress || 0}%</p>
               </div>
               <div className="p-5 rounded-3xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black text-amber-500 uppercase">Interview Pack</p>
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                  </div>
                  <p className="text-lg font-black dark:text-white leading-none truncate">Not Started</p>
               </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#0F172A] rounded-2xl border border-gray-100 dark:border-slate-800">
               <Clock className="w-4 h-4 text-gray-400" />
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Last Activity</span>
                  <span className="text-xs font-bold dark:text-slate-300">
                    {student.lastLoginAt ? new Date(student.lastLoginAt.seconds * 1000).toLocaleString() : "Never"}
                  </span>
               </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-8 bg-gray-50/50 dark:bg-[#0F172A]/50 border-t border-gray-50 dark:border-slate-800 space-y-3">
             <div className="flex gap-4">
                <button
                   onClick={() => setReminderModalOpen(true)}
                   className="flex-1 py-4 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-slate-300 rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                   <CalendarClock className="w-4 h-4" /> Set Reminder
                </button>
                <button
                   onClick={() => setShowNoteModal(true)}
                   className="flex-1 py-4 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-slate-300 rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                   <StickyNote className="w-4 h-4" /> Quick Note
                </button>
             </div>
             <Link
                href={`/counselor/students/portfolio?id=${student.uid}`}
                className="block w-full py-4 bg-[#1a73e8] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#1557b0] shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
             >
                Full Portfolio <ArrowRight className="w-4 h-4" />
             </Link>
          </div>

        </div>
      </div>

      {reminderModalOpen && (
        <SetReminderModal
          student={{
            uid: student.uid,
            studentId: student.studentId,
            displayName: student.displayName
          }}
          onClose={() => setReminderModalOpen(false)}
          onSuccess={() => alert("Reminder set for student!")}
        />
      )}

      {showNoteModal && (
        <QuickNoteModal
          student={{
            uid: student.uid,
            displayName: student.displayName
          }}
          onClose={() => setShowNoteModal(false)}
          onSuccess={() => alert("Note preserved in timeline.")}
        />
      )}
    </>
  );
}
