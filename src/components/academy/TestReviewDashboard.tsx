"use client";

import React from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Trophy,
  AlertTriangle,
  ChevronLeft,
  Calendar,
  Zap
} from "lucide-react";
import { TestAttempt } from "@/types/academy";
import { motion } from "framer-motion";

interface TestReviewDashboardProps {
  attempt: TestAttempt;
  onBack?: () => void;
}

export default function TestReviewDashboard({ attempt, onBack }: TestReviewDashboardProps) {
  const isPass = attempt.scorePercentage >= 80;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-[#1E293B] p-8 rounded-[40px] border border-gray-100 dark:border-slate-800 shadow-xl">
        <div className="flex items-center gap-6">
          {onBack && (
            <button
              onClick={onBack}
              className="p-3 rounded-2xl bg-gray-50 dark:bg-[#0F172A] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
          )}
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <User className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
              {attempt.studentName || "Student Review"}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {attempt.submittedAt?.seconds ? new Date(attempt.submittedAt.seconds * 1000).toLocaleString() : 'Recent'}</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> ID: {attempt.studentId || "N/A"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-gray-100 dark:border-slate-800 pt-6 md:pt-0 md:pl-8">
          <div className="text-center">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Accuracy</p>
            <p className={`text-2xl font-black ${isPass ? 'text-emerald-500' : 'text-rose-500'}`}>{attempt.scorePercentage}%</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Points</p>
            <p className="text-2xl font-black text-blue-600">{attempt.gamifiedScore.toLocaleString()}</p>
          </div>
          <div className={`px-4 py-2 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest ${isPass ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
            {isPass ? 'PASSED' : 'FAILED'}
          </div>
        </div>
      </div>

      {/* Question Breakdown */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
           <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Detailed Analysis</h2>
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{attempt.correctCount} / {attempt.totalQuestions} Correct</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {attempt.askedQuestions.map((q, qIdx) => {
            const studentChoice = attempt.studentAnswers[qIdx];
            const isCorrect = studentChoice === q.correctAnswerIndex;
            const isTimeout = studentChoice === null;

            return (
              <motion.div
                key={qIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: qIdx * 0.05 }}
                className={`bg-white dark:bg-[#1E293B] rounded-[32px] border-2 overflow-hidden shadow-sm transition-all ${
                  isCorrect ? 'border-emerald-100 dark:border-emerald-900/30' :
                  isTimeout ? 'border-amber-100 dark:border-amber-900/30' : 'border-rose-100 dark:border-rose-900/30'
                }`}
              >
                <div className="p-8 space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                      <span className="text-gray-400 mr-3 font-black">Q{qIdx + 1}.</span> {q.prompt}
                    </h3>
                    {isTimeout && (
                      <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-[9px] font-black uppercase tracking-widest">
                        <Clock className="w-3 h-3" /> Time Expired
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.shuffledOptions.map((opt, oIdx) => {
                      const isCorrectOption = oIdx === q.correctAnswerIndex;
                      const isStudentChoice = oIdx === studentChoice;

                      let boxStyle = "bg-gray-50 dark:bg-[#0F172A] border-gray-100 dark:border-slate-800 text-gray-500 opacity-60";

                      if (isCorrectOption) {
                        boxStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 opacity-100 ring-1 ring-emerald-500/20";
                      } else if (isStudentChoice && !isCorrect) {
                        boxStyle = "bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400 opacity-100 ring-1 ring-rose-500/20";
                      }

                      return (
                        <div
                          key={oIdx}
                          className={`p-4 rounded-2xl border-2 flex items-center justify-between text-xs font-bold transition-all ${boxStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border ${
                              isCorrectOption ? 'bg-emerald-500 text-white border-emerald-500' :
                              isStudentChoice ? 'bg-rose-500 text-white border-rose-500' : 'bg-white dark:bg-slate-800 border-inherit'
                            }`}>
                              {String.fromCharCode(65 + oIdx)}
                            </div>
                            {opt}
                          </div>
                          {isCorrectOption && <CheckCircle2 className="w-4 h-4" />}
                          {isStudentChoice && !isCorrect && <XCircle className="w-4 h-4" />}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-medium text-blue-800 dark:text-blue-300 italic leading-relaxed">
                        <span className="font-black uppercase tracking-widest mr-2 not-italic text-[9px]">Feedback:</span>
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
