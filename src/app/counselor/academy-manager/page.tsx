"use client";

import React, { useState } from "react";
import AppShell from "@/components/layout/app-shell";
import {
  MessageSquare,
  FileCheck,
  LayoutGrid,
  RotateCcw,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  X
} from "lucide-react";
import MockConfigEditor from "@/components/mock-interview/MockConfigEditor";
import TestConfigEditor from "@/components/academy/TestConfigEditor";
import { motion, AnimatePresence } from "framer-motion";
import { runSystemRecovery } from "@/lib/client/seed-utils";

type TabType = 'mock' | 'test';

export default function AcademyManagerPage() {
  const [activeTab, setActiveTab] = useState<TabType>('mock');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const result = await runSystemRecovery();

      if (result.success) {
        setToast({ message: result.message, type: 'success' });
        setShowRestoreModal(false);
        // Refresh to show restored data
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setToast({ message: result.message, type: 'error' });
      }
    } catch (e) {
      setToast({ message: "Recovery failed", type: 'error' });
    } finally {
      setIsRestoring(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8 pb-32">
        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className={`fixed top-24 right-10 z-[300] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 font-bold text-xs uppercase tracking-widest ${
                toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-1 border-l-4 border-[#1a73e8] pl-6 py-2">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3 font-google uppercase tracking-tighter">
              <LayoutGrid className="w-8 h-8 text-[#1a73e8]" /> Academy Manager
            </h1>
            <p className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest leading-none">
              Control Center for Curriculum & Compliance Excellence
            </p>
          </div>

          <button
            onClick={() => setShowRestoreModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-slate-800 text-gray-500 hover:text-blue-600 border border-gray-100 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest shadow-sm transition-all active:scale-95"
          >
            <RotateCcw size={16} /> Restore Core Modules
          </button>
        </div>

        {/* Tabbed Interface */}
        <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="flex border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 overflow-x-auto scrollbar-hide">
            <Tab
              label="Mock Interviews"
              icon={MessageSquare}
              active={activeTab === 'mock'}
              onClick={() => setActiveTab('mock')}
            />
            <Tab
              label="Learning Tests"
              icon={FileCheck}
              active={activeTab === 'test'}
              onClick={() => setActiveTab('test')}
            />
          </div>

          <div className="p-4 sm:p-8">
            {activeTab === 'mock' ? <MockConfigEditor /> : <TestConfigEditor />}
          </div>
        </div>

        {/* ── RESTORE CONFIRMATION MODAL ── */}
        <AnimatePresence>
          {showRestoreModal && (
            <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
               <motion.div
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.9, opacity: 0 }}
                 className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[40px] p-10 shadow-2xl border border-gray-100 dark:border-slate-700 text-center space-y-8"
               >
                  <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto text-amber-500">
                     <AlertTriangle size={40} />
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter">System Recovery</h3>
                     <p className="text-sm font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                        Are you sure? This will scan the database and recreate any missing Core UKVI Modules (1-5). Existing custom sets will not be affected.
                     </p>
                  </div>
                  <div className="flex gap-4">
                     <button
                       onClick={() => setShowRestoreModal(false)}
                       className="flex-1 py-4 text-xs font-black uppercase text-gray-400 hover:text-gray-900 transition-all"
                     >
                        Cancel
                     </button>
                     <button
                       onClick={handleRestore}
                       disabled={isRestoring}
                       className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
                     >
                        {isRestoring ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Recovery'}
                     </button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function Tab({ label, icon: Icon, active, onClick }: { label: string, icon: any, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 sm:gap-3 px-6 sm:px-10 py-4 sm:py-6 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all relative ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white'}`}
    >
       <Icon size={18} className="sm:w-5 sm:h-5" />
       <span className="whitespace-nowrap">{label}</span>
       {active && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full animate-in fade-in duration-300" />}
    </button>
  );
}
