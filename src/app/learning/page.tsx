"use client";

import React, { useEffect, useState } from "react";
import AppShell from "@/components/layout/app-shell";
import Link from "next/link";
import { BookOpen, CheckCircle2, Play, Lock, Sparkles, FolderOpen, Award, HelpCircle, Zap } from "lucide-react";
import { collection, getDocs, doc, getDoc, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth/auth-context";
import { UserProfile } from "@/types";
import { TestQuestionSet } from "@/types/academy";
import DriveVaultModal from "@/components/library/DriveVaultModal";

export default function LearningModulesPage() {
  const { userId } = useAuth();
  const [coreModules, setCoreModules] = useState<TestQuestionSet[]>([]);
  const [supplementalPacks, setSupplementalPacks] = useState<TestQuestionSet[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;
      try {
        // 1. Fetch User Profile for score tracking and level progression
        const userSnap = await getDoc(doc(db, "Users", userId));
        if (userSnap.exists()) {
          setUserProfile({ uid: userSnap.id, ...userSnap.data() } as UserProfile);
        }

        // 2. Fetch Consolidated Academy Track (test_question_sets)
        // We fetch all non-archived sets
        const setsQuery = query(collection(db, "test_question_sets"), where("isArchived", "==", false));
        const setsSnap = await getDocs(setsQuery);
        const allSets = setsSnap.docs.map(d => ({ id: d.id, ...d.data() } as TestQuestionSet));

        // 3. STRICT CATEGORY SPLITTING
        // Core Track: Linear progression (Module 1 -> 5)
        const core = allSets
          .filter(s => s.category === 'core')
          .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

        // Supplemental Track: Open drills
        const supplemental = allSets
          .filter(s => s.category === 'supplemental');

        setCoreModules(core);
        setSupplementalPacks(supplemental);

      } catch (err) {
        console.error("Error fetching learning track:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId]);

  const currentLevel = userProfile?.currentModuleLevel || 1;
  const moduleScores = userProfile?.moduleScores || {};

  return (
    <AppShell>
      <div className="space-y-10">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" /> Academy Library
            </h1>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">
              Mission-critical compliance training and university credibility drills.
            </p>
          </div>

          <button
            onClick={() => setIsVaultOpen(true)}
            className="px-6 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
          >
            <FolderOpen className="w-4 h-4" /> Open Resource Vault
          </button>
        </div>

        <DriveVaultModal isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} />

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Sparkles className="w-10 h-10 animate-spin text-blue-500" />
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Synchronizing learning track...</p>
          </div>
        ) : (
          <div className="space-y-16">

            {/* ── CORE TRACK (LINEAR PROGRESSION) ── */}
            <section className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="px-4 py-1.5 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-full">Primary Track</div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Core Learning Modules</h2>
                  <div className="h-px bg-gray-100 dark:bg-slate-800 flex-1" />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {coreModules.map((mod) => {
                    const isLocked = (mod.orderIndex || 0) > currentLevel;
                    const score = moduleScores[mod.id];
                    const isPassed = score !== undefined && score >= 80;

                    return (
                      <div
                        key={mod.id}
                        className={`bg-white dark:bg-slate-800 rounded-[32px] p-8 border-2 transition-all flex flex-col justify-between h-full group ${
                          isLocked
                            ? "opacity-50 grayscale border-gray-100 dark:border-slate-900"
                            : "border-gray-50 dark:border-slate-700 hover:border-blue-500/50 shadow-sm hover:shadow-xl"
                        }`}
                      >
                        <div className="space-y-5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Module {mod.orderIndex}</span>
                            {isLocked ? (
                              <Lock className="w-4 h-4 text-gray-300" />
                            ) : isPassed ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{score}%</span>
                              </div>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            )}
                          </div>

                          <div className="space-y-2">
                             <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight">{mod.title}</h3>
                             <p className="text-xs text-gray-500 dark:text-gray-400 font-bold leading-relaxed line-clamp-3">
                                {mod.summary || "UKVI Credibility Fundamentals."}
                             </p>
                          </div>

                          <div className="flex items-center gap-4">
                             <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> 10 Drills
                             </div>
                             <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                <Award className="w-3.5 h-3.5 text-amber-500" /> {mod.passScore || 80}% Target
                             </div>
                          </div>
                        </div>

                        <div className="pt-8">
                          {isLocked ? (
                            <div className="w-full py-4 bg-gray-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest border border-dashed border-gray-200">
                               <Lock className="w-3.5 h-3.5" /> Unlock Module {mod.orderIndex! - 1} First
                            </div>
                          ) : (
                            <Link
                              href={`/learning/detail?packId=${mod.id}`}
                              className="w-full py-4 bg-[#1a73e8] text-white rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                            >
                              <Play className="w-4 h-4 fill-current" />
                              {isPassed ? "Review Drills" : score !== undefined ? "Retake Attempt" : "Initialize Mission"}
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                 })}
               </div>
            </section>

            {/* ── SUPPLEMENTAL TRACK (OPEN ACCESS) ── */}
            {supplementalPacks.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="px-4 py-1.5 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-full">Extra Training</div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Supplemental Question Packs</h2>
                    <div className="h-px bg-gray-100 dark:bg-slate-800 flex-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {supplementalPacks.map((pack) => {
                     const score = moduleScores[pack.id];
                     const isPassed = score !== undefined && score >= (pack.passScore || 80);

                     return (
                       <div
                         key={pack.id}
                         className="bg-white dark:bg-slate-800 rounded-[32px] p-8 border-2 border-gray-50 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-indigo-500/50 transition-all flex flex-col justify-between h-full"
                       >
                         <div className="space-y-5">
                            <div className="flex items-center justify-between">
                               <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Open Drill</span>
                               {isPassed && (
                                 <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                                   <CheckCircle2 className="w-3.5 h-3.5" />
                                   <span className="text-[10px] font-black uppercase tracking-widest">{score}%</span>
                                 </div>
                               )}
                            </div>

                            <div className="space-y-2">
                               <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight">{pack.title}</h3>
                               <p className="text-xs text-gray-500 dark:text-gray-400 font-bold leading-relaxed line-clamp-3">
                                  {pack.description || "Additional UKVI credibility drill."}
                               </p>
                            </div>

                            <div className="flex items-center gap-4">
                               <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                  <Zap className="w-3.5 h-3.5 text-amber-500" /> 10 Questions
                               </div>
                            </div>
                         </div>

                         <div className="pt-8">
                            <Link
                              href={`/learning/detail?packId=${pack.id}`}
                              className="w-full py-4 bg-indigo-600 text-white rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                            >
                               <Play className="w-4 h-4 fill-current" />
                               {isPassed ? "Retake for Score" : "Launch Drill"}
                            </Link>
                         </div>
                       </div>
                     );
                  })}
                </div>
              </section>
            )}

            {/* Empty State */}
            {coreModules.length === 0 && supplementalPacks.length === 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-[40px] p-20 border-2 border-dashed border-gray-100 dark:border-slate-700 text-center space-y-4">
                <FolderOpen className="w-16 h-16 text-gray-200 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Library Empty</h3>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Contact your counselor to assign mission packs.</p>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </AppShell>
  );
}
