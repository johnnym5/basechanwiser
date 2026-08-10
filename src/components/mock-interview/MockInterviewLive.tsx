"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useSettings } from "@/context/SettingsContext";
import { db } from "@/lib/firebase/config";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  where,
  limit
} from "firebase/firestore";
import { MockQuestionSet, MockInterviewAttempt, QuestionTimestamp } from "@/types/mock";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import LiveCallArena from "./LiveCallArena";
import { uploadMockVideo } from "@/lib/firebase/storage-utils";
import {
  Loader2,
  Timer,
  Send,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Camera
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Fisher-Yates Shuffle Utility
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function MockInterviewLive() {
  const { user, userId, userProfile } = useAuth();
  const { userPreferences } = useSettings();
  const { stream, volume, getPermissions, startRecording, stopRecording, videoPreviewRef, recordedChunks } = useMediaRecorder();

  const [questionSet, setQuestionSet] = useState<MockQuestionSet | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<'setup' | 'interview' | 'uploading' | 'finished'>('setup');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timestamps, setTimestamps] = useState<QuestionTimestamp[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (userId) fetchConfig();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [userId]);

  /**
   * Smart Fetching Logic:
   * 1. Check if the logged-in student has an assignedMockSetId in their user profile document.
   * 2. If present and valid (and non-archived), fetch that specific MockQuestionSet.
   * 3. If not, fallback to querying `mock_interview_sets` where `isDefault == true` (and not archived).
   * 4. Fallback to any active set if no default exists.
   */
  const fetchConfig = async () => {
    try {
      let targetSet: MockQuestionSet | null = null;

      // Step 1: Check student user profile for assigned set
      const userSnap = await getDoc(doc(db, "Users", userId!));
      const assignedSetId = userSnap.exists() ? userSnap.data()?.assignedMockSetId : null;

      if (assignedSetId) {
        const assignedSetSnap = await getDoc(doc(db, "mock_interview_sets", assignedSetId));
        if (assignedSetSnap.exists() && !assignedSetSnap.data().isArchived) {
          targetSet = { id: assignedSetSnap.id, ...assignedSetSnap.data() } as MockQuestionSet;
        }
      }

      // Step 2: Fallback to global default non-archived set
      if (!targetSet) {
        const defaultQuery = query(
          collection(db, "mock_interview_sets"),
          where("isDefault", "==", true),
          where("isArchived", "==", false),
          limit(1)
        );
        const defaultSnap = await getDocs(defaultQuery);
        if (!defaultSnap.empty) {
          targetSet = { id: defaultSnap.docs[0].id, ...defaultSnap.docs[0].data() } as MockQuestionSet;
        }
      }

      // Step 3: Fallback to any non-archived set if no default is found
      if (!targetSet) {
        const anyActiveQuery = query(
          collection(db, "mock_interview_sets"),
          where("isArchived", "==", false),
          limit(1)
        );
        const anySnap = await getDocs(anyActiveQuery);
        if (!anySnap.empty) {
          targetSet = { id: anySnap.docs[0].id, ...anySnap.docs[0].data() } as MockQuestionSet;
        }
      }

      setQuestionSet(targetSet);
    } catch (e) {
      console.error("Config fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissions = async () => {
    const stream = await getPermissions();
    if (!stream) {
      setPermissionError("Camera and Microphone access are required to proceed with the mock interview.");
    } else {
      setPermissionError(null);
    }
  };

  const startInterview = async () => {
    if (!questionSet) return;

    setPhase('interview');
    setCountdown(3);

    const countInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(countInterval);
          beginRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const beginRecording = async () => {
    const success = await startRecording({ lowBandwidth: userPreferences?.lowBandwidthMode });
    if (success) {
      // Initialization & Randomization: Shuffle questions ONCE at start if set has isRandomized: true
      let finalQuestions = [...questionSet!.questions];
      if (questionSet!.isRandomized) {
        finalQuestions = shuffleArray(finalQuestions);
      }
      // Store exact randomized order presented to student
      setQuestions(finalQuestions);

      startTimeRef.current = Date.now();

      // Initial Timer set to per-question limit
      startQuestionTimer(questionSet!.timePerQuestionSeconds);

      // Record first question timestamp
      setTimestamps([{ questionId: 'q1', startTime: 0 }]);
    } else {
      setPermissionError("Failed to start recording. Please check your hardware.");
      setPhase('setup');
    }
  };

  const startQuestionTimer = (seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(seconds);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          autoAdvance();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const autoAdvance = () => {
    if (isFinalizing) return;
    handleNext();
  };

  const handleNext = () => {
    if (isFinalizing) return;

    const nextIdx = currentIdx + 1;
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const newTimestamp: QuestionTimestamp = { questionId: `q${nextIdx + 1}`, startTime: elapsed };

    if (nextIdx < questions.length) {
      setTimestamps(prev => [...prev, newTimestamp]);
      setCurrentIdx(nextIdx);
      startQuestionTimer(questionSet!.timePerQuestionSeconds);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    if (isFinalizing) return;
    setIsFinalizing(true);

    if (timerRef.current) clearInterval(timerRef.current);
    stopRecording();
    setPhase('uploading');
  };

  // Upload trigger when chunks are ready after stopRecording
  useEffect(() => {
    if (phase === 'uploading' && recordedChunks.length > 0) {
      uploadResults();
    }
  }, [phase, recordedChunks]);

  /**
   * Finish & Submit Payload Update:
   * Uploads video blob and creates Firestore attempt record containing:
   * - `setId`: ID of the QuestionSet used.
   * - `askedQuestions`: The exact randomized array of questions shown to the student.
   */
  const uploadResults = async () => {
    try {
      const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
      const videoUrl = await uploadMockVideo(userId!, videoBlob);

      const attempt: MockInterviewAttempt = {
        studentId: userId!,
        studentName: userProfile?.displayName || user?.displayName || "Student",
        answers: questions.map((q, idx) => ({ questionId: `q${idx + 1}`, questionText: q })),
        questionTimestamps: timestamps,
        videoUrl,
        startedAt: serverTimestamp(),
        submittedAt: serverTimestamp(),
        timeTakenSeconds: (Date.now() - startTimeRef.current) / 1000,
        status: 'pending_review',
        setId: questionSet?.id || "default",
        askedQuestions: questions // Immutable exact array presented to student
      };

      await addDoc(collection(db, "mock_interview_attempts"), attempt);
      setPhase('finished');
    } catch (e) {
      console.error("Upload error:", e);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" /></div>;

  if (phase === 'uploading') {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-8 animate-in zoom-in duration-500">
        <div className="w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto border-4 border-blue-100 dark:border-blue-900/30">
          <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter">Securing Dossier</h2>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Uploading video response to encrypted cloud storage...</p>
        </div>
      </div>
    );
  }

  if (phase === 'finished') {
    return (
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
        <button onClick={() => window.location.href = '/dashboard'} className="px-10 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95">
          Return to Mission Control
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  return (
    <LiveCallArena
      phase={phase === 'setup' ? 'setup' : 'interview'}
      stream={stream}
      videoRef={videoPreviewRef}
      timeLeft={timeLeft}
      currentIdx={currentIdx}
      totalQuestions={questions.length || questionSet?.questions.length || 0}
      currentQuestion={currentQ || (questionSet?.questions[0] || "Loading...")}
      isRecording={phase === 'interview' && countdown === null}
      isFinalizing={isFinalizing}
      volume={volume}
      permissionError={permissionError}
      onPermissions={handlePermissions}
      onStart={startInterview}
      onNext={handleNext}
      onFinish={handleFinish}
      onRestart={() => window.location.reload()}
      countdown={countdown}
      questionSetTitle={questionSet?.title}
      timePerQuestion={questionSet?.timePerQuestionSeconds}
    />
  );
}
