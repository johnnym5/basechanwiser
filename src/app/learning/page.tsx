"use client";

import React, { useEffect, useState } from "react";
import AppShell from "@/components/layout/app-shell";
import Link from "next/link";
import { BookOpen, CheckCircle2, Play, Lock, Sparkles, FolderOpen, Award, HelpCircle, Zap, ChevronLeft, ArrowRight } from "lucide-react";
import { collection, getDocs, doc, getDoc, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth/auth-context";
import { UserProfile } from "@/types";
import { TestQuestionSet } from "@/types/academy";
import { LibraryResource } from "@/types/resource";

export default function LearningModulesPage() {
  const { userId } = useAuth();
  const [coreModules, setCoreModules] = useState<TestQuestionSet[]>([]);
  const [supplementalPacks, setSupplementalPacks] = useState<TestQuestionSet[]>([]);
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;
      try {
        // 1. Fetch User Profile & Quiz Attempts
        const [userSnap, quizSnap, setsSnap, resSnap] = await Promise.all([
          getDoc(doc(db, "Users", userId)),
          getDocs(query(collection(db, "quiz_attempts"), where("userId", "==", userId))),
          getDocs(query(collection(db, "test_question_sets"), where("isArchived", "==", false))),
          getDocs(collection(db, "library_resources"))
        ]);

        if (userSnap.exists()) {
          setUserProfile({ uid: userSnap.id, ...userSnap.data() } as UserProfile);
        }

        // Aggregate scores from attempts
        const tempScores: Record<string, number> = {};
        quizSnap.docs.forEach(d => {
          const attempt = d.data();
          const packId = attempt.packId || attempt.setId;
          const score = attempt.scorePercentage || 0;
          if (!tempScores[packId] || score > tempScores[packId]) {
            tempScores[packId] = score;
          }
        });
        setScores(tempScores);

        const allSets = setsSnap.docs.map(d => ({ id: d.id, ...d.data() } as TestQuestionSet));

        // 3. Fetch Library Resources
        const allResources = resSnap.docs.map(d => ({ id: d.id, ...d.data() } as LibraryResource));
        setResources(allResources);

        // 4. Split and Sort (Explicitly Ascending)
        const core = allSets
          .filter(s => s.category === 'core')
          .sort((a, b) => {
            const aNum = a.orderIndex !== undefined ? a.orderIndex : parseInt(a.title?.match(/\d+/)?.[0] || "999");
            const bNum = b.orderIndex !== undefined ? b.orderIndex : parseInt(b.title?.match(/\d+/)?.[0] || "999");
            return aNum - bNum;
          });

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
          <div className="space-y-4">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 transition-colors">
               <ChevronLeft size={16} /> Back to Dashboard
            </Link>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-blue-600" /> Learning Resources
              </h1>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">
                Mission-critical compliance documents and university credibility guides.
              </p>
            </div>
          </div>
        </div>

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

               <div className="flex flex-col gap-6 max-w-5xl mx-auto">
                 {coreModules.map((mod, idx) => {
                    const score = scores[mod.id] || 0;
                    const isPassed = score >= 80;

                    // Sequential Locking: Unlock if first module OR previous module is passed
                    const prevMod = idx > 0 ? coreModules[idx - 1] : null;
                    const isUnlocked = idx === 0 || (scores[prevMod?.id || ""] >= 80);
                    const isLocked = !isUnlocked;

                    // Priority 1: Direct ID link. Priority 2: Title keyword match (e.g. "Module 2")
                    const linkedResource = resources.find(r =>
                      r.linkedPackId === mod.id ||
                      (mod.title && r.title && r.title.toLowerCase().includes(`module ${mod.orderIndex}`))
                    );

                    return (
                      <div
                        key={mod.id}
                        className={`relative group transition-all duration-500 ${
                          isLocked ? "opacity-40 grayscale" : ""
                        }`}
                      >
                        <div className={`
                          relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-10 rounded-[32px] border-2 transition-all duration-500
                          ${isUnlocked && !isPassed
                            ? "bg-white dark:bg-slate-900/40 backdrop-blur-md border-blue-500/30 shadow-2xl shadow-blue-500/5 ring-1 ring-blue-500/20"
                            : isPassed
                              ? "bg-slate-50/50 dark:bg-slate-900/20 border-emerald-100 dark:border-emerald-900/30"
                              : "bg-white/30 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800"}
                        `}>

                          <div className="flex items-center gap-8 w-full md:w-auto">
                            {/* Visual Indicator */}
                            <div className={`
                              w-20 h-20 rounded-[24px] flex items-center justify-center shrink-0 border-2 transition-all duration-500
                              ${isPassed
                                ? "bg-white dark:bg-slate-800 border-emerald-200 text-emerald-600 shadow-lg shadow-emerald-500/5"
                                : !isLocked
                                  ? "bg-blue-600 border-blue-400 text-white shadow-2xl shadow-blue-600/30 scale-105"
                                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300"}
                            `}>
                               {isLocked ? <Lock strokeWidth={1.5} className="w-8 h-8" /> :
                                isPassed ? <CheckCircle2 strokeWidth={1.5} className="w-10 h-10" /> :
                                <BookOpen strokeWidth={1.5} className="w-10 h-10" />}
                            </div>

                            <div className="space-y-2">
                               <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">
                                    {mod.orderIndex !== undefined ? `Module ${mod.orderIndex}` : mod.title}
                                  </span>
                                  {isPassed && (
                                    <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-full border border-emerald-100 dark:border-emerald-800 text-[9px] font-black uppercase">
                                      {score}% Proficiency
                                    </div>
                                  )}
                               </div>
                               <h3 className={`text-2xl font-black tracking-tighter ${isLocked ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                  {mod.title}
                               </h3>
                               <p className="text-xs text-gray-500 dark:text-gray-400 font-bold leading-relaxed line-clamp-2 max-w-lg">
                                  {mod.summary || "UKVI Credibility Fundamentals & Institutional Strategic Assessment."}
                               </p>

                               <div className="flex items-center gap-6 pt-2">
                                  <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                     <HelpCircle className="w-4 h-4 text-blue-500" /> 10 Assessment Drills
                                  </div>
                                  <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                     <Award className="w-4 h-4 text-amber-500" /> {mod.passScore || 80}% Proficiency Target
                                  </div>
                               </div>
                            </div>
                          </div>

                          <div className="w-full md:w-auto flex flex-col gap-3 pt-6 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 min-w-[200px]">
                            {isLocked ? (
                              <div className="w-full py-4 bg-gray-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest border border-dashed border-gray-200">
                                 <Lock className="w-4 h-4" /> Authorization Pending
                              </div>
                            ) : (
                              <>
                                {linkedResource ? (
                                  <Link
                                    href={`/student/library/viewer?id=${linkedResource.id}`}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
                                  >
                                    <BookOpen className="w-4 h-4" />
                                    Study Materials
                                  </Link>
                                ) : (
                                  <Link
                                    href={`/learning/detail?packId=${mod.id}`}
                                    className="w-full py-4 bg-[#1a73e8] text-white rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
                                  >
                                    <Play className="w-4 h-4 fill-current" />
                                    Launch Mission
                                  </Link>
                                )}

                                <Link
                                  href={`/learning/detail?packId=${mod.id}`}
                                  className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all border
                                    ${isPassed
                                      ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100"
                                      : "bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-slate-400 border-gray-100 dark:border-slate-800 hover:text-blue-600"}`}
                                >
                                   {isPassed ? "Retake Assessment" : "Skip to Quiz"} <ArrowRight className="w-3 h-3" />
                                </Link>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Connecting Line */}
                        {idx < coreModules.length - 1 && (
                          <div className="absolute left-[3.5rem] bottom-[-1.5rem] w-[2px] h-6 bg-slate-100 dark:bg-slate-800 z-0 hidden md:block" />
                        )}
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

                <div className="flex flex-col gap-6 max-w-5xl mx-auto">
                  {supplementalPacks.map((pack) => {
                     const score = scores[pack.id] || 0;
                     const isPassed = score >= (pack.passScore || 80);
                     const linkedResource = resources.find(r => r.linkedPackId === pack.id);

                     return (
                       <div
                         key={pack.id}
                         className="bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-[32px] p-8 md:p-10 border-2 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-500/50 transition-all flex flex-col md:flex-row items-center justify-between gap-8 group"
                       >
                         <div className="flex items-center gap-8 w-full md:w-auto">
                            <div className={`w-20 h-20 rounded-[24px] flex items-center justify-center shrink-0 border-2 ${isPassed ? 'bg-white dark:bg-slate-800 border-emerald-200 text-emerald-600' : 'bg-indigo-50 dark:bg-slate-800 border-indigo-100 dark:border-slate-700 text-indigo-500'}`}>
                               <Zap strokeWidth={1.5} className="w-10 h-10" />
                            </div>

                            <div className="space-y-2">
                               <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Open Drill</span>
                                  {isPassed && (
                                    <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-full border border-emerald-100 dark:border-emerald-800 text-[9px] font-black uppercase">
                                      {score}% Accuracy
                                    </div>
                                  )}
                               </div>
                               <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight">{pack.title}</h3>
                               <p className="text-xs text-gray-500 dark:text-gray-400 font-bold leading-relaxed line-clamp-2 max-w-lg">
                                  {pack.description || "Additional UKVI credibility drill for institutional alignment."}
                               </p>
                            </div>
                         </div>

                         <div className="w-full md:w-auto flex flex-col gap-3 pt-6 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 min-w-[200px]">
                            {linkedResource ? (
                              <Link
                                href={`/student/library/viewer?id=${linkedResource.id}`}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                              >
                                 <BookOpen className="w-4 h-4" />
                                 Study Material
                              </Link>
                            ) : (
                              <Link
                                href={`/learning/detail?packId=${pack.id}`}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                              >
                                 <Play className="w-4 h-4 fill-current" />
                                 {isPassed ? "Retake for Score" : "Launch Drill"}
                              </Link>
                            )}

                            <Link
                              href={`/learning/detail?packId=${pack.id}`}
                              className="w-full py-3 bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-slate-400 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest hover:text-indigo-500 transition-all border border-gray-100 dark:border-slate-800"
                            >
                               Skip to Questions <ArrowRight className="w-3 h-3" />
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
