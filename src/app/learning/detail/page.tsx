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
  Award,
  Video,
  FileText,
  ExternalLink,
  Download,
} from "lucide-react";
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { QuestionPack, Question } from "@/types";
import { Resource } from "@/types/resource";

function ModuleDetailContent() {
  const searchParams = useSearchParams();
  const packId = searchParams.get("packId") || searchParams.get("id");
  const { user } = useAuth();
  const router = useRouter();

  const [pack, setPack] = useState<QuestionPack | null>(null);
  const [attachedResources, setAttachedResources] = useState<Resource[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [scorePercentage, setScorePercentage] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!packId) {
        setLoading(false);
        return;
      }
      try {
        // 1. Fetch question pack or fallback module
        const packSnap = await getDoc(doc(db, "question_packs", packId));
        if (packSnap.exists()) {
          const data = { id: packSnap.id, ...packSnap.data() } as QuestionPack;
          setPack(data);
        } else {
          const modSnap = await getDoc(doc(db, "modules", packId));
          if (modSnap.exists()) {
            const mData = modSnap.data();
            setPack({
              id: modSnap.id,
              title: mData.title || "Foundation Module",
              description: mData.description || "",
              category: "General Compliance",
              videoUrl: mData.videoUrl || "",
              passScore: 80,
              isDefault: false,
              questions: mData.questions || [],
            });
          }
        }

        // 2. Fetch attached Google Drive study materials/resources from `resources` collection
        const resSnap = await getDocs(collection(db, "resources"));
        const matchedResources: Resource[] = [];
        resSnap.forEach((d) => {
          const rData = d.data();
          if (rData.attachedPackId === packId || !rData.attachedPackId) {
            matchedResources.push({
              id: d.id,
              title: rData.title || "Untitled Resource",
              type: rData.type || "video",
              driveUrl: rData.driveUrl || "",
              embedUrl: rData.embedUrl || "",
              attachedPackId: rData.attachedPackId,
              addedBy: rData.addedBy || "",
              authorName: rData.authorName || "Staff",
              createdAt: rData.createdAt,
            });
          }
        });
        setAttachedResources(matchedResources);
      } catch (err) {
        console.warn("Pack/resource fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [packId]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmitQuiz = async () => {
    if (!pack || !pack.questions) return;

    let correctCount = 0;
    pack.questions.forEach((q) => {
      const selectedOptId = answers[q.id];
      const correctOpt = q.options.find((o) => o.isCorrect);
      if (selectedOptId && correctOpt && selectedOptId === correctOpt.id) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / pack.questions.length) * 100);
    const requiredScore = pack.passScore || 80;
    setScorePercentage(score);
    setSubmitted(true);

    if (score >= requiredScore) {
      setToast({
        message: `Congratulations! You scored ${score}%. Pack Passed!`,
        type: "success",
      });

      if (user) {
        try {
          const userRef = doc(db, "Users", user.uid);
          const uSnap = await getDoc(userRef);
          const completed: string[] = uSnap.exists()
            ? uSnap.data().completedPackIds || []
            : [];

          if (!completed.includes(pack.id)) {
            await setDoc(
              userRef,
              { completedPackIds: [...completed, pack.id] },
              { merge: true }
            );
          }

          const progRef = doc(db, "Progress", user.uid);
          const progSnap = await getDoc(progRef);
          const progCompleted: string[] = progSnap.exists()
            ? progSnap.data().completedPackIds || progSnap.data().completedModuleIds || []
            : [];

          if (!progCompleted.includes(pack.id)) {
            await setDoc(
              progRef,
              {
                userId: user.uid,
                completedPackIds: [...progCompleted, pack.id],
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          }
        } catch (err) {
          console.warn("Failed to record completion:", err);
        }
      }
    } else {
      setToast({
        message: `You scored ${score}%. Minimum pass score is ${requiredScore}%. Please review materials and retry.`,
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

  if (loading || !pack) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-500 dark:text-gray-400 font-semibold">
        <Sparkles className="w-5 h-5 animate-spin text-[#1a73e8] dark:text-blue-400" /> Loading quiz drill content...
      </div>
    );
  }

  const passMark = pack.passScore || 80;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Toast Alert */}
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

      {/* Back Link & Title */}
      <div className="space-y-2">
        <button
          onClick={() => router.push("/learning")}
          className="text-xs font-bold text-[#1a73e8] dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Learning Drills
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {pack.category || "General Compliance"}
          </span>
          <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Pass Mark: {passMark}%
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight font-google">{pack.title}</h1>
        {pack.description && <p className="text-xs text-gray-500 dark:text-gray-400">{pack.description}</p>}
      </div>

      {/* Section 4: Study Materials & Video Lessons Vault */}
      {(pack.videoUrl || attachedResources.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200/80 dark:border-gray-700 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 font-google">
            <Video className="w-5 h-5 text-[#1a73e8]" /> Study Materials & Video Lessons
          </h2>

          {/* Embedded Primary Video URL */}
          {pack.videoUrl && (
            <div className="space-y-3">
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-gray-900 flex items-center justify-center">
                <iframe
                  src={pack.videoUrl}
                  title={pack.title}
                  className="w-full h-full border-none"
                  allowFullScreen
                />
              </div>
              <a
                href={pack.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#1a73e8] hover:underline"
              >
                ▶ Watch Lesson on Google Drive <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Attached Google Drive Resources List */}
          {attachedResources.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Downloadable Study Documents & PDF Guides
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attachedResources.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {res.type === "video" ? (
                        <Video className="w-5 h-5 text-purple-600 shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                      )}
                      <div className="truncate">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{res.title}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">{res.type}</p>
                      </div>
                    </div>
                    <a
                      href={res.driveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" /> Open
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Multiple Choice Quiz Card */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 border border-gray-200/80 dark:border-gray-700 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 font-google">
              <HelpCircle className="w-5 h-5 text-[#1a73e8] dark:text-blue-400" /> Compliance Knowledge Check
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Answer all questions and score {passMark}%+ to pass.</p>
          </div>

          {submitted && scorePercentage !== null && (
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold border ${
                scorePercentage >= passMark
                  ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-red-900/30 text-rose-700 dark:text-red-300 border-rose-200 dark:border-red-800"
              }`}
            >
              Score: {scorePercentage}% {scorePercentage >= passMark ? "— PASSED" : "— FAILED"}
            </span>
          )}
        </div>

        {/* Question List */}
        <div className="space-y-6">
          {pack.questions && pack.questions.map((q, qIdx) => (
            <div key={q.id || qIdx} className="space-y-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200/60 dark:border-gray-600">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                {qIdx + 1}. {q.questionText}
              </h3>

              <div className="space-y-2">
                {q.options && q.options.map((opt) => {
                  const isSelected = answers[q.id] === opt.id;
                  let optStyle = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200";

                  if (submitted) {
                    if (opt.isCorrect) {
                      optStyle = "bg-emerald-50 dark:bg-emerald-900/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold";
                    } else if (isSelected && !opt.isCorrect) {
                      optStyle = "bg-rose-50 dark:bg-rose-900/40 border-rose-500 text-rose-900 dark:text-rose-200 font-bold";
                    }
                  } else if (isSelected) {
                    optStyle = "bg-blue-50 dark:bg-blue-900/50 border-[#1a73e8] text-[#1a73e8] dark:text-blue-300 font-bold shadow-xs";
                  }

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(q.id, opt.id)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${optStyle}`}
                    >
                      <span>{opt.text}</span>
                      {submitted && opt.isCorrect && (
                        <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">Correct Choice</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {submitted && q.explanation && (
                <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200">
                  <span className="font-bold">Explanation: </span> {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3">
          {submitted ? (
            <button
              onClick={handleRetake}
              className="px-6 py-2.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold text-xs flex items-center gap-2 transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Retake Knowledge Check
            </button>
          ) : (
            <button
              onClick={handleSubmitQuiz}
              disabled={Object.keys(answers).length < (pack.questions?.length || 0)}
              className="px-6 py-2.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" /> Submit Answers
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ModuleDetailPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading module drill...</div>}>
        <ModuleDetailContent />
      </Suspense>
    </AppShell>
  );
}
