"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/app-shell";
import PreFlightLobby from "@/components/student/PreFlightLobby";
import InterviewRecorder from "@/components/student/InterviewRecorder";
import { useAuth } from "@/lib/auth/auth-context";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, getDocs, collection, query, where, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { MockQuestionSet, MockQuestion, MockInterviewAttempt } from "@/types/mock";
import { Loader2, CheckCircle2, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// Firebase Storage Decommissioned - Retake cleanup logic disabled.
// TODO: Implement Google Drive file management for mock sessions.

type Step = 'loading' | 'lobby' | 'recording' | 'uploading' | 'completed';

export default function StudentMockInterviewPage() {
  const { userId, userProfile, user } = useAuth();
  const [step, setStep] = useState<Step>('loading');
  const [questionSet, setQuestionSet] = useState<MockQuestionSet | null>(null);
  const [availableSets, setAvailableSets] = useState<MockQuestionSet[]>([]);
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const router = useRouter();

  // ── HARDWARE SECURITY ENGINE ──
  // Ensures that whenever this page is left (navigation/refresh),
  // all media hardware is strictly released.
  useEffect(() => {
    const releaseHardware = () => {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log(`[Security] Force-released hardware: ${track.kind}`);
        });
        activeStreamRef.current = null;
      }
    };

    window.addEventListener('beforeunload', releaseHardware);

    return () => {
      releaseHardware();
      window.removeEventListener('beforeunload', releaseHardware);
    };
  }, []);

  useEffect(() => {
    if (userId) fetchConfig();
  }, [userId]);

  const fetchConfig = async (targetId?: string) => {
    try {
      // 1. Fetch All Active Question Sets
      // Logic: Allow students to see global defaults + their assigned set.
      const setsQuery = query(collection(db, "mock_interview_sets"), where("isArchived", "==", false));
      const setsSnap = await getDocs(setsQuery);
      const allSets = setsSnap.docs.map(d => ({ id: d.id, ...d.data() } as MockQuestionSet));
      setAvailableSets(allSets);

      // 2. Resolve target set (Force selection if targetId provided)
      const userSnap = await getDoc(doc(db, "Users", userId!));
      const profile = userSnap.data();
      const assignedSetId = targetId || profile?.assignedMockSetId;

      let targetSet: MockQuestionSet | null = null;
      if (assignedSetId) {
        targetSet = allSets.find(s => s.id === assignedSetId) || null;
      }

      if (!targetSet) {
        targetSet = allSets.find(s => s.isDefault) || allSets[0] || null;
      }

      if (targetSet) {
        setQuestionSet(targetSet);
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
        setStep('lobby');
      }
    } catch (err) {
      console.error("Config fetch error", err);
    }
  };

  const handleStartInterview = (stream: MediaStream) => {
    if (!userId || !questionSet) return;
    activeStreamRef.current = stream; // ── Sync Ref for global hardware control ──
    initializeAttempt();
  };

  const initializeAttempt = async () => {
    if (!questionSet) return;
    setStep('loading');
    try {
      // STORAGE CLEANUP ENGINE (Retake Logic)
      const attemptId = `${userId}_${questionSet.id}`;
      const attemptRef = doc(db, 'mock_interview_attempts', attemptId);
      const attemptSnap = await getDoc(attemptRef);

      if (attemptSnap.exists()) {
        // Reset doc - Binary cleanup bypassed due to Storage decommissioning
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
          askedQuestions: questions.map(q => q.text),
          counselorId: userProfile?.assignedCounselorId || ""
        });
      }

      setStep('recording');
    } catch (error) {
      console.error("Failed to initialize interview", error);
      setStep('lobby');
    }
  };

  return (
    <AppShell>
      <div className="py-8">
        <div className="max-w-2xl mx-auto mb-6">
           <Link href="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 transition-colors">
              <ChevronLeft size={16} /> Back to Dashboard
           </Link>
        </div>
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
             <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
             <p className="text-sm font-black uppercase text-gray-500 tracking-widest">Preparing Arena...</p>
          </div>
        )}

        {step === 'lobby' && (
          <div className="space-y-6">
            {/* ── INTERVIEW SET SELECTOR ── */}
            {availableSets.length > 1 && (
              <div className="max-w-2xl mx-auto flex items-center justify-between px-6 py-4 bg-white dark:bg-[#1E293B] rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm animate-in fade-in duration-500">
                <div className="flex flex-col">
                   <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest leading-none mb-1">Assessment Track</span>
                   <span className="text-xs font-bold dark:text-white uppercase tracking-tighter">Choose assigned question set</span>
                </div>
                <select
                  value={questionSet?.id || ""}
                  onChange={(e) => fetchConfig(e.target.value)}
                  className="bg-gray-50 dark:bg-[#0F172A] border-none rounded-xl px-4 py-2 text-xs font-black text-[#1a73e8] focus:ring-2 focus:ring-blue-500 min-w-[220px] dark:text-white outline-none"
                >
                  {availableSets.map(s => (
                    <option key={s.id} value={s.id}>{s.isDefault ? '⭐ ' : ''}{s.title}</option>
                  ))}
                </select>
              </div>
            )}

            <PreFlightLobby
              title={questionSet?.title || "Mock Interview"}
              duration={`${questions.length} Questions`}
              onStart={handleStartInterview}
              onStreamAcquired={(s) => { activeStreamRef.current = s; }}
            />
          </div>
        )}

        {step === 'recording' && activeStreamRef.current && (
          <InterviewRecorder
            stream={activeStreamRef.current}
            questions={questions}
            studentId={userId!}
            studentName={userProfile?.displayName || user?.displayName || "Student"}
            counselorId={userProfile?.assignedCounselorId}
            mockId={questionSet?.id!}
            onFinish={() => {
              setStep('completed');
              // STRICT RELEASE
              if (activeStreamRef.current) {
                activeStreamRef.current.getTracks().forEach(t => t.stop());
                activeStreamRef.current = null;
              }
            }}
            onRetake={() => {
              setStep('lobby');
              // STRICT RELEASE
              if (activeStreamRef.current) {
                activeStreamRef.current.getTracks().forEach(t => t.stop());
                activeStreamRef.current = null;
              }
            }}
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
