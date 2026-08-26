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
  Sparkles,
  Star,
  Flame,
  Trophy,
  HelpCircle,
  Video,
  X,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import ReactConfetti from "react-confetti";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";
import { useStudentPipeline } from "@/hooks/useStudentPipeline";
import { motion, AnimatePresence } from "framer-motion";

const MOTIVATIONAL_PHRASES = [
  "You're 1 step closer to your UK university journey! 🇬🇧",
  "Let's crush today's compliance drill! 🚀",
  "Consistency is the key to a successful CAS application! 💎",
  "Keep going! Your future self will thank you. ✨",
  "Mastering UKVI rules today makes the interview easy tomorrow! 📚"
];

const STAGE_CONTENT = [
  {
    id: 1,
    title: "RESOURCES",
    subtitle: "Study Materials & Mission Briefings",
    tooltip: "Why do I need this? UKVI Entry Clearance Officers will test your authentic knowledge of your course, university, and financial rules. These 5 modules contain the mandatory baseline knowledge required to pass your visa interview. You must score 80% on all of them to prove you are ready.",
    cta: "Review Resources",
    reviewCta: "Library Hub",
    href: "/student/library",
    icon: BookOpen
  },
  {
    id: 2,
    title: "The Defense Portfolio",
    subtitle: "Your Personalized Interview Pack",
    tooltip: "Why do I need this? Your Defense Portfolio is your personalized cheat sheet. It forces you to write down your exact tuition fees, sponsor details, and career goals so you don't freeze or give inconsistent answers during the real Home Office interview.",
    cta: "Build Interview Pack",
    reviewCta: "Edit Portfolio",
    href: "/student/interview-pack",
    icon: ShieldCheck
  },
  {
    id: 3,
    title: "The Live Simulation",
    subtitle: "High-Stress AI Mock Interview",
    tooltip: "Why do I need this? Knowing the answers is only half the battle; delivering them confidently under pressure is the rest. The AI (and your Counselor) will simulate a real, high-stress UKVI interview to test your spoken English, body language, and response time.",
    cta: "Initialize Mock Interview",
    reviewCta: "Review Feedback",
    href: "/student/mock-interview",
    icon: Video
  },
  {
    id: 4,
    title: "Clearance & Counselor Review",
    subtitle: "Final Validation for CAS Issuance",
    tooltip: "What happens now? Your Senior Counselor is reviewing your simulation. If you pass, you will be cleared for CAS issuance. If red flags are detected, you will receive feedback and must retry the simulation.",
    cta: "Awaiting Clearance",
    reviewCta: "Check Status",
    href: "/student/mock-interview", // Where they see feedback
    icon: Star
  }
];

export default function StudentDashboardPage() {
  const { user, userId } = useAuth();
  const { data: stats, loading: statsLoading } = useStudentDashboard(userId);
  const { currentStage, stages, loading: pipelineLoading, stats: pipelineStats } = useStudentPipeline(userId);

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
    const name = user?.displayName?.split(" ")[0] || "Student";
    if (hour < 12) return `Good Morning, ${name} 🌅`;
    if (hour < 18) return `Good Afternoon, ${name} ☀️`;
    return `Good Evening, ${name} 🌙`;
  }, [user]);

  const motivationalQuote = useMemo(() => {
    return MOTIVATIONAL_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)];
  }, []);

  if (statsLoading || pipelineLoading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center p-20 gap-4">
           <Sparkles className="w-12 h-12 text-[#1a73e8] animate-spin" />
           <p className="text-sm font-black uppercase text-gray-500 tracking-widest">Hydrating Dashboard...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {showConfetti && <ReactConfetti width={window?.innerWidth} height={window?.innerHeight} recycle={false} />}

      <div className="max-w-4xl mx-auto space-y-12 pb-20">

        {/* ── Minimalist Gamified Header ────────────────────────── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="space-y-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter font-google">{greeting}</h1>
              <p className="text-sm font-bold text-gray-500 dark:text-blue-400 italic">"{motivationalQuote}"</p>
           </div>

           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 border border-orange-100 dark:border-orange-800 shadow-sm">
                 <Flame className="w-4 h-4 fill-current" />
                 <span className="text-xs font-black">{stats.streak} DAYS</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 border border-purple-100 dark:border-purple-800 shadow-sm">
                 <Trophy className="w-4 h-4" />
                 <span className="text-xs font-black">{stats.points.toLocaleString()} PTS</span>
              </div>
           </div>
        </div>

        {/* ── Strict Linear Pipeline (Roadmap) ──────────────────── */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
             <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">UKVI Compliance Pipeline</h2>
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-500">STAGE {currentStage} / 4</span>
                <div className="w-32 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <motion.div
                     initial={{ width: 0 }}
                     animate={{ width: `${(currentStage / 4) * 100}%` }}
                     className="h-full bg-blue-600"
                   />
                </div>
             </div>
          </div>

          <div className="space-y-4">
            {STAGE_CONTENT.map((stage, idx) => {
              const pipelineStage = stages[idx];
              const isLocked = !pipelineStage.isUnlocked;
              const isCurrent = pipelineStage.status === 'current';
              const isCompleted = pipelineStage.isCompleted;
              const Icon = stage.icon;

              return (
                <div
                  key={stage.id}
                  className={`relative group transition-all duration-500 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className={`
                    relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 p-8 rounded-[32px] border-2 transition-all
                    ${isCurrent ? 'bg-white dark:bg-[#1E293B] border-blue-500 shadow-2xl shadow-blue-500/10 ring-2 ring-blue-500/20' :
                      isCompleted ? 'bg-white dark:bg-[#1E293B] border-emerald-100 dark:border-emerald-900/30' :
                      'bg-gray-50/50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-800'}
                  `}>

                    <div className="flex items-center gap-6 w-full sm:w-auto">
                       <div className={`
                          w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border-2
                          ${isCompleted ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 text-emerald-600' :
                            isCurrent ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-500/30' :
                            'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400'}
                       `}>
                          {isCompleted ? <CheckCircle2 className="w-8 h-8" /> :
                           isLocked ? <Lock className="w-6 h-6" /> :
                           <Icon className="w-8 h-8" />}
                       </div>

                       <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <h3 className={`text-xl font-black tracking-tighter ${isLocked ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                {stage.title}
                             </h3>
                             <button
                               onClick={() => setActiveTooltip(stage.id)}
                               className="text-gray-400 hover:text-blue-500 transition-colors"
                             >
                                <HelpCircle size={18} />
                             </button>
                          </div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stage.subtitle}</p>
                       </div>
                    </div>

                    <div className="w-full sm:w-auto">
                       {isLocked ? (
                         <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                            <Lock size={14} /> Stage Locked
                         </div>
                       ) : (
                         <Link
                           href={stage.href}
                           className={`
                             group/btn px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3
                             ${isCompleted ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' :
                               isCurrent ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-600/20' :
                               'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'}
                           `}
                         >
                            {isCompleted ? stage.reviewCta : stage.cta}
                            <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                         </Link>
                       )}
                    </div>
                  </div>

                  {/* Connecting Line (except for last) */}
                  {idx < STAGE_CONTENT.length - 1 && (
                    <div className="absolute left-[2.5rem] bottom-[-1.5rem] w-1 h-6 bg-gray-100 dark:bg-slate-800 z-0 hidden sm:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Mission Critical Stats ────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
           <div className="bg-white dark:bg-[#1E293B] p-8 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Readiness Score</p>
              <div className="flex items-center justify-between">
                 <div className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">{stats.readiness}%</div>
                 <div className="w-16 h-16 relative">
                    <svg className="w-full h-full transform -rotate-90">
                       <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-100 dark:text-slate-800" />
                       <motion.circle
                         cx="32" cy="32" r="28" stroke="#1a73e8" strokeWidth="6" fill="transparent"
                         strokeDasharray={2 * Math.PI * 28}
                         initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                         animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - stats.readiness / 100) }}
                         strokeLinecap="round"
                         transition={{ duration: 1.5 }}
                       />
                    </svg>
                 </div>
              </div>
           </div>

           <div className="bg-white dark:bg-[#1E293B] p-8 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Current Module</p>
              <div className="flex items-center justify-between">
                 <div className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">
                    {stats.passedModulesCount < 5 ? `Module ${stats.passedModulesCount + 1}` : 'Modules Complete'}
                 </div>
                 <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                       <div key={i} className={`w-3 h-3 rounded-full ${i <= stats.passedModulesCount ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-slate-800'}`} />
                    ))}
                 </div>
              </div>
           </div>
        </div>

      </div>

      {/* ── Contextual Help Modal (Glassmorphism) ─────────────── */}
      <AnimatePresence>
        {activeTooltip && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setActiveTooltip(null)}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm"
             />
             <motion.div
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[40px] border border-white/20 shadow-2xl space-y-6"
             >
                <button
                  onClick={() => setActiveTooltip(null)}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                   <X size={20} />
                </button>

                <div className="space-y-4">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                      <HelpCircle size={14} /> Mission Intelligence
                   </div>
                   <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                      {STAGE_CONTENT.find(s => s.id === activeTooltip)?.title}
                   </h3>
                   <p className="text-sm font-bold text-gray-600 dark:text-slate-300 leading-relaxed italic">
                      {STAGE_CONTENT.find(s => s.id === activeTooltip)?.tooltip}
                   </p>
                </div>

                <button
                  onClick={() => setActiveTooltip(null)}
                  className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl"
                >
                   Understood
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AppShell>
  );
}
