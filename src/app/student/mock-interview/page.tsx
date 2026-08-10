"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import PreFlightLobby from "@/components/student/PreFlightLobby";
import InterviewRecorder from "@/components/student/InterviewRecorder";
import { useAuth } from "@/lib/auth/auth-context";
import { db, storage } from "@/lib/firebase/config";
import { doc, getDoc, getDocs, collection, query, where, limit, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { MockQuestionSet, MockQuestion, MockInterviewAttempt, MockInterviewAnswer } from "@/types/mock";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Step = 'loading' | 'lobby' | 'recording' | 'uploading' | 'completed';

export default function StudentMockInterviewPage() {
  const { userId, userProfile, user } = useAuth();
  const [step, setStep] = useState<Step>('loading');
  const [questionSet, setQuestionSet] = useState<MockQuestionSet | null>(null);
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (userId) fetchConfig();
  }, [userId]);

  const fetchConfig = async () => {
    try {
      // 1. Fetch smart question set (reusing the logic or keeping it local)
      const userSnap = await getDoc(doc(db, "Users", userId!));
      const assignedSetId = userSnap.exists() ? userSnap.data()?.assignedMockSetId : null;

      let targetSet: MockQuestionSet | null = null;
      if (assignedSetId) {
        const setSnap = await getDoc(doc(db, "mock_interview_sets", assignedSetId));
        if (setSnap.exists() && !setSnap.data().isArchived) {
          targetSet = { id: setSnap.id, ...setSnap.data() } as MockQuestionSet;
        }
      }

      if (!targetSet) {
        const q = query(collection(db, "mock_interview_sets"), where("isDefault", "==", true), where("isArchived", "==", false), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) targetSet = { id: snap.docs[0].id, ...snap.docs[0].data() } as MockQuestionSet;
      }

      if (targetSet) {
        setQuestionSet(targetSet);
        // Normalize questions to MockQuestion objects
        const normalized = targetSet.questions.map((q, idx) => {
          if (typeof q === 'string') {
            return { id: `q${idx}`, text: q, timeLimit: targetSet!.timePerQuestionSeconds || 60 };
          }
          return q as MockQuestion;
        });

        if (targetSet.isRandomized) {
          normalized.sort(() => Math.random() - 0.5);
        }
        setQuestions(normalized);
        setStep('lobby');
      } else {
        setStep('lobby'); // Will show empty state
      }
    } catch (err) {
      console.error("Config fetch error", err);
    }
  };

  const handleStartInterview = async (stream: MediaStream) => {
    if (!userId || !questionSet) return;
    setStep('loading');
    setActiveStream(stream);

    try {
      // STORAGE CLEANUP ENGINE (Retake Logic)
      const attemptId = `${userId}_${questionSet.id}`;
      const attemptRef = doc(db, 'mock_interview_attempts', attemptId);
      const attemptSnap = await getDoc(attemptRef);

      if (attemptSnap.exists()) {
        const data = attemptSnap.data() as MockInterviewAttempt;
        // Delete old video chunks to save space
        if (data.videoUrls && data.videoUrls.length > 0) {
          const deletePromises = data.videoUrls.map((url: string) => {
             try {
                return deleteObject(ref(storage, url));
             } catch (e) {
                console.warn("Delete failed", e);
                return Promise.resolve();
             }
          });
          await Promise.all(deletePromises);
        }
        // Reset doc
        await updateDoc(attemptRef, {
          videoUrls: [],
          answers: [],
          status: 'in_progress',
          updatedAt: serverTimestamp()
        });
      } else {
        // Initialize fresh doc
        await setDoc(attemptRef, {
          studentId: userId,
          studentName: userProfile?.displayName || user?.displayName || "Student",
          setId: questionSet.id,
          videoUrls: [],
          answers: [],
          status: 'in_progress',
          startedAt: serverTimestamp(),
          askedQuestions: questions.map(q => q.text)
        });
      }

      setStep('recording');
    } catch (error) {
      console.error("Failed to initialize interview", error);
      setStep('lobby');
    }
  };

  const handleFinishRecording = async (videoUrls: string[], answers: MockInterviewAnswer[]) => {
    if (!userId || !questionSet) return;
    setStep('uploading');

    try {
      const attemptId = `${userId}_${questionSet.id}`;
      const attemptRef = doc(db, 'mock_interview_attempts', attemptId);

      await updateDoc(attemptRef, {
        videoUrls,
        answers,
        status: 'pending_review',
        submittedAt: serverTimestamp(),
        timeTakenSeconds: 0 // Could calculate from start time
      });

      setStep('completed');
    } catch (err) {
      console.error("Failed to submit interview", err);
    }
  };

  return (
    <AppShell>
      <div className="py-8">
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
             <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
             <p className="text-sm font-black uppercase text-gray-500 tracking-widest">Preparing Arena...</p>
          </div>
        )}

        {step === 'lobby' && (
          <PreFlightLobby
            title={questionSet?.title || "Mock Interview"}
            duration={`${questions.length} Questions`}
            onStart={handleStartInterview}
          />
        )}

        {step === 'recording' && activeStream && (
          <InterviewRecorder
            stream={activeStream}
            questions={questions}
            studentId={userId!}
            mockId={questionSet?.id!}
            onFinish={handleFinishRecording}
          />
        )}

        {step === 'uploading' && (
          <div className="max-w-2xl mx-auto py-20 text-center space-y-8 animate-in zoom-in duration-500">
             <div className="w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto border-4 border-blue-100">
                <Loader2 className="animate-spin text-blue-500" size={48} />
             </div>
             <div className="space-y-2">
                <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter">Securing Session</h2>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Finalizing your video dossier and encrypting response data...</p>
             </div>
          </div>
        )}

        {step === 'completed' && (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-[40px] shadow-xl text-center space-y-8 max-w-2xl mx-auto border border-emerald-100 dark:border-emerald-900/30 animate-in zoom-in duration-500">
             <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-100">
                <CheckCircle2 size={48} className="text-emerald-500" />
             </div>
             <div className="space-y-2">
                <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Session Secured</h2>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs leading-relaxed">
                   Your live response has been archived. A counselor will review the footage and provide feedback shortly.
                </p>
             </div>
             <button onClick={() => router.push('/dashboard')} className="px-10 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95">
                Return to Dashboard
             </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
