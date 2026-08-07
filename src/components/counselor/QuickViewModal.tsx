"use client";

import React, { useState } from "react";
import { db } from "@/lib/firebase/config";
import { doc, deleteDoc } from "firebase/firestore";
import { UserProfile } from "@/types";
import { X, ChevronRight, ChevronLeft, Trash2, ExternalLink, ShieldCheck, PieChart, UserCheck, Edit3 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuickViewModal({ student, onClose }: { student: UserProfile, onClose: () => void }) {
  const router = useRouter();
  const [currentIndex, setCurrentIdx] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const stats = [
    { label: 'Academy Progress', val: `${student.learningProgress || 0}%`, icon: PieChart, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Mock Status', val: 'Pending', icon: UserCheck, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Assigned To', val: 'Counselor A', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  ];

  const handleNext = () => setCurrentIdx((prev) => (prev + 1) % stats.length);
  const handlePrev = () => setCurrentIdx((prev) => (prev - 1 + stats.length) % stats.length);

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteDoc(doc(db, "Users", student.uid));
    onClose();
    window.location.reload();
  };

  const StatIcon = stats[currentIndex].icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
       <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[40px] shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="p-8 border-b border-gray-50 dark:border-slate-700 flex justify-between items-start">
             <div className="space-y-1">
                <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter leading-none">{student.displayName}</h2>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{student.studentId || 'ID-PENDING'}</p>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all">
                <X size={24} className="text-gray-400" />
             </button>
          </div>

          <div className="p-8 relative">
             <div className="flex items-center justify-between absolute inset-x-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                <button onClick={handlePrev} className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-gray-100 dark:border-slate-700 pointer-events-auto hover:scale-110 transition-all"><ChevronLeft size={20} className="text-gray-400" /></button>
                <button onClick={handleNext} className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-gray-100 dark:border-slate-700 pointer-events-auto hover:scale-110 transition-all"><ChevronRight size={20} className="text-gray-400" /></button>
             </div>

             <div className="flex justify-center">
                <div className="w-full max-w-[280px] bg-gray-50 dark:bg-[#0F172A] p-10 rounded-[40px] border border-gray-100 dark:border-slate-800 flex flex-col items-center text-center space-y-4">
                   <div className={`w-16 h-16 rounded-[24px] ${stats[currentIndex].bg} flex items-center justify-center ${stats[currentIndex].color}`}>
                      <StatIcon size={32} />
                   </div>
                   <div className="space-y-1">
                      <p className="text-3xl font-black dark:text-white uppercase tracking-tighter leading-none">{stats[currentIndex].val}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stats[currentIndex].label}</p>
                   </div>
                </div>
             </div>

             <div className="flex justify-center gap-2 mt-6">
                {stats.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all ${i === currentIndex ? 'w-8 bg-blue-600' : 'w-2 bg-gray-200 dark:bg-slate-700'}`} />
                ))}
             </div>
          </div>

          <div className="px-8 pb-8 flex flex-wrap gap-2 justify-center">
             <span className="px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-widest">{student.office || 'London HQ'}</span>
             <span className="px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-widest">{student.role || 'Student'}</span>
             <span className="px-4 py-1.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-[10px] font-black uppercase tracking-widest">{student.readinessStatus || 'Gray'} Status</span>
          </div>

          <div className="p-8 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700 flex flex-wrap gap-4">
             <button onClick={() => router.push(`/counselor/students/${student.uid}`)} className="flex-1 min-w-[140px] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">View Profile <ExternalLink size={16} /></button>
             <button onClick={() => router.push(`/counselor/students/${student.uid}?edit=true`)} className="flex-1 min-w-[140px] py-4 bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">Edit Student <Edit3 size={16} /></button>
             <button onClick={handleDelete} className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2 ${confirmDelete ? 'bg-rose-600 text-white border-rose-600' : 'bg-white dark:bg-slate-800 text-rose-600 border-rose-100 dark:border-rose-900/30'}`}>{confirmDelete ? 'Confirm?' : <Trash2 size={18} />}</button>
          </div>
       </div>
    </div>
  );
}
