"use client";

import React, { useEffect, useState, useMemo } from "react";
import AppShell from "@/components/layout/app-shell";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import {
  BookOpen,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  ChevronRight,
  Star,
  Info,
  History,
  XCircle,
  Flame,
  Trophy,
  FolderOpen
} from "lucide-react";
import DriveVaultModal from "@/components/library/DriveVaultModal";
import ReactConfetti from "react-confetti";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";
import { motion } from "framer-motion";

const MOTIVATIONAL_PHRASES = [
  "You're 1 step closer to your UK university journey! 🇬🇧",
  "Let's crush today's compliance drill! 🚀",
  "Consistency is the key to a successful CAS application! 💎",
  "Keep going! Your future self will thank you. ✨",
  "Mastering UKVI rules today makes the interview easy tomorrow! 📚"
];

const UKVI_TIPS = [
  "💡 Pro Tip: UKVI officers love it when you name specific university facilities like Bloomberg terminals or specialized labs!",
  "💡 Pro Tip: Always know your RQF level. For a Master's, it's level 7.",
  "💡 Pro Tip: Be ready to explain the 28-day rule for your maintenance funds clearly.",
  "💡 Pro Tip: Research your university's Vice-Chancellor. It shows you've done your homework!",
  "💡 Pro Tip: Have a clear career plan for when you return to your home country."
];

export default function StudentDashboardPage() {
  const { user, userId } = useAuth();
  const { data, loading: dataLoading } = useStudentDashboard(userId);

  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentTipIdx, setCurrentTipIdx] = useState(0);

  useEffect(() => {
    // Check if we should show confetti from a recent pass
    const lastScore = sessionStorage.getItem("last_quiz_score");
    if (lastScore && parseInt(lastScore) >= 80) {
      setShowConfetti(true);
      sessionStorage.removeItem("last_quiz_score");
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, []);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTipIdx(prev => (prev + 1) % UKVI_TIPS.length);
    }, 8000);
    return () => clearInterval(tipInterval);
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

  const nextAction = useMemo(() => {
    if (data.passedModulesCount < 5) {
      return {
        label: `Next Task: Start Module ${data.nextModuleOrder}`,
        cta: "Resume Journey 🚀",
        href: `/learning/detail?packId=${data.nextModuleId}`
      };
    }
    if (!data.interviewPackSubmitted) {
      return {
        label: "Foundation Complete! Time to fill out your Interview Pack.",
        cta: "Complete Profile ✍️",
        href: "/student/interview-pack"
      };
    }
    return {
      label: "All steps complete! Awaiting Counselor evaluation.",
      cta: "Review Materials 📚",
      href: "/learning"
    };
  }, [data]);

  const rank = useMemo(() => {
    if (data.readiness >= 90) return "Global Ambassador";
    if (data.interviewPackSubmitted) return "Interview Ready";
    if (data.passedModulesCount >= 5) return "Compliance Cadet";
    if (data.passedModulesCount > 0) return "Active Scholar";
    return "Beginner";
  }, [data]);

  if (dataLoading) {
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
      {showConfetti && <ReactConfetti width={window.innerWidth} height={window.innerHeight} recycle={false} />}

      <div className="space-y-8 pb-20">

        {/* ── Gamified Header ─────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="space-y-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter font-google">{greeting}</h1>
              <p className="text-sm font-bold text-gray-500 dark:text-blue-400 italic">"{motivationalQuote}"</p>

              <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
                 <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 border border-orange-100 dark:border-orange-800">
                    <Flame className="w-4 h-4 fill-current" />
                    <span className="text-[10px] font-black uppercase">
                       {data.streak} Day Streak
                    </span>
                 </div>
                 <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 border border-purple-100 dark:border-purple-800">
                    <Trophy className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase">
                       {data.points.toLocaleString()} PTS
                    </span>
                 </div>
                 <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 border border-blue-100 dark:border-blue-800">
                    <Star className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase">{rank}</span>
                 </div>
              </div>
           </div>

           <div className="relative group cursor-default">
              <div className="absolute -inset-2 bg-blue-500/20 blur-xl rounded-full group-hover:bg-blue-500/30 transition-all duration-500" />
              <div className="relative flex items-center gap-6 bg-white dark:bg-[#1E293B] p-6 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-xl">

                {/* Circular Progress Ring UI */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48" cy="48" r="40"
                      stroke="currentColor" strokeWidth="8" fill="transparent"
                      className="text-gray-100 dark:text-slate-800"
                    />
                    <motion.circle
                      cx="48" cy="48" r="40"
                      stroke="#1a73e8" strokeWidth="8" fill="transparent"
                      strokeDasharray={2 * Math.PI * 40}
                      initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - data.readiness / 100) }}
                      strokeLinecap="round"
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  <span className="absolute text-xl font-black text-gray-900 dark:text-white">{data.readiness}%</span>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Readiness</p>
                  <p className="text-base font-black dark:text-white">{data.passedModulesCount} of 5 Passed</p>
                  <div className="flex gap-1">
                     {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-2.5 h-1.5 rounded-full ${i < data.passedModulesCount ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-slate-800'}`} />
                     ))}
                  </div>
                </div>
              </div>
           </div>
        </div>

        {/* ── Priority Task Hero Banner ────────────────────────── */}
        <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 p-10 text-white shadow-2xl animate-in fade-up duration-700">
           <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-80 h-80 bg-white/10 blur-[100px] rounded-full" />
           <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-60 h-60 bg-blue-400/20 blur-[80px] rounded-full" />

           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-3 flex-1 text-center md:text-left">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest">
                    <Zap className="w-3 h-3 fill-current" /> Priority Task
                 </div>
                 <h2 className="text-2xl md:text-3xl font-black tracking-tighter leading-tight max-w-lg">{nextAction.label}</h2>
              </div>
              <Link
                href={nextAction.href}
                className="group shrink-0 px-10 py-5 bg-white text-[#1a73e8] font-black rounded-full text-sm uppercase tracking-widest shadow-2xl shadow-blue-900/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 animate-pulse-scale"
              >
                 {nextAction.cta}
              </Link>
           </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

           {/* ── Learning Path Roadmap ─────── */}
           <div className="xl:col-span-2 bg-white dark:bg-[#1E293B] rounded-[40px] p-10 border border-gray-100 dark:border-slate-800 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                 <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-blue-500" /> Learning Path
                 </h3>
                 <Link href="/learning" className="text-[10px] font-black uppercase text-blue-500 hover:underline flex items-center gap-1">Full Hub <ChevronRight className="w-3 h-3" /></Link>
              </div>

              <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 py-4">
                 <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-50 dark:bg-slate-800 -translate-y-1/2 hidden sm:block" />

                 {[1, 2, 3, 4, 5].map((order) => {
                    const isCompleted = order <= data.passedModulesCount;
                    const isUnlocked = order === data.passedModulesCount + 1;
                    const isLocked = order > data.passedModulesCount + 1;

                    return (
                       <div key={order} className="relative z-10 flex-1 w-full sm:w-auto">
                          <Link
                            href={isLocked ? "#" : `/learning/detail?packId=module_${order}`}
                            className={`flex flex-col items-center gap-3 transition-all ${isLocked ? 'cursor-not-allowed opacity-50' : 'hover:scale-110'}`}
                          >
                             <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center border-4 shadow-xl transition-all
                                ${isCompleted ? 'bg-emerald-500 border-emerald-200 text-white shadow-emerald-500/20' :
                                  isUnlocked ? 'bg-[#1a73e8] border-blue-200 text-white shadow-blue-500/40 animate-pulse' :
                                  'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 shadow-none'}`}
                             >
                                {isCompleted ? <CheckCircle2 className="w-8 h-8" /> :
                                 isLocked ? <Lock className="w-6 h-6" /> :
                                 <Sparkles className="w-8 h-8 fill-current" />}
                             </div>
                             <div className="text-center space-y-1 px-2">
                                <p className={`text-[10px] font-black uppercase tracking-tighter ${isLocked ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>Module {order}</p>
                             </div>
                          </Link>
                       </div>
                    );
                 })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                 <div className="p-6 rounded-3xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 flex items-start gap-4 group">
                    <Star className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
                    <div>
                       <p className="text-xs font-black uppercase text-blue-900 dark:text-blue-300">Milestone reached</p>
                       <p className="text-xs font-medium text-blue-700 dark:text-blue-400 leading-relaxed">
                         Complete all 5 modules to unlock your Final Interview Pack and Mock session.
                       </p>
                    </div>
                 </div>
                 <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 flex items-start gap-4">
                    <Info className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                    <div>
                       <p className="text-xs font-black uppercase text-amber-900 dark:text-amber-300">Strategy Tip</p>
                       <p className="text-xs font-medium text-amber-700 dark:text-amber-400 leading-relaxed">
                         The faster you answer questions, the more points you earn. Speed reflects interview confidence!
                       </p>
                    </div>
                 </div>
              </div>
           </div>

           {/* ── Recent Activity Sidebar ─────────────────────────────── */}
           <div className="space-y-8">

              {/* Real-time Activity List */}
              <div className="bg-white dark:bg-[#1E293B] rounded-[40px] p-8 border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
                 <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <History className="w-4 h-4" /> Mission History
                 </h3>
                 <div className="space-y-4">
                    {data.recentActivity.length === 0 ? (
                       <p className="text-[10px] font-bold text-gray-400 text-center py-4">No recent attempts logged.</p>
                    ) : data.recentActivity.map(a => (
                       <div key={a.id} className="flex items-center justify-between gap-4 border-b border-gray-50 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center gap-3 overflow-hidden">
                             <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${a.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                {a.passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                             </div>
                             <div className="truncate">
                                <p className="text-[11px] font-black dark:text-white truncate">{a.packTitle || "Quiz Drill"}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase">{a.scorePercentage || 0}% Accuracy</p>
                             </div>
                          </div>
                          <span className="text-[10px] font-black text-[#1a73e8]">+{a.gamifiedScore?.toLocaleString()}</span>
                       </div>
                    ))}
                 </div>
                 <Link href="/student/history" className="block text-center text-[10px] font-black uppercase text-[#1a73e8] hover:underline pt-2">View Full Audit Log</Link>
              </div>

              {/* Dynamic Tip Carousel */}
              <div className="bg-gradient-to-br from-[#0F172A] to-[#1e293b] rounded-[40px] p-8 text-white shadow-xl relative overflow-hidden h-48 flex flex-col justify-center border border-slate-700/50">
                 <div className="absolute top-4 right-6 text-blue-500/10"><Info size={80} /></div>
                 <div className="relative z-10 space-y-3 animate-in fade-in slide-in-from-right duration-1000" key={currentTipIdx}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                       <ShieldCheck className="w-3 h-3" /> UKVI Credibility Insight
                    </p>
                    <p className="text-sm font-bold leading-relaxed">{UKVI_TIPS[currentTipIdx]}</p>
                 </div>
              </div>

              {/* Resource Vault Quick Link */}
              <button
                onClick={() => setIsVaultOpen(true)}
                className="w-full bg-blue-50 dark:bg-blue-900/10 rounded-[32px] p-6 border-2 border-dashed border-blue-200 dark:border-blue-900/30 flex items-center justify-between group hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all shadow-sm"
              >
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#0F172A] shadow-md flex items-center justify-center text-[#1a73e8] group-hover:scale-110 transition-transform"><FolderOpen className="w-6 h-6" /></div>
                    <div className="text-left">
                       <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest leading-none mb-1">Resource Vault</p>
                       <p className="text-xs font-black dark:text-white uppercase tracking-tighter">Guides & Templates</p>
                    </div>
                 </div>
                 <ChevronRight className="w-5 h-5 text-blue-300 group-hover:translate-x-1 transition-transform" />
              </button>

           </div>
        </div>

        <DriveVaultModal isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} />
      </div>
    </AppShell>
  );
}
