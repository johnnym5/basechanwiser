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
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp, updateDoc, addDoc, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { QuestionPack, Question, LearningModule, UserProfile } from "@/types";
import { Resource } from "@/types/resource";
import { shuffleArray } from "@/lib/utils/shuffle";
import { SystemSettings } from "@/types/resource";

function ModuleDetailContent() {
  const searchParams = useSearchParams();
  const packId = searchParams.get("packId") || searchParams.get("id");
  const { user } = useAuth();
  const router = useRouter();

  const [pack, setPack] = useState<LearningModule | QuestionPack | null>(null);
  const [attachedResources, setAttachedResources] = useState<Resource[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [scorePercentage, setScorePercentage] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!packId) {
        setLoading(false);
        return;
      }
      try {
        // 1. Fetch learning module or question pack
        const modSnap = await getDoc(doc(db, "learning_modules", packId));
        if (modSnap.exists()) {
          const { id, ...data } = modSnap.data() as LearningModule;
          const shuffledQuestions = shuffleArray(data.questions || []).map(q => ({
            ...q,
            options: shuffleArray(q.options || [])
          }));
          setPack({ id: modSnap.id, ...data, questions: shuffledQuestions } as LearningModule);
        } else {
          const packSnap = await getDoc(doc(db, "question_packs", packId));
          if (packSnap.exists()) {
            const { id, ...data } = packSnap.data() as QuestionPack;
            const shuffledQuestions = shuffleArray(data.questions || []).map(q => ({
              ...q,
              options: shuffleArray(q.options || [])
            }));
            setPack({ id: packSnap.id, ...data, questions: shuffledQuestions } as QuestionPack);
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
              tags: rData.tags,
              validUntil: rData.validUntil,
              clicks: rData.clicks,
              views: rData.views,
              addedBy: rData.addedBy || "",
              authorName: rData.authorName || "Staff",
              createdAt: rData.createdAt,
            });

            // Increment views for matched resources
            updateDoc(d.ref, { views: (rData.views || 0) + 1 });
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
    if (!pack || !pack.questions || !user) return;

    // ── Check Cooldown & Max Retakes ──
    try {
      const sysRef = doc(db, "system_settings", "global");
      const sysSnap = await getDoc(sysRef);
      if (sysSnap.exists()) {
        const settings = sysSnap.data() as SystemSettings;

        // 1. Max Retakes check
        const attemptsQ = query(
          collection(db, "quiz_attempts"),
          where("userId", "==", user.uid),
          where("packId", "==", pack.id)
        );
        const existingAttempts = await getDocs(attemptsQ);
        const attemptCount = existingAttempts.size;

        if (settings.maxRetakes && attemptCount >= settings.maxRetakes) {
          alert(`You have reached the maximum number of attempts (${settings.maxRetakes}) for this module. Please contact your counselor to unlock.`);
          return;
        }

        // 2. Cooldown check
        if (settings.quizRetakeCooldownHours && attemptCount > 0) {
          const lastAttempt = existingAttempts.docs
            .map(d => d.data())
            .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds)[0];

          if (lastAttempt?.timestamp) {
            const lastTime = lastAttempt.timestamp.seconds * 1000;
            const now = Date.now();
            const hoursPassed = (now - lastTime) / (1000 * 60 * 60);
            if (hoursPassed < settings.quizRetakeCooldownHours) {
              alert(`Please wait ${Math.ceil(settings.quizRetakeCooldownHours - hoursPassed)} more hours before retaking this quiz.`);
              return;
            }
          }
        }
      }
    } catch (err) {
      console.warn("Retake check error:", err);
    }

    let correctCount = 0;
    const detailedAnswers: Record<string, any> = {};

    pack.questions.forEach((q) => {
      const selectedOptId = answers[q.id];
      const selectedOpt = q.options.find((o) => o.id === selectedOptId);
      const correctOpt = q.options.find((o) => o.isCorrect);

      detailedAnswers[q.id] = {
        questionText: q.questionText,
        selectedOptionId: selectedOptId || null,
        selectedOptionText: selectedOpt?.text || "No Answer",
        isCorrect: !!(selectedOptId && correctOpt && selectedOptId === correctOpt.id),
        explanation: q.explanation || "",
      };

      if (detailedAnswers[q.id].isCorrect) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / pack.questions.length) * 100);
    const requiredScore = pack.passScore || 80;
    setScorePercentage(score);
    setSubmitted(true);

    // ── Log Attempt for Analytics ──────────────────────────────
    try {
      const attemptsQ = query(
        collection(db, "quiz_attempts"),
        where("userId", "==", user.uid),
        where("packId", "==", pack.id)
      );
      const existingAttempts = await getDocs(attemptsQ);
      const attemptNumber = existingAttempts.size + 1;

      await addDoc(collection(db, "quiz_attempts"), {
        userId: user.uid,
        userName: user.displayName || "Student",
        packId: pack.id,
        packTitle: pack.title,
        score,
        attemptNumber,
        answers: detailedAnswers,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Failed to log quiz attempt:", err);
    }

    if (score >= requiredScore) {
      setShowSuccessModal(true);
      sessionStorage.setItem("last_quiz_score", score.toString());

      try {
        const userRef = doc(db, "Users", user.uid);
        const uSnap = await getDoc(userRef);
        if (uSnap.exists()) {
          const uData = uSnap.data() as UserProfile;
          const moduleScores = uData.moduleScores || {};
          const prevScore = moduleScores[pack.id] || 0;
          const newScores = { ...moduleScores, [pack.id]: Math.max(prevScore, score) };

          let updatePayload: any = {
            moduleScores: newScores,
            updatedAt: serverTimestamp(),
          };

          // If it's a LearningModule with an order, handle progression
          if ("order" in pack) {
            const currentOrder = pack.order;
            const userLevel = uData.currentModuleLevel || 1;
            if (userLevel === currentOrder) {
              updatePayload.currentModuleLevel = currentOrder + 1;
            }
          }

          await updateDoc(userRef, updatePayload);
        }
      } catch (err) {
        console.warn("Failed to update progression:", err);
      }
    } else {
      setShowFailureModal(true);
    }
  };

  const handleRetake = () => {
    // Reshuffle on retake
    if (pack && pack.questions) {
      const reshuffled = shuffleArray(pack.questions).map(q => ({
        ...q,
        options: shuffleArray(q.options || [])
      }));
      setPack({ ...pack, questions: reshuffled });
    }
    setAnswers({});
    setSubmitted(false);
    setScorePercentage(null);
    setToast(null);
    setShowFailureModal(false);
  };

  const handleResourceClick = async (resId: string) => {
    try {
      const resRef = doc(db, "resources", resId);
      const resSnap = await getDoc(resRef);
      if (resSnap.exists()) {
        await updateDoc(resRef, { clicks: (resSnap.data().clicks || 0) + 1 });
      }
    } catch (err) {
      console.warn("Failed to increment clicks:", err);
    }
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
          <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/40 text-[#1a73e8] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {'category' in pack ? pack.category : "UKVI Module"}
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
                      onClick={() => handleResourceClick(res.id)}
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-emerald-200 dark:border-emerald-900 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white font-google">Congratulations!</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              You passed with <span className="font-black text-emerald-600 dark:text-emerald-400">{scorePercentage}%</span>.
              {"order" in pack ? `Module ${pack.order + 1} is now unlocked!` : "You have mastered this drill!"}
            </p>
            <button
              onClick={() => router.push("/learning")}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all"
            >
              Continue Learning
            </button>
          </div>
        </div>
      )}

      {/* Failure Modal */}
      {showFailureModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-rose-200 dark:border-rose-900">
            <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white font-google">Not Quite There</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              You scored <span className="font-black text-rose-600 dark:text-rose-400">{scorePercentage}%</span>.
              You need <span className="font-bold">{passMark}%</span> to pass. Please review the material and try again.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleRetake}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 transition-all"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push("/learning")}
                className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-2xl transition-all"
              >
                Exit to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
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
