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
import { Skeleton } from "@/components/ui/skeleton";

const STRATEGIC_BRIEFINGS = [
  "You are on track for your CAS!",
  "Excellent progress on your modules.",
  "Keep it up to ensure a smooth visa process.",
  "Your preparation is looking solid.",
  "Let's review your requirements today."
];

const STAGE_CONTENT = [
  {
    id: 1,
    title: "Core Study Modules",
    subtitle: "Rules & Module 1 Briefings",
    tooltip: "Start with Module 1! UKVI officers verify your course and university knowledge. Complete each module's guide and pass the linked quiz with at least 80% to progress.",
    cta: "Start Module 1",
    reviewCta: "Review Vault",
    href: "/student/library",
    icon: BookOpen
  },
  {
    id: 2,
    title: "Student Interview Dossier",
    subtitle: "Tuition & Financial Profile",
    tooltip: "Record your specific academic and financial details, including tuition fees and sponsorship info. Ensures strict consistency during your official interview.",
    cta: "Complete Dossier",
    reviewCta: "Update Profile",
    href: "/student/interview-pack",
    icon: ShieldCheck
  },
  {
    id: 3,
    title: "Practice Mock Interview",
    subtitle: "Live AI & Counselor Session",
    tooltip: "Simulate an authentic UKVI interview experience. Tests your spoken English, response clarity, and confidence under timed pressure.",
    cta: "Start Practice",
    reviewCta: "View Performance",
    href: "/student/mock-interview",
    icon: Video
  },
  {
    id: 4,
    title: "Compliance CAS Verification",
    subtitle: "Counselor Endorsement",
    tooltip: "Your assigned Counselor reviews your mock recording and dossier answers. Once verified and approved, you are cleared for your CAS release!",
    cta: "Pending Review",
    reviewCta: "Check Status",
    href: "/student/feedback",
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
        <div className="max-w-5xl mx-auto space-y-16 pb-24 px-4">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8">
            <div className="space-y-3 w-full md:w-auto">
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex flex-col items-end gap-2 w-full md:w-auto">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-[32px]" />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-48 w-full rounded-3xl" />
            <Skeleton className="h-48 w-full rounded-3xl" />
          </div>
        </div>
      </AppShell>
    );
  }

  // Motion Stagger Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { type: "spring" as const, duration: 0.5, bounce: 0 }
    }
  };

  return (
    <AppShell>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-16 pb-24 px-4"
      >

        {/* ── Executive Header ────────────────────────── */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col md:flex-row items-end justify-between gap-8"
        >
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
        </motion.div>

        {/* ── Active Stage Continue Hero Card ────────────────────────── */}
        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900 p-8 sm:p-10 text-white shadow-2xl shadow-indigo-600/20">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-100 text-[10px] font-black uppercase tracking-widest border border-white/20">
                <Activity size={12} /> Active Mission • Stage {currentStage}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter font-google">
                Next Action: {(STAGE_CONTENT.find(s => s.id === currentStage) || STAGE_CONTENT[0]).title}
              </h2>
              <p className="text-xs text-indigo-100/80 font-medium max-w-xl">
                {(STAGE_CONTENT.find(s => s.id === currentStage) || STAGE_CONTENT[0]).subtitle} — Proceed directly to advance your CAS preparation.
              </p>
            </div>
            <motion.div whileTap={{ scale: 0.97 }} className="w-full md:w-auto shrink-0">
              <Link
                href={(STAGE_CONTENT.find(s => s.id === currentStage) || STAGE_CONTENT[0]).href}
                className="w-full md:w-auto px-8 py-4 bg-white text-indigo-700 hover:bg-slate-100 font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-all"
              >
                Continue Mission <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* ── Milestone Track ──────────────────── */}
        <motion.div variants={itemVariants} className="space-y-8 relative">
          <div className="flex items-center justify-between px-2">
             <div className="space-y-1">
                <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
                  <Activity size={14} className="text-indigo-500" />
                  My Progress
                </h2>
             </div>
             <div className="flex items-center gap-4 text-slate-500">
                <span className="text-[10px] font-bold uppercase tracking-widest">{currentStage} OF 4 COMPLETE</span>
                <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <motion.div
                     initial={{ width: 0 }}
                     animate={{ width: `${(currentStage / 4) * 100}%` }}
                     transition={{ type: "spring", duration: 0.8, bounce: 0 }}
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
                <motion.div
                  key={stage.id}
                  variants={itemVariants}
                  whileHover={!isLocked ? { y: -3 } : undefined}
                  transition={{ type: "spring", duration: 0.35, bounce: 0 }}
                  className={`relative group ${isLocked ? 'opacity-40 grayscale' : ''}`}
                >
                  <div className={`
                    relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-10 rounded-3xl border transition-all duration-300
                    ${isCurrent
                      ? 'bg-white/80 dark:bg-slate-900/40 backdrop-blur-md border-indigo-500/30 shadow-2xl shadow-indigo-500/5 ring-1 ring-indigo-500/20'
                      : isCompleted
                        ? 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-200/50 dark:border-slate-800/50'
                        : 'bg-white/30 dark:bg-slate-900/10 border-slate-100 dark:border-slate-900'}
                  `}>

                    <div className="flex items-center gap-8 w-full md:w-auto">
                       {/* Icon Indicator */}
                       <div className={`
                          w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300
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
                               type="button"
                               onClick={() => setActiveTooltip(stage.id)}
                               className="text-slate-300 hover:text-indigo-500 transition-colors p-1"
                               title="Stage Information"
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
                            <Lock size={14} /> Ready for next step
                         </div>
                       ) : (
                         <motion.div whileTap={{ scale: 0.97 }}>
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
                         </motion.div>
                       )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Stats Row ────────────────────────── */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white/50 dark:bg-slate-900/20 backdrop-blur-md p-10 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">Readiness Score</p>
                <div className="text-6xl font-light text-slate-900 dark:text-slate-50 tracking-tighter">
                  {stats.readiness}<span className="text-2xl text-slate-300">%</span>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Overall Study Score</span>
                <div className="flex gap-1">
                   {[...Array(10)].map((_, i) => (
                      <div key={i} className={`h-1.5 w-4 rounded-full ${i < stats.readiness/10 ? 'bg-indigo-500' : 'bg-slate-100 dark:bg-slate-800'}`} />
                   ))}
                </div>
              </div>
           </div>

           <div className="bg-slate-900 dark:bg-slate-900/40 backdrop-blur-md p-10 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between overflow-hidden relative">
              <div className="relative z-10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">Current Step: Modules</p>
                <div className="text-3xl font-medium text-white tracking-tight">
                   {stats.passedModulesCount < 5 ? `Step ${stats.passedModulesCount + 1}` : 'All Steps Done'}
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium uppercase tracking-widest">
                  Target: 5/5 Modules
                </p>
              </div>

              <div className="mt-8 relative z-10">
                 <div className="flex items-center gap-3">
                    {[1,2,3,4,5].map(i => (
                       <div key={i} className={`flex-1 h-2 rounded-full transition-all duration-700 ${i <= stats.passedModulesCount ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-slate-800'}`} />
                    ))}
                 </div>
              </div>

              {/* Decorative Blur Element */}
              <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
           </div>
        </motion.div>

      </motion.div>

      {/* ── Contextual Compliance Briefing Modal ─────────────── */}
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
               initial={{ opacity: 0, scale: 0.95, y: 10, filter: "blur(4px)" }}
               animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
               exit={{ opacity: 0, scale: 0.95, y: -10, filter: "blur(4px)" }}
               transition={{ type: "spring", duration: 0.4, bounce: 0 }}
               className="relative w-full max-w-lg bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-8"
             >
                <button
                  type="button"
                  onClick={() => setActiveTooltip(null)}
                  className="absolute top-8 right-8 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                   <X size={20} strokeWidth={1.5} />
                </button>

                <div className="space-y-6">
                   <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                      <FileText size={14} /> Information
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">
                         {STAGE_CONTENT.find(s => s.id === activeTooltip)?.title}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Step ID: 0{activeTooltip}</p>
                   </div>
                   <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {STAGE_CONTENT.find(s => s.id === activeTooltip)?.tooltip}
                   </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTooltip(null)}
                  className="w-full py-5 bg-slate-900 dark:bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-[0.3em] rounded-xl hover:bg-black dark:hover:bg-indigo-700 transition-all shadow-lg"
                >
                   Got it
                </motion.button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AppShell>
  );
}
