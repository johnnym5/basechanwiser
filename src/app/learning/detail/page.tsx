"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
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
  Timer,
  Lightbulb,
  Trophy,
  ArrowRight,
  Loader2,
  X
} from "lucide-react";
import { doc, getDoc, collection, getDocs, serverTimestamp, updateDoc, addDoc, deleteDoc, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { QuestionPack, Question, LearningModule, UserProfile } from "@/types";
import { Resource, SystemSettings } from "@/types/resource";
import { shuffleArray } from "@/lib/utils/shuffle";
import { motion, AnimatePresence } from "framer-motion";

const BASE_POINTS = 1000;
const TIME_BONUS_MULTIPLIER = 100;
const QUESTION_TIMER_SECONDS = 10;

function ModuleDetailContent() {
  const searchParams = useSearchParams();
  const packId = searchParams.get("packId") || searchParams.get("id");
  const { user, userId, userProfile } = useAuth();
  const router = useRouter();

  const [pack, setPack] = useState<LearningModule | QuestionPack | null>(null);
  const [attachedResources, setAttachedResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Quiz Engine State ──────────────────────────────────────────
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMER_SECONDS);
  const [showHint, setShowHint] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false); // Controls the brief flash delay

  // ── Stats Accumulation ─────────────────────────────────────────
  const [correctCount, setCorrectCount] = useState(0);
  const [gamifiedScore, setGamifiedScore] = useState(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [questionLogs, setQuestionLogs] = useState<any[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!packId) {
        setLoading(false);
        return;
      }
      try {
        const modSnap = await getDoc(doc(db, "learning_modules", packId));
        let rawData: any = null;
        let isModule = false;

        if (modSnap.exists()) {
          rawData = modSnap.data();
          isModule = true;
        } else {
          const packSnap = await getDoc(doc(db, "question_packs", packId));
          if (packSnap.exists()) rawData = packSnap.data();
        }

        if (rawData) {
          const shuffledQuestions = shuffleArray(rawData.questions || []).map((q: any) => ({
            ...q,
            options: shuffleArray(q.options || [])
          }));
          setPack({ id: packId, ...rawData, questions: shuffledQuestions });
        }

        const resSnap = await getDocs(collection(db, "resources"));
        const matchedResources: Resource[] = [];
        resSnap.forEach((d) => {
          const rData = d.data();
          if (rData.attachedPackId === packId || !rData.attachedPackId) {
            matchedResources.push({ id: d.id, ...rData } as Resource);
          }
        });
        setAttachedResources(matchedResources);
      } catch (err) {
        console.warn("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [packId]);

  // ── Timer Logic ────────────────────────────────────────────────
  useEffect(() => {
    if (quizStarted && !quizFinished && !isAnswering) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleAnswerSelect(null); // Timeout case
            return QUESTION_TIMER_SECONDS;
          }
          if (prev <= 8) setShowHint(true);
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizStarted, quizFinished, isAnswering, currentQuestionIndex]);

  const handleAnswerSelect = async (optionId: string | null) => {
    if (isAnswering || quizFinished || !pack) return;
    setIsAnswering(true);
    setSelectedOptionId(optionId);

    const currentQuestion = pack.questions[currentQuestionIndex];
    const timeSpentOnThisQuestion = QUESTION_TIMER_SECONDS - timeLeft;
    setTotalTimeSpent(prev => prev + timeSpentOnThisQuestion);

    const correctOption = currentQuestion.options.find(o => o.isCorrect);
    const isCorrect = optionId === correctOption?.id;

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      const points = BASE_POINTS + (timeLeft * TIME_BONUS_MULTIPLIER);
      setGamifiedScore(prev => prev + points);
    }

    setQuestionLogs(prev => [...prev, {
      questionText: currentQuestion.questionText,
      selectedOption: currentQuestion.options.find(o => o.id === optionId)?.text || "Timeout",
      correctOption: correctOption?.text || "N/A",
      isCorrect,
      timeTakenSeconds: timeSpentOnThisQuestion
    }]);

    // Brief delay to show feedback before moving on
    setTimeout(() => {
      if (currentQuestionIndex < pack.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setTimeLeft(QUESTION_TIMER_SECONDS);
        setShowHint(false);
        setSelectedOptionId(null);
        setIsAnswering(false);
      } else {
        finishQuiz();
      }
    }, 800);
  };

  const finishQuiz = async () => {
    setQuizFinished(true);
    if (!pack || !userId) return;

    const totalQuestions = pack.questions.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const passThreshold = pack.passScore || 80;
    const passed = scorePercentage >= passThreshold;

    try {
      // 1. Log detailed attempt (Repaired Pipeline)
      const attemptPayload = {
        userId,
        studentId: userProfile?.studentId || "N/A",
        studentName: user?.displayName || "Student",
        packId: pack.id,
        packTitle: pack.title,
        score: scorePercentage, // Compatibility with existing History UI
        scorePercentage, // Pipeline standard
        gamifiedScore,
        correctAnswers: correctCount,
        totalQuestions,
        totalTimeSpentSeconds: totalTimeSpent,
        passed,
        createdAt: serverTimestamp(),
        details: questionLogs, // Compatibility
        historyDetails: questionLogs // Pipeline standard
      };

      await addDoc(collection(db, "quiz_attempts"), attemptPayload);
      await cleanupOldQuizAttempts();

      // 2. Update Progress if passed
      if (passed) {
        const userRef = doc(db, "Users", userId);
        const uSnap = await getDoc(userRef);
        if (uSnap.exists()) {
          const uData = uSnap.data() as UserProfile;
          const moduleScores = uData.moduleScores || {};
          const prevScore = moduleScores[pack.id] || 0;
          const newScores = { ...moduleScores, [pack.id]: Math.max(prevScore, scorePercentage) };

          let updatePayload: any = {
            moduleScores: newScores,
            gamifiedScore: (uData.gamifiedScore || 0) + gamifiedScore,
            updatedAt: serverTimestamp(),
          };

          if ("order" in pack) {
            const currentLevel = uData.currentModuleLevel || 1;
            if (currentLevel === (pack as any).order) {
              updatePayload.currentModuleLevel = currentLevel + 1;
            }
          }
          await updateDoc(userRef, updatePayload);
        }
        sessionStorage.setItem("last_quiz_score", scorePercentage.toString());
      }
    } catch (err) {
      console.error("Failed to save quiz history:", err);
      alert("There was an error saving your score. Please check your connection.");
    }
  };

  const cleanupOldQuizAttempts = async () => {
    if (!userId) return;

    try {
      const attemptsQuery = query(
        collection(db, "quiz_attempts"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(11)
      );
      const snap = await getDocs(attemptsQuery);
      if (snap.size <= 10) return;

      const toDelete = snap.docs.slice(10);
      await Promise.all(
        toDelete.map((docSnap) => deleteDoc(doc(db, "quiz_attempts", docSnap.id)))
      );
    } catch (err) {
      console.error("cleanupOldQuizAttempts error:", err);
    }
  };

  const handleRetake = () => {
    if (pack && pack.questions) {
      const reshuffled = shuffleArray(pack.questions).map(q => ({
        ...q,
        options: shuffleArray(q.options || [])
      }));
      setPack({ ...pack, questions: reshuffled });
    }
    setCurrentQuestionIndex(0);
    setTimeLeft(QUESTION_TIMER_SECONDS);
    setShowHint(false);
    setQuizFinished(false);
    setQuizStarted(true);
    setCorrectCount(0);
    setGamifiedScore(0);
    setTotalTimeSpent(0);
    setQuestionLogs([]);
    setSelectedOptionId(null);
    setIsAnswering(false);
  };

  if (loading || !pack) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-sm font-black uppercase text-gray-500 tracking-widest text-center">Preparing Game Arena...</p>
      </div>
    );
  }

  const currentQuestion = pack.questions[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">

        {/* ── Header Info ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
             <button onClick={() => router.push("/learning")} className="text-[10px] font-black uppercase text-blue-500 flex items-center gap-1 hover:underline mb-2">
                <ArrowLeft className="w-3 h-3" /> Back to modules
             </button>
             <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{pack.title}</h1>
             <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{pack.description}</p>
          </div>
          <div className="flex items-center gap-2">
             <div className="px-4 py-2 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black text-amber-600 uppercase">{gamifiedScore} PTS</span>
             </div>
          </div>
        </div>

        {!quizStarted && !quizFinished ? (
          /* ── START SCREEN ── */
          <div className="bg-white dark:bg-[#1E293B] rounded-[40px] p-12 border border-gray-100 dark:border-slate-800 shadow-xl text-center space-y-8 animate-in fade-up duration-500">
             <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-12 h-12 text-blue-500 animate-pulse-scale" />
             </div>
             <div className="space-y-2">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Ready for the Arena?</h2>
                <p className="text-sm text-gray-500 font-bold max-w-sm mx-auto leading-relaxed">
                   10 seconds per question. Quick answers earn more bonus points. 80% score required to pass.
                </p>
             </div>

             {attachedResources.length > 0 && (
                <div className="bg-gray-50 dark:bg-[#0F172A] p-6 rounded-3xl space-y-4">
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Study Materials</p>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {attachedResources.map(res => (
                         <a key={res.id} href={res.driveUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-blue-500 transition-all text-left">
                            {res.type === 'video' ? <Video className="w-5 h-5 text-blue-500" /> : <FileText className="w-5 h-5 text-rose-500" />}
                            <span className="text-xs font-bold text-gray-700 dark:text-slate-300 truncate">{res.title}</span>
                         </a>
                      ))}
                   </div>
                </div>
             )}

             <button
               onClick={() => setQuizStarted(true)}
               className="px-12 py-5 bg-[#1a73e8] text-white font-black rounded-full text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto min-h-[56px]"
             >
                Enter Challenge <ArrowRight className="w-5 h-5" />
             </button>
          </div>
        ) : quizStarted && !quizFinished ? (
          /* ── GAME ARENA ── */
          <div className="space-y-8 animate-in fade-in duration-300">
             {/* Timer Bar */}
             <div className="relative h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  className={`h-full ${timeLeft <= 3 ? 'bg-rose-500' : 'bg-blue-500'}`}
                  initial={{ width: "100%" }}
                  animate={{ width: `${(timeLeft / QUESTION_TIMER_SECONDS) * 100}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                />
             </div>

             <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Question {currentQuestionIndex + 1} of {pack.questions.length}</span>
                <div className="flex items-center gap-2 text-blue-500">
                   <Timer className={`w-4 h-4 ${timeLeft <= 3 ? 'animate-bounce text-rose-500' : ''}`} />
                   <span className={`text-sm font-black ${timeLeft <= 3 ? 'text-rose-500' : ''}`}>{timeLeft}s</span>
                </div>
             </div>

             <div className="bg-white dark:bg-[#1E293B] rounded-[40px] p-10 border border-gray-100 dark:border-slate-800 shadow-xl space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-blue-500/5"><HelpCircle className="w-32 h-32" /></div>

                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight relative z-10">
                   {currentQuestion.questionText}
                </h2>

                <div className="grid grid-cols-1 gap-4 relative z-10">
                   {currentQuestion.options.map((opt, idx) => {
                      const isSelected = selectedOptionId === opt.id;
                      const isCorrect = opt.isCorrect;

                      let style = "border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-[#0F172A] hover:border-blue-500 dark:hover:border-blue-500";
                      if (isAnswering) {
                         if (isCorrect) style = "border-emerald-500 bg-emerald-500/10 text-emerald-600";
                         else if (isSelected) style = "border-rose-500 bg-rose-500/10 text-rose-600";
                         else style = "opacity-40 border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-[#0F172A]";
                      }

                      return (
                         <button
                           key={opt.id}
                           onClick={() => handleAnswerSelect(opt.id)}
                           disabled={isAnswering}
                           className={`p-6 rounded-3xl border-2 text-left transition-all flex items-center justify-between group ${style}`}
                         >
                            <div className="flex items-center gap-4">
                               <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#1E293B] border border-inherit flex items-center justify-center text-[10px] font-black uppercase text-gray-400">
                                  {String.fromCharCode(65 + idx)}
                               </div>
                               <span className="text-sm font-bold">{opt.text}</span>
                            </div>
                            {isAnswering && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                            {isAnswering && isSelected && !isCorrect && <X className="w-5 h-5 text-rose-500" />}
                         </button>
                      );
                   })}
                </div>

                <AnimatePresence>
                   {showHint && currentQuestion.explanation && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 rounded-3xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex items-start gap-4"
                      >
                         <Lightbulb className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Delayed Hint Active</p>
                            <p className="text-xs font-bold text-blue-900 dark:text-blue-300 leading-relaxed">{currentQuestion.explanation}</p>
                         </div>
                      </motion.div>
                   )}
                </AnimatePresence>
             </div>
          </div>
        ) : (
          /* ── RESULTS SCREEN ── */
          <div className="bg-white dark:bg-[#1E293B] rounded-[40px] p-12 border border-gray-100 dark:border-slate-800 shadow-xl text-center space-y-10 animate-in fade-up duration-500">
             <div className="relative inline-block">
                <div className="w-32 h-32 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto border-4 border-amber-100 dark:border-amber-800 shadow-2xl">
                   <Trophy className="w-16 h-16 text-amber-500" />
                </div>
                <motion.div
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl shadow-lg border-4 border-white dark:border-[#1E293B]"
                >
                   <span className="text-xs font-black uppercase px-2">{Math.round((correctCount / pack.questions.length) * 100)}%</span>
                </motion.div>
             </div>

             <div className="space-y-2">
                <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                   {correctCount >= (pack.questions.length * 0.8) ? 'Challenge Conquered!' : 'Arena Defeated'}
                </h2>
                <p className="text-gray-500 font-bold uppercase tracking-widest">You earned <span className="text-[#1a73e8]">{gamifiedScore} total points</span></p>
             </div>

             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                   { label: 'Accuracy', val: `${Math.round((correctCount / pack.questions.length) * 100)}%`, icon: Award, c: 'text-emerald-500' },
                   { label: 'Avg Speed', val: `${(totalTimeSpent / pack.questions.length).toFixed(1)}s`, icon: Timer, c: 'text-blue-500' },
                   { label: 'Correct', val: correctCount, icon: CheckCircle2, c: 'text-purple-500' },
                   { label: 'Failed', val: pack.questions.length - correctCount, icon: X, c: 'text-rose-500' },
                ].map((stat, i) => (
                   <div key={i} className="bg-gray-50 dark:bg-[#0F172A] p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                      <stat.icon className={`w-4 h-4 mx-auto mb-2 ${stat.c}`} />
                      <p className="text-lg font-black dark:text-white leading-none">{stat.val}</p>
                      <p className="text-[9px] font-black uppercase text-gray-400 mt-1">{stat.label}</p>
                   </div>
                ))}
             </div>

             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={handleRetake}
                  className="w-full sm:w-auto px-10 py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-full text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                   <RotateCcw className="w-4 h-4" /> Re-Enter Arena
                </button>
                <button
                  onClick={() => router.push("/learning")}
                  className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white font-black rounded-full text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-blue-500/20"
                >
                   Next Mission
                </button>
             </div>
          </div>
        )}
      </div>
  );
}

export default function ModuleDetailPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-gray-500"><Loader2 className="animate-spin inline mr-2" /> Entering Arena...</div>}>
        <ModuleDetailContent />
      </Suspense>
    </AppShell>
  );
}
