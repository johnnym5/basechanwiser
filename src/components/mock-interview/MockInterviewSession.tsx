"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { MockInterviewConfig, MockInterviewAttempt, MockInterviewAnswer } from "@/types/mock";
import { Loader2, Timer, Send, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MockInterviewSession() {
  const { user, userId, userProfile } = useAuth();
  const [config, setConfig] = useState<MockInterviewConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [finished, setQuizFinished] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (userId) fetchConfig();
  }, [userId]);

  const fetchConfig = async () => {
    // 1. Check override
    const overrideRef = doc(db, "Users", userId!, "overrides", "mock_interview");
    const overrideSnap = await getDoc(overrideRef);

    if (overrideSnap.exists()) {
      setConfig(overrideSnap.data() as MockInterviewConfig);
    } else {
      // 2. Fallback to default
      const defaultRef = doc(db, "mock_interview_configs", "default");
      const defaultSnap = await getDoc(defaultRef);
      if (defaultSnap.exists()) {
        setConfig(defaultSnap.data() as MockInterviewConfig);
      }
    }
    setLoading(false);
  };

  const startSession = () => {
    if (!config) return;
    setTimeLeft(config.durationMinutes * 60);
    setStarted(true);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          submitSession('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const submitSession = async (status: 'completed' | 'timeout' = 'completed') => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (finished) return;

    setQuizFinished(true);
    setLoading(true);

    const formattedAnswers: MockInterviewAnswer[] = config!.questions.map(q => ({
      questionId: q.id,
      questionText: q.text,
      answerText: answers[q.id] || ""
    }));

    const attempt: MockInterviewAttempt = {
      studentId: userId!,
      studentName: userProfile?.displayName || user?.displayName || "Student",
      answers: formattedAnswers,
      questionTimestamps: [], // Not using video in the non-live version
      startedAt: serverTimestamp(),
      submittedAt: serverTimestamp(),
      timeTakenSeconds: (config!.durationMinutes * 60) - timeLeft,
      status
    };

    try {
      await addDoc(collection(db, "mock_interview_attempts"), attempt);
    } catch (e) {
      console.error("Failed to save attempt:", e);
    }
    setLoading(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && !started) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  if (finished) {
    return (
      <div className="bg-white dark:bg-slate-800 p-12 rounded-[40px] shadow-xl text-center space-y-6 border border-emerald-100 dark:border-emerald-900/30 animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={48} className="text-emerald-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Session Submitted</h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Your answers have been recorded for counselor review.</p>
        </div>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="bg-white dark:bg-slate-800 p-12 rounded-[40px] shadow-xl text-center space-y-8 border border-gray-100 dark:border-slate-700">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
          <Timer size={40} className="text-blue-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Mock Interview Arena</h2>
          <p className="text-gray-500 font-bold max-w-md mx-auto leading-relaxed">
            This session is timed for <span className="text-blue-500 font-black">{config?.durationMinutes} minutes</span>.
            Ensure you are in a quiet environment. Your progress will auto-submit when the timer hits zero.
          </p>
        </div>
        <button
          onClick={startSession}
          className="px-12 py-5 bg-[#1a73e8] text-white font-black rounded-full text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto"
        >
          Begin Interview Challenge <ChevronRight />
        </button>
      </div>
    );
  }

  const currentQ = config!.questions[currentIdx];

  return (
    <div className="space-y-8">
      {/* Timer Bar */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 flex items-center justify-between shadow-sm sticky top-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500">
            <Timer size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Time Remaining</span>
            <span className={`text-xl font-black ${timeLeft < 60 ? 'text-rose-500 animate-pulse' : 'text-gray-900 dark:text-white'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Progress</span>
          <div className="w-32 h-2 bg-gray-100 dark:bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${((currentIdx + 1) / config!.questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-slate-800 rounded-[40px] border border-gray-100 dark:border-slate-700 shadow-xl overflow-hidden min-h-[400px] flex flex-col">
        <div className="p-8 border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2 block">Question {currentIdx + 1} of {config!.questions.length}</span>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">{currentQ.text}</h2>
        </div>

        <div className="flex-1 p-8 flex flex-col">
          <textarea
            value={answers[currentQ.id] || ""}
            onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
            placeholder="Type your response here..."
            className="flex-1 w-full bg-transparent border-none focus:ring-0 text-gray-700 dark:text-slate-300 text-lg leading-relaxed placeholder:text-gray-300 dark:placeholder:text-slate-700 resize-none font-medium"
          />
        </div>

        <div className="p-8 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center border-t border-gray-50 dark:border-slate-700">
          <button
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(prev => prev - 1)}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={20} /> Previous
          </button>

          {currentIdx === config!.questions.length - 1 ? (
            <button
              onClick={() => submitSession()}
              className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Send size={16} /> Final Submission
            </button>
          ) : (
            <button
              onClick={() => setCurrentIdx(prev => prev + 1)}
              className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              Next Question <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Safety Warning */}
      <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-amber-700 dark:text-amber-400">
        <AlertCircle size={20} className="shrink-0" />
        <p className="text-xs font-bold leading-relaxed">Do not refresh the page. Your progress is saved locally during the session but must be submitted to be reviewed by a counselor.</p>
      </div>
    </div>
  );
}
