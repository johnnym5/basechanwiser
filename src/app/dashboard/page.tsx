"use client";

import React, { useEffect, useState, useMemo } from "react";
import AppShell from "@/components/layout/app-shell";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import {
  BookOpen,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Star,
  HelpCircle,
  Video,
  X,
  ArrowRight,
  Activity,
  FileText,
  Check,
  ChevronRight
} from "lucide-react";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";
import { useStudentPipeline } from "@/hooks/useStudentPipeline";
import { motion, AnimatePresence } from "framer-motion";

const STRATEGIC_BRIEFINGS = [
  "Current trajectory aligns with target CAS issuance parameters.",
  "Operational compliance baseline established. Maintaining consistency.",
  "Strategic engagement is the primary driver of successful clearance.",
  "Internal readiness indicates a high probability of certification.",
  "UKVI regulatory alignment remains the priority for this session."
];

const STAGE_CONTENT = [
  {
    id: 1,
    title: "Knowledge Repository",
    subtitle: "Critical Compliance Documentation",
    tooltip: "Executive Briefing: UKVI Entry Clearance Officers evaluate candidate authenticity regarding institutional selection and financial viability. These modules establish the mandatory baseline required for regulatory compliance. A minimum assessment score of 80% is required for progression.",
    cta: "Access Repository",
    reviewCta: "Review Modules",
    href: "/student/library",
    icon: BookOpen
  },
  {
    id: 2,
    title: "Strategic Dossier",
    subtitle: "Candidate Credibility Portfolio",
    tooltip: "Requirement: The Defense Portfolio serves as the primary instrument for verifying applicant intent. Candidates must document precise financial details, sponsorship parameters, and long-term strategic objectives to ensure absolute consistency during formal Home Office inquiries.",
    cta: "Generate Dossier",
    reviewCta: "Update Records",
    href: "/student/interview-pack",
    icon: ShieldCheck
  },
  {
    id: 3,
    title: "Operational Readiness",
    subtitle: "High-Fidelity Simulation Protocol",
    tooltip: "Objective: Technical knowledge must be complemented by professional delivery. This high-fidelity simulation evaluates linguistic proficiency, situational awareness, and response integrity under stress conditions typical of official UKVI assessments.",
    cta: "Commence Assessment",
    reviewCta: "Analysis Report",
    href: "/student/mock-interview",
    icon: Video
  },
  {
    id: 4,
    title: "Final Certification",
    subtitle: "Executive Verification & CAS Clearance",
    tooltip: "Status: Senior Counsel review is currently underway. Final validation confirms eligibility for CAS issuance. In the event of identified risk factors, a corrective feedback cycle will be initiated prior to certification.",
    cta: "Pending Validation",
    reviewCta: "View Status",
    href: "/student/mock-interview",
    icon: Star
  }
];

export default function StudentDashboardPage() {
  const { user, userId } = useAuth();
  const { data: stats, loading: statsLoading } = useStudentDashboard(userId);
  const { currentStage, stages, loading: pipelineLoading } = useStudentPipeline(userId);

  const [showConfetti, setShowConfetti] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  useEffect(() => {
    const lastScore = sessionStorage.getItem("last_quiz_score");
    if (lastScore && parseInt(lastScore) >= 80) {
      setShowConfetti(true);
      sessionStorage.removeItem("last_quiz_score");
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = user?.displayName?.split(" ")[0] || "Candidate";
    if (hour < 12) return `Good Morning, ${name}`;
    if (hour < 18) return `Good Afternoon, ${name}`;
    return `Good Evening, ${name}`;
  }, [user]);

  const briefing = useMemo(() => {
    return STRATEGIC_BRIEFINGS[Math.floor(Math.random() * STRATEGIC_BRIEFINGS.length)];
  }, []);

  if (statsLoading || pipelineLoading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center p-24 gap-6">
           <div className="w-12 h-12 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
           <p className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.3em]">Initializing Dashboard Environment...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-16 pb-24 px-4">

        {/* ── Professional Executive Header ────────────────────────── */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-8 animate-in fade-in slide-in-from-top-4 duration-1000">
           <div className="space-y-3 text-left w-full md:w-auto">
              <h1 className="text-4xl md:text-5xl font-light text-slate-900 dark:text-slate-50 tracking-tight leading-none font-sans">
                {greeting}
              </h1>
              <div className="flex items-center gap-3">
                 <div className="h-[1px] w-8 bg-indigo-500/50" />
                 <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-[0.15em] uppercase">
                   {briefing}
                 </p>
              </div>
           </div>

           <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Journey Status</span>
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white shadow-xl shadow-indigo-500/10 border border-slate-700 dark:border-slate-700">
                 <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                 </div>
                 <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Phase {currentStage} Active</span>
              </div>
           </div>
        </div>

        {/* ── Sophisticated Milestone Track ──────────────────── */}
        <div className="space-y-8 relative">
          <div className="flex items-center justify-between px-2">
             <div className="space-y-1">
                <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
                  <Activity size={14} className="text-indigo-500" />
                  Compliance Pipeline
                </h2>
             </div>
             <div className="flex items-center gap-4 text-slate-500">
                <span className="text-[10px] font-bold uppercase tracking-widest">{currentStage} OF 4 COMPLETE</span>
                <div className="w-24 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <motion.div
                     initial={{ width: 0 }}
                     animate={{ width: `${(currentStage / 4) * 100}%` }}
                     className="h-full bg-indigo-500"
                   />
                </div>
             </div>
          </div>

          <div className="relative grid grid-cols-1 gap-6">
            {/* The Vertical Glowing Timeline Connector */}
            <div className="absolute left-[39px] top-10 bottom-10 w-[2px] bg-slate-100 dark:bg-slate-800 hidden md:block" />

            {STAGE_CONTENT.map((stage, idx) => {
              const pipelineStage = stages[idx];
              const isLocked = !pipelineStage.isUnlocked;
              const isCurrent = pipelineStage.status === 'current';
              const isCompleted = pipelineStage.isCompleted;
              const Icon = stage.icon;

              return (
                <div
                  key={stage.id}
                  className={`relative group transition-all duration-700 ${isLocked ? 'opacity-40 grayscale' : ''}`}
                >
                  <div className={`
                    relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-10 rounded-3xl border transition-all duration-500
                    ${isCurrent
                      ? 'bg-white/80 dark:bg-slate-900/40 backdrop-blur-md border-indigo-500/30 shadow-2xl shadow-indigo-500/5 ring-1 ring-indigo-500/20'
                      : isCompleted
                        ? 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-200/50 dark:border-slate-800/50'
                        : 'bg-white/30 dark:bg-slate-900/10 border-slate-100 dark:border-slate-900'}
                  `}>

                    <div className="flex items-center gap-8 w-full md:w-auto">
                       {/* Elegant Icon Indicator */}
                       <div className={`
                          w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500
                          ${isCompleted
                            ? 'bg-white dark:bg-slate-800 border-emerald-500/30 text-emerald-600 shadow-lg shadow-emerald-500/5'
                            : isCurrent
                              ? 'bg-indigo-600 border-indigo-400 text-white shadow-2xl shadow-indigo-600/30 scale-105'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300'}
                       `}>
                          {isCompleted ? <Check strokeWidth={1.5} className="w-10 h-10" /> :
                           isLocked ? <Lock strokeWidth={1.5} className="w-7 h-7" /> :
                           <Icon strokeWidth={1.5} className="w-10 h-10" />}
                       </div>

                       <div className="space-y-2">
                          <div className="flex items-center gap-3">
                             <h3 className={`text-2xl font-medium tracking-tight ${isLocked ? 'text-slate-400' : 'text-slate-900 dark:text-slate-50'}`}>
                                {stage.title}
                             </h3>
                             <button
                               onClick={() => setActiveTooltip(stage.id)}
                               className="text-slate-300 hover:text-indigo-500 transition-colors"
                             >
                                <HelpCircle size={18} strokeWidth={1.5} />
                             </button>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{stage.subtitle}</p>
                       </div>
                    </div>

                    <div className="w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                       {isLocked ? (
                         <div className="flex items-center justify-center gap-2 px-8 py-3 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                            <Lock size={14} /> Authorization Required
                         </div>
                       ) : (
                         <Link
                           href={stage.href}
                           className={`
                             group/btn px-10 py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-4
                             ${isCompleted
                               ? 'bg-slate-900 dark:bg-slate-800 text-white hover:bg-black dark:hover:bg-slate-700'
                               : isCurrent
                                 ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/20'
                                 : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}
                           `}
                         >
                            {isCompleted ? stage.reviewCta : stage.cta}
                            <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                         </Link>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Mission Critical Stats (Refined) ────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white/50 dark:bg-slate-900/20 backdrop-blur-md p-10 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">Performance Metric: Readiness</p>
                <div className="text-6xl font-light text-slate-900 dark:text-slate-50 tracking-tighter">
                  {stats.readiness}<span className="text-2xl text-slate-300">%</span>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Aggregate Assessment Score</span>
                <div className="flex gap-1">
                   {[...Array(10)].map((_, i) => (
                      <div key={i} className={`h-1.5 w-4 rounded-full ${i < stats.readiness/10 ? 'bg-indigo-500' : 'bg-slate-100 dark:bg-slate-800'}`} />
                   ))}
                </div>
              </div>
           </div>

           <div className="bg-slate-900 dark:bg-slate-900/40 backdrop-blur-md p-10 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between overflow-hidden relative">
              <div className="relative z-10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">Verification Stage: Modules</p>
                <div className="text-3xl font-medium text-white tracking-tight">
                   {stats.passedModulesCount < 5 ? `Phase ${stats.passedModulesCount + 1}` : 'All Phases Complete'}
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium uppercase tracking-widest">
                  Requirement: 5/5 Mandatory Modules
                </p>
              </div>

              <div className="mt-8 relative z-10">
                 <div className="flex items-center gap-3">
                    {[1,2,3,4,5].map(i => (
                       <div key={i} className={`flex-1 h-2 rounded-full transition-all duration-700 ${i <= stats.passedModulesCount ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-slate-800'}`} />
                    ))}
                 </div>
              </div>

              {/* Decorative Element */}
              <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
           </div>
        </div>

      </div>

      {/* ── Contextual Compliance Briefing (Glassmorphism) ─────────────── */}
      <AnimatePresence>
        {activeTooltip && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setActiveTooltip(null)}
               className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
             />
             <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               className="relative w-full max-w-lg bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-8"
             >
                <button
                  onClick={() => setActiveTooltip(null)}
                  className="absolute top-8 right-8 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                   <X size={20} strokeWidth={1.5} />
                </button>

                <div className="space-y-6">
                   <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                      <FileText size={14} /> Regulatory Briefing
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">
                         {STAGE_CONTENT.find(s => s.id === activeTooltip)?.title}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol ID: STG-0{activeTooltip}</p>
                   </div>
                   <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {STAGE_CONTENT.find(s => s.id === activeTooltip)?.tooltip}
                   </p>
                </div>

                <button
                  onClick={() => setActiveTooltip(null)}
                  className="w-full py-5 bg-slate-900 dark:bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-[0.3em] rounded-xl hover:bg-black dark:hover:bg-indigo-700 transition-all shadow-lg"
                >
                   Acknowledge Receipt
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AppShell>
  );
}
