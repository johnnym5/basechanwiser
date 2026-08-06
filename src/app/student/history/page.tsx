"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth/auth-context";
import {
  History,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Timer,
  Trophy,
  Calendar,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "@/components/common/EmptyState";

interface AttemptDetail {
  questionText: string;
  selectedOption: string;
  correctOption: string;
  isCorrect: boolean;
  timeTakenSeconds: number;
}

interface QuizAttempt {
  id: string;
  packTitle: string;
  score: number; // For Accuracy %
  scorePercentage: number; // Standard field
  gamifiedScore: number;
  correctAnswers: number;
  totalQuestions: number;
  totalTimeSpentSeconds: number;
  passed: boolean;
  createdAt: any;
  details: AttemptDetail[];
  historyDetails: AttemptDetail[];
}

export default function ActivityHistoryPage() {
  const { user, userId } = useAuth(); // Use auth for current user
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      setFetchError(null);
      if (!userId) {
        setAttempts([]);
        setLoading(false);
        return;
      }
      try {
        const historyRef = collection(db, "quiz_attempts");
        const q = query(
          historyRef,
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const historyData = snap.docs.map(d => ({ id: d.id, ...d.data() } as QuizAttempt));
        setAttempts(historyData);
      } catch (err: any) {
        console.error("Error fetching history:", err);
        setFetchError(err.message || "Failed to load quiz history.");
        setAttempts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [userId]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-10 pb-20">

        <div className="space-y-1">
           <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
              <History className="w-8 h-8 text-blue-500" /> Mission Log
           </h1>
           <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Review your past performance and analyze weak points.</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>
        ) : fetchError ? (
          <EmptyState
            icon={AlertTriangle}
            title="Unable to Load Mission Log"
            description={`There was a problem loading your history. Check the console for Firestore index details and refresh the page.`}
          />
        ) : attempts.length === 0 ? (
          <EmptyState
            icon={History}
            title="No Missions Logged"
            description="You haven't completed any missions yet. Your attempt history will appear here once you finish your first learning module quiz."
          />
        ) : (
          <div className="space-y-4">
             {attempts.map((attempt) => (
               <div key={attempt.id} className="bg-white dark:bg-[#1E293B] rounded-[32px] border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div
                    onClick={() => toggleExpand(attempt.id)}
                    className="p-6 sm:p-8 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                  >
                     <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${attempt.passed ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800 text-rose-600'}`}>
                           {attempt.passed ? <CheckCircle2 className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
                        </div>
                        <div className="space-y-1">
                           <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter">{attempt.packTitle}</h3>
                           <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {attempt.createdAt?.seconds ? new Date(attempt.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                              <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> {attempt.totalTimeSpentSeconds}s Total</span>
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-8 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0">
                        <div className="text-center">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Accuracy</p>
                           <p className={`text-lg font-black ${attempt.passed ? 'text-emerald-500' : 'text-rose-500'}`}>{attempt.score}%</p>
                        </div>
                        <div className="text-center">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Score</p>
                           <p className="text-lg font-black text-blue-600">{attempt.gamifiedScore.toLocaleString()}</p>
                        </div>
                        <div className="ml-auto p-2 rounded-xl bg-gray-50 dark:bg-[#0F172A]">
                           {expandedId === attempt.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </div>
                     </div>
                  </div>

                  <AnimatePresence>
                     {expandedId === attempt.id && (
                       <motion.div
                         initial={{ height: 0 }}
                         animate={{ height: "auto" }}
                         exit={{ height: 0 }}
                         className="border-t border-gray-50 dark:border-slate-800 bg-gray-50/30 dark:bg-[#0F172A]/30"
                       >
                          <div className="p-6 sm:p-10 space-y-6">
                             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-slate-800 pb-4">Detailed Question Breakdown</p>

                             <div className="space-y-4">
                                {attempt.details?.map((log, idx) => (
                                  <div key={idx} className={`p-6 rounded-3xl border-2 space-y-4 transition-all ${log.isCorrect ? 'bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-100/50 dark:border-emerald-900/30' : 'bg-rose-50/30 dark:bg-rose-900/10 border-rose-100/50 dark:border-rose-900/30'}`}>
                                     <div className="flex items-start justify-between gap-4">
                                        <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200">
                                           <span className="text-gray-400 mr-2">Q{idx + 1}.</span> {log.questionText}
                                        </h4>
                                        <div className="shrink-0 flex items-center gap-1.5 text-[9px] font-black uppercase text-gray-400 bg-white dark:bg-[#1E293B] px-2 py-1 rounded-lg border border-gray-100 dark:border-slate-800">
                                           <Timer className="w-3 h-3" /> {log.timeTakenSeconds}s
                                        </div>
                                     </div>

                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                           <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Your Answer</p>
                                           <p className={`text-xs font-bold p-3 rounded-xl border ${log.isCorrect ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-600'}`}>
                                              {log.selectedOption}
                                           </p>
                                        </div>
                                        {!log.isCorrect && (
                                          <div className="space-y-1">
                                             <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Correct Answer</p>
                                             <p className="text-xs font-bold p-3 rounded-xl border bg-gray-100 dark:bg-[#1E293B] border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300">
                                                {log.correctOption}
                                             </p>
                                          </div>
                                        )}
                                     </div>
                                  </div>
                                ))}
                             </div>
                          </div>
                       </motion.div>
                     )}
                  </AnimatePresence>
               </div>
             ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
