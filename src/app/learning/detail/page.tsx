"use client";

import React, { useState, useEffect, Suspense } from "react";
import AppShell from "@/components/layout/app-shell";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  HelpCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Module, Question } from "@/types";

function ModuleDetailContent() {
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("id");
  const { user } = useAuth();
  const router = useRouter();

  const [module, setModule] = useState<Module | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [scorePercentage, setScorePercentage] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(true);

  const FALLBACK_QUESTIONS: Question[] = [
    {
      id: "q-1",
      questionText: "What is the maximum allowed weekly work hours for international students during term time?",
      options: [
        { id: "opt-1", text: "20 hours per week", isCorrect: true },
        { id: "opt-2", text: "40 hours per week", isCorrect: false },
        { id: "opt-3", text: "10 hours per week", isCorrect: false },
      ],
    },
    {
      id: "q-2",
      questionText: "How long must maintenance funds be held in a bank account before visa application?",
      options: [
        { id: "opt-4", text: "28 consecutive days", isCorrect: true },
        { id: "opt-5", text: "14 days", isCorrect: false },
        { id: "opt-6", text: "60 days", isCorrect: false },
      ],
    },
    {
      id: "q-3",
      questionText: "What is the minimum passing score threshold required for this foundation module?",
      options: [
        { id: "opt-7", text: "80%", isCorrect: true },
        { id: "opt-8", text: "50%", isCorrect: false },
        { id: "opt-9", text: "60%", isCorrect: false },
      ],
    },
  ];

  useEffect(() => {
    async function fetchModule() {
      if (!moduleId) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, "modules", moduleId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as Module;
          if (!data.questions || data.questions.length === 0) {
            data.questions = FALLBACK_QUESTIONS;
          }
          setModule(data);
        } else {
          setModule({
            id: moduleId,
            title: "Foundation Module",
            description: "Foundation compliance and visa rules.",
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            questions: FALLBACK_QUESTIONS,
          });
        }
      } catch (err) {
        console.warn("Module fetch fallback:", err);
        setModule({
          id: moduleId,
          title: "Foundation Module",
          description: "Foundation compliance and visa rules.",
          videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
          questions: FALLBACK_QUESTIONS,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchModule();
  }, [moduleId]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmitQuiz = async () => {
    if (!module || !module.questions) return;

    let correctCount = 0;
    module.questions.forEach((q) => {
      const selectedOptId = answers[q.id];
      const correctOpt = q.options.find((o) => o.isCorrect);
      if (selectedOptId && correctOpt && selectedOptId === correctOpt.id) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / module.questions.length) * 100);
    setScorePercentage(score);
    setSubmitted(true);

    if (score >= 80) {
      setToast({
        message: `Congratulations! You scored ${score}%. Module Passed!`,
        type: "success",
      });

      if (user) {
        try {
          const progRef = doc(db, "Progress", user.uid);
          const progSnap = await getDoc(progRef);
          let currentCompleted: string[] = [];
          let currentScores: Record<string, number> = {};

          if (progSnap.exists()) {
            currentCompleted = progSnap.data().completedModuleIds || [];
            currentScores = progSnap.data().moduleScores || {};
          }

          if (!currentCompleted.includes(module.id)) {
            currentCompleted.push(module.id);
          }
          currentScores[module.id] = score;

          await setDoc(
            progRef,
            {
              userId: user.uid,
              completedModuleIds: currentCompleted,
              moduleScores: currentScores,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn("Progress update fallback:", err);
        }
      }
    } else {
      setToast({
        message: `You scored ${score}%. Minimum 80% required to pass. Please retake the quiz.`,
        type: "error",
      });
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setSubmitted(false);
    setScorePercentage(null);
    setToast(null);
  };

  if (loading || !module) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-500 dark:text-gray-400 font-semibold">
        <Sparkles className="w-5 h-5 animate-spin text-[#1a73e8] dark:text-blue-400" /> Loading module content...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {toast && (
        <div
          className={`fixed top-16 right-6 z-50 px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold border transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500"
              : "bg-rose-600 text-white border-rose-500"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={() => router.push("/learning")}
          className="text-xs font-bold text-[#1a73e8] dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Modules
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight font-google">{module.title}</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">{module.description}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 border border-gray-200/80 dark:border-gray-700 shadow-xs overflow-hidden">
        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-gray-900 flex items-center justify-center relative">
          <iframe
            src={module.videoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ"}
            title={module.title}
            className="w-full h-full border-none"
            allowFullScreen
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 border border-gray-200/80 dark:border-gray-700 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 font-google">
              <HelpCircle className="w-5 h-5 text-[#1a73e8] dark:text-blue-400" /> Module Knowledge Check (MCQ)
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Answer all questions and score 80%+ to complete.</p>
          </div>

          {submitted && scorePercentage !== null && (
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold border ${
                scorePercentage >= 80
                  ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-red-900/30 text-rose-700 dark:text-red-300 border-rose-200 dark:border-red-800"
              }`}
            >
              Score: {scorePercentage}% {scorePercentage >= 80 ? "— PASSED" : "— FAILED"}
            </span>
          )}
        </div>

        <div className="space-y-6">
          {module.questions.map((q, qIdx) => (
            <div key={q.id} className="space-y-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border border-gray-200/60 dark:border-gray-600">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                {qIdx + 1}. {q.questionText}
              </h3>

              <div className="space-y-2">
                {q.options.map((opt) => {
                  const isSelected = answers[q.id] === opt.id;
                  const isCorrectOpt = opt.isCorrect;

                  let optBg = "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600";
                  if (submitted) {
                    if (isCorrectOpt) {
                      optBg = "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-semibold";
                    } else if (isSelected && !isCorrectOpt) {
                      optBg = "bg-rose-100 dark:bg-red-900/30 text-rose-900 dark:text-red-200 border-rose-300 dark:border-red-700 font-semibold";
                    }
                  } else if (isSelected) {
                    optBg = "bg-blue-50 dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-400 border-blue-300 dark:border-blue-700 font-semibold";
                  }

                  return (
                    <label
                      key={opt.id}
                      onClick={() => handleSelectOption(q.id, opt.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${optBg}`}
                    >
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 text-[#1a73e8]"
                      />
                      <span>{opt.text}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          {submitted ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleRetake}
                className="px-5 py-2.5 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 text-xs font-bold transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Retake Quiz
              </button>
              {scorePercentage !== null && scorePercentage >= 80 && (
                <button
                  onClick={() => router.push("/learning")}
                  className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                >
                  Proceed to Next Module →
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleSubmitQuiz}
              disabled={Object.keys(answers).length < module.questions.length}
              className="px-6 py-3 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              Submit Quiz & Calculate Score
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LearningDetailPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
        <ModuleDetailContent />
      </Suspense>
    </AppShell>
  );
}
