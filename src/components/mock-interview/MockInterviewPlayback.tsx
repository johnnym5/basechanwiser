"use client";

import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { MockInterviewAttempt } from "@/types/mock";
import { Loader2, PlayCircle, Clock, List, Calendar, UserCheck, Video } from "lucide-react";

interface MockInterviewPlaybackProps {
  attemptId: string;
}

export default function MockInterviewPlayback({ attemptId }: MockInterviewPlaybackProps) {
  const [attempt, setAttempt] = useState<MockInterviewAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (attemptId) fetchAttempt();
  }, [attemptId]);

  /**
   * Data Source Binding:
   * Reads the MockInterviewAttempt document directly from Firestore.
   * Uses attempt.askedQuestions (the exact array of questions presented to the student).
   */
  const fetchAttempt = async () => {
    try {
      const snap = await getDoc(doc(db, "mock_interview_attempts", attemptId));
      if (snap.exists()) {
        setAttempt({ id: snap.id, ...snap.data() } as MockInterviewAttempt);
      }
    } catch (e) {
      console.error("Error fetching attempt for playback:", e);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clickable Timestamp Seeking Handler:
   * Performs robust null check on videoRef.current, sets currentTime to target startTime,
   * and starts video playback immediately.
   */
  const jumpToTimestamp = (seconds: number, idx: number) => {
    setActiveQuestionIdx(idx);
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(err => {
        console.warn("Autoplay playback error upon timestamp seek:", err);
      });
    }
  };

  /**
   * Helper function to format raw seconds into clean MM:SS format
   */
  const formatMMSS = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!attempt) {
    return <div className="p-8 text-center text-gray-500 font-bold">Interview attempt recording not found.</div>;
  }

  /**
   * Resolve Question List for Playback:
   * 1. Primary source: attempt.askedQuestions (exact saved randomized array)
   * 2. Fallback: attempt.answers map for legacy recordings
   */
  const questionList: string[] = attempt.askedQuestions && attempt.askedQuestions.length > 0
    ? attempt.askedQuestions
    : attempt.answers?.map(a => a.questionText) || [];

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-32">
      {/* Video Player Main View */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-black rounded-[40px] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 aspect-video relative group">
          <video
            ref={videoRef}
            src={attempt.videoUrl}
            controls
            className="w-full h-full object-cover"
            playsInline
          />
        </div>

        {/* Attempt Metadata Header */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
              <UserCheck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">{attempt.studentName}</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mt-0.5">
                <Calendar size={12} /> {attempt.submittedAt?.toDate ? attempt.submittedAt.toDate().toLocaleDateString() : "Recorded Session"}
                <span className="mx-1">•</span>
                <Clock size={12} /> {formatMMSS(attempt.timeTakenSeconds || 0)} Total Duration
              </p>
            </div>
          </div>

          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
            attempt.status === 'completed'
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
              : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400'
          }`}>
            {attempt.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Side-by-Side Asked Questions List with Clickable Timestamps */}
      <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col h-[calc(100vh-200px)] lg:sticky lg:top-8">
        <div className="p-8 border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <List className="text-blue-500" size={20} />
            <h3 className="font-black dark:text-white uppercase tracking-tighter">Asked Questions & Timestamps</h3>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            {questionList.length} Questions
          </span>
        </div>

        {/* Scrollable Question Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {questionList.map((questionText, idx) => {
            // Correlate question with saved timestamps array
            const timestampObj = attempt.questionTimestamps?.[idx];
            const startTime = timestampObj?.startTime ?? 0;
            const formattedTime = formatMMSS(startTime);
            const isActive = activeQuestionIdx === idx;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => jumpToTimestamp(startTime, idx)}
                className={`w-full text-left p-6 rounded-3xl transition-all cursor-pointer border group ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500/80 shadow-sm"
                    : "bg-gray-50 dark:bg-[#0F172A] border-gray-100 dark:border-slate-800 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-700/60"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? "text-blue-600 dark:text-blue-400" : "text-blue-500 group-hover:text-blue-300"}`}>
                    Question #{idx + 1}
                  </span>
                  {/* Clean MM:SS formatted timestamp */}
                  <span className="text-[10px] font-black font-mono px-2.5 py-1 bg-white dark:bg-slate-900 rounded-full border border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-300 group-hover:border-blue-400">
                    ⏱ {formattedTime}
                  </span>
                </div>

                <p className="text-sm font-bold text-gray-800 dark:text-slate-200 leading-snug group-hover:text-white">
                  "{questionText}"
                </p>

                <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-gray-400 group-hover:text-blue-300 transition-colors">
                  <PlayCircle size={14} /> JUMP TO {formattedTime}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
