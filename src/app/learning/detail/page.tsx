"use client";

import React, { useState, useEffect, Suspense } from "react";
import AppShell from "@/components/layout/app-shell";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { BookOpen, CheckCircle2, ArrowLeft, RotateCcw, Sparkles, Award, Timer, Trophy, ArrowRight, Loader2, Zap } from "lucide-react";
import { doc, getDoc, collection, getDocs, serverTimestamp, updateDoc, addDoc, query, where, limit, orderBy, deleteDoc } from "firebase/firestore";
import QuizExecution from "@/components/learning/QuizExecution";
import { AskedQuestion, TestQuestionSet } from "@/types/academy";
import { db } from "@/lib/firebase/config";
import { UserProfile } from "@/types";
import { Resource } from "@/types/resource";
import { logActivityAndNotify } from "@/lib/server/notifications";
import { showPushNotification } from "@/lib/client/push-notifications";

import { withTimeout } from "@/lib/utils/promise-timeout";

function ModuleDetailContent() {
  const searchParams = useSearchParams();
  const packId = searchParams.get("packId") || searchParams.get("id");
  const { user, userId, userProfile } = useAuth();
  const router = useRouter();

  const [pack, setPack] = useState<TestQuestionSet | null>(null);
  const [loading, setLoading] = useState(true);

  // Journey Phase - Start with 'learning' (resources) as per requirements
  const [phase, setPhase] = useState<'overview' | 'learning' | 'quiz'>('learning');

  // Stats for results screen
  const [correctCount, setCorrectCount] = useState(0);
  const [gamifiedScore, setGamifiedScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const renderAttachment = () => {
    if (!pack || !pack.attachmentUrl) return null;

    if (pack.attachmentType === 'pdf' || pack.attachmentType === 'word') {
      return (
        <div className="rounded-[32px] overflow-hidden border border-slate-800 shadow-2xl bg-white h-[600px]">
          <iframe
            src={pack.attachmentUrl}
            className="w-full h-full border-none"
            title="Resource Viewer"
            allow="autoplay"
          />
        </div>
      );
    }

    switch (pack.attachmentType) {
      case 'video':
        return (
          <div className="rounded-[32px] overflow-hidden border border-slate-800 bg-black shadow-2xl">
            <video src={pack.attachmentUrl} controls className="w-full max-h-[500px] object-contain" />
          </div>
        );
      case 'audio':
        return (
          <div className="p-8 rounded-[32px] bg-slate-900 border border-slate-800 shadow-xl flex flex-col items-center gap-4">
             <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500"><Zap /></div>
             <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Audio Briefing Transmission</p>
             <audio src={pack.attachmentUrl} controls className="w-full" />
          </div>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      try {
        const userSnap = await withTimeout(getDoc(doc(db, "Users", userId!)), 10000);
        const profile = userSnap.exists() ? userSnap.data() as UserProfile : null;

        let rawData: any = null;

        if (profile?.assignedTestSetId) {
          const setSnap = await withTimeout(getDoc(doc(db, "test_question_sets", profile.assignedTestSetId)), 10000);
          if (setSnap.exists()) rawData = setSnap.data();
        }

        if (!rawData) {
          const q = query(collection(db, "test_question_sets"), where("isDefault", "==", true), limit(1));
          const snap = await withTimeout(getDocs(q), 10000);
          if (!snap.empty) rawData = snap.docs[0].data();
        }

        if (isMounted && rawData) {
          setPack({ id: rawData.id || packId, ...rawData } as TestQuestionSet);
        }
      } catch (err) {
        console.warn("Fetch error in Detail page:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [packId, userId]);

  const handleQuizFinish = async (results: {
    askedQuestions: AskedQuestion[];
    studentAnswers: (number | null)[];
    correctCount: number;
    gamifiedScore: number;
    totalTimeSpent: number;
  }) => {
    setQuizFinished(true);
    setCorrectCount(results.correctCount);
    setGamifiedScore(results.gamifiedScore);

    if (!pack || !userId) return;

    const totalQuestions = results.askedQuestions.length;
    const scorePercentage = Math.round((results.correctCount / totalQuestions) * 100);
    const passed = scorePercentage >= 80;

    try {
      const attemptPayload = {
        userId: userId || "",
        studentId: userProfile?.studentId || "N/A",
        studentName: user?.displayName || "Student",
        setId: pack.id || "unknown",
        packTitle: pack.title || "Learning Test",
        askedQuestions: results.askedQuestions,
        studentAnswers: results.studentAnswers,
        scorePercentage: scorePercentage || 0,
        gamifiedScore: results.gamifiedScore || 0,
        correctCount: results.correctCount || 0,
        totalQuestions: totalQuestions || 10,
        passed: !!passed,
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        status: 'pending'
      };

      await addDoc(collection(db, "quiz_attempts"), attemptPayload);

      // 1.5 Rolling History Cap: Delete oldest if > 10
      const historyQ = query(
        collection(db, "quiz_attempts"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const historySnap = await getDocs(historyQ);
      if (historySnap.size > 10) {
        const toDelete = historySnap.docs.slice(10);
        const deletePromises = toDelete.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
        console.log(`[RollingHistory] Purged ${toDelete.length} old attempts.`);
      }

      if (passed) {
        const userRef = doc(db, "Users", userId);
        const uSnap = await getDoc(userRef);
        if (uSnap.exists()) {
          const uData = uSnap.data() as UserProfile;

          let updatePayload: any = {
            gamifiedScore: (uData.gamifiedScore || 0) + results.gamifiedScore,
            updatedAt: serverTimestamp(),
          };

          // Linear Progression Logic: Unlock next module if this one is the current level
          if (pack.category === 'core' && pack.orderIndex) {
            const currentLvl = uData.currentModuleLevel || 1;
            if (currentLvl === pack.orderIndex) {
              updatePayload.currentModuleLevel = currentLvl + 1;
            }
          }

          await updateDoc(userRef, updatePayload);

          // 3. Log Activity & Notify Counselor
          await logActivityAndNotify({
            studentId: userId,
            studentName: user?.displayName || "Student",
            counselorId: userProfile?.assignedCounselorId || "",
            type: 'ACADEMY_MODULE',
            message: `successfully completed ${pack.title} with a score of ${scorePercentage}%.`,
            link: `/counselor/students/portfolio?id=${userId}`
          });
        }
      }
    } catch (err) {
      console.error("Failed to save quiz history:", err);
    }
  };

  if (loading || !pack) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-sm font-black uppercase text-gray-500 tracking-widest text-center">Entering Arena...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
             <button onClick={() => router.push("/learning")} className="text-[10px] font-black uppercase text-blue-500 flex items-center gap-1 hover:underline mb-2">
                <ArrowLeft className="w-3 h-3" /> Back to modules
             </button>
             <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{pack.title}</h1>
             <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Master this set to earn rewards</p>
          </div>
          <div className="flex items-center gap-2">
             <div className="px-4 py-2 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black text-amber-600 uppercase">{gamifiedScore} PTS</span>
             </div>
          </div>
        </div>

        {phase === 'overview' && !quizFinished ? (
          <div className="bg-white dark:bg-slate-800 rounded-[40px] p-12 border border-gray-100 dark:border-slate-700 shadow-xl text-center space-y-8 animate-in fade-up duration-500">
             <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-12 h-12 text-blue-500" />
             </div>
             <div className="space-y-2">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Test Arena</h2>
                <p className="text-sm text-gray-500 font-bold max-w-sm mx-auto leading-relaxed uppercase tracking-widest">
                   Each question has a strict 15s timer. Be fast, be accurate.
                </p>
             </div>

             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setPhase('learning')}
                  className="px-12 py-5 bg-indigo-600 text-white font-black rounded-full text-sm uppercase tracking-widest shadow-2xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Review Resources <BookOpen className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPhase('quiz')}
                  className="px-12 py-5 bg-blue-600 text-white font-black rounded-full text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    Take Assessments <ArrowRight className="w-5 h-5" />
                </button>
             </div>
          </div>
        ) : phase === 'learning' && !quizFinished ? (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="bg-white dark:bg-slate-800 rounded-[40px] p-10 border border-gray-100 dark:border-slate-700 shadow-xl space-y-8">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Mission Briefing</h2>

                <div className="space-y-6">
                   {/* ── ATTACHMENT PLAYER ── */}
                   {renderAttachment()}

                   {pack.learningContent ? (
                      <div
                        className="prose prose-invert max-w-none dark:text-slate-300"
                        dangerouslySetInnerHTML={{ __html: pack.learningContent }}
                      />
                   ) : (
                     pack.learningResources?.map((res, idx) => (
                        <div key={idx} className="space-y-2">
                           <h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400">{res.heading}</h3>
                           <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{res.content}</p>
                        </div>
                     ))
                   )}
                </div>

                <button
                 onClick={() => setPhase('quiz')}
                 className="w-full py-5 bg-[#1a73e8] text-white font-black rounded-full text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                   Finish Review & Start 15-Second Drills <ArrowRight className="w-5 h-5" />
                </button>
             </div>
          </div>
        ) : phase === 'quiz' && !quizFinished ? (
          <QuizExecution
            testSet={pack}
            onFinish={handleQuizFinish}
          />
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-[40px] p-12 border border-gray-100 dark:border-slate-700 shadow-xl text-center space-y-10 animate-in fade-up duration-500">
             <div className="relative inline-block">
                <div className="w-32 h-32 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto border-4 border-amber-100 dark:border-amber-800 shadow-2xl">
                   <Trophy className="w-16 h-16 text-amber-500" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl shadow-lg border-4 border-white dark:border-slate-800">
                   <span className="text-xs font-black uppercase px-2">{Math.round((correctCount / 10) * 100)}%</span>
                </div>
             </div>

             <div className="space-y-2">
                <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                   Session Complete
                </h2>
                <p className="text-gray-500 font-bold uppercase tracking-widest">You secured <span className="text-blue-600">{gamifiedScore} total points</span></p>
             </div>

             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                   { label: 'Accuracy', val: `${correctCount}/10`, icon: Award, c: 'text-emerald-500' },
                   { label: 'Points', val: gamifiedScore, icon: Zap, c: 'text-purple-500' },
                   { label: 'Status', val: (correctCount / 10) >= 0.8 ? 'PASSED' : 'RETRY', icon: CheckCircle2, c: 'text-emerald-500' },
                ].map((stat, i) => (
                   <div key={i} className="bg-gray-50 dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-700">
                      <stat.icon className={`w-4 h-4 mx-auto mb-2 ${stat.c}`} />
                      <p className="text-lg font-black dark:text-white leading-none">{stat.val}</p>
                      <p className="text-[9px] font-black uppercase text-gray-400 mt-1">{stat.label}</p>
                   </div>
                ))}
             </div>

             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => {
                    setQuizFinished(false);
                    setPhase('quiz');
                    setCorrectCount(0);
                    setGamifiedScore(0);
                  }}
                  className="w-full sm:w-auto px-10 py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-full text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                   <RotateCcw className="w-4 h-4" /> Re-Enter Arena
                </button>
                <button
                  onClick={() => router.push("/learning")}
                  className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white font-black rounded-full text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-blue-500/20"
                >
                   Return to Modules
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
      <Suspense fallback={<div className="p-8 text-center text-gray-500"><Loader2 className="animate-spin inline mr-2" /> Loading...</div>}>
        <ModuleDetailContent />
      </Suspense>
    </AppShell>
  );
}
