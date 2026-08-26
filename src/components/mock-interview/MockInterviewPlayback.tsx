"use client";

import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { MockInterviewAttempt, MockInterviewAnswer } from "@/types/mock";
import {
  Loader2,
  PlayCircle,
  Clock,
  List,
  Calendar,
  UserCheck,
  Video,
  ThumbsUp,
  ThumbsDown,
  Save,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface MockInterviewPlaybackProps {
  attemptId: string;
}

export default function MockInterviewPlayback({ attemptId }: MockInterviewPlaybackProps) {
  const [attempt, setAttempt] = useState<MockInterviewAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // Local edits for feedback & ratings
  const [localAnswers, setLocalAnswers] = useState<MockInterviewAnswer[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (attemptId) fetchAttempt();
  }, [attemptId]);

  const fetchAttempt = async () => {
    try {
      const snap = await getDoc(doc(db, "mock_interview_attempts", attemptId));
      if (snap.exists()) {
        const data = snap.data() as MockInterviewAttempt;
        setAttempt({ id: snap.id, ...data });
        setLocalAnswers(data.answers || []);
        setActiveQuestionIdx(0);
      }
    } catch (e) {
      console.error("Error fetching attempt for playback:", e);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update local state for sectional review
   */
  const updateSectionReview = (idx: number, updates: Partial<MockInterviewAnswer>) => {
    const updated = [...localAnswers];
    updated[idx] = { ...updated[idx], ...updates };
    setLocalAnswers(updated);
  };

  /**
   * Commit all sectional reviews to Firestore
   */
  const handleSaveAllReviews = async () => {
    if (!attempt?.id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "mock_interview_attempts", attempt.id), {
        answers: localAnswers,
        status: 'completed', // Mark as fully reviewed if desired, or keep as is
        updatedAt: serverTimestamp()
      });
      alert("Sectional reviews archived successfully!");
      fetchAttempt();
    } catch (e) {
      console.error(e);
      alert("Failed to sync reviews.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Playback Handler:
   * Supports both legacy single-video seeking and new per-question chunk loading.
   */
  const handleSelection = (idx: number) => {
    setActiveQuestionIdx(idx);

    // If it's legacy mode (single video), we seek to the specific timestamp
    if (attempt && !attempt.videoUrls?.length && attempt.videoUrl) {
      const timestampObj = attempt.questionTimestamps?.[idx];
      const startTime = timestampObj?.startTime ?? 0;
      if (videoRef.current) {
        videoRef.current.currentTime = startTime;
        videoRef.current.play().catch(() => {});
      }
    }
  };

  /**
   * Helper function to format raw seconds into clean MM:SS format
   */
  const formatMMSS = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return "00:00";
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

  const isChunked = attempt.videoUrls && attempt.videoUrls.length > 0;

  // Resolve which video URL to play
  const currentVideoUrl = isChunked
    ? (attempt.answers[activeQuestionIdx]?.videoUrl || attempt.videoUrls[activeQuestionIdx])
    : attempt.videoUrl;

  const questionList = attempt.askedQuestions && attempt.askedQuestions.length > 0
    ? attempt.askedQuestions
    : attempt.answers?.map(a => a.questionText) || [];

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-32">
      {/* Video Player Main View */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-black rounded-[40px] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 aspect-video relative group">
          <video
            key={currentVideoUrl} // Force re-render/reload when URL changes (chunks)
            ref={videoRef}
            src={currentVideoUrl}
            controls
            autoPlay={isChunked} // Auto-play when switching chunks
            className="w-full h-full object-cover"
            playsInline
          />
          {!currentVideoUrl && (
             <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-white flex-col gap-4">
                <Video size={48} className="text-gray-600 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Media Segment Unavailable</p>
             </div>
          )}
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
                <Clock size={12} /> {isChunked ? "PER-QUESTION SEGMENTS" : `${formatMMSS(attempt.timeTakenSeconds || 0)} TOTAL DURATION`}
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

        {/* ── SECTIONAL FEEDBACK PANEL ── */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex justify-between items-center">
              <div className="space-y-1">
                 <h3 className="text-sm font-black uppercase tracking-widest text-blue-500">Sectional Performance Audit</h3>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Question #{activeQuestionIdx + 1}</p>
              </div>

              <div className="flex gap-2">
                 <button
                   onClick={() => updateSectionReview(activeQuestionIdx, { rating: 'good' })}
                   className={`p-3 rounded-2xl border-2 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                     localAnswers[activeQuestionIdx]?.rating === 'good'
                       ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                       : 'bg-transparent border-gray-100 dark:border-slate-700 text-gray-400 hover:border-emerald-500/50'
                   }`}
                 >
                    <ThumbsUp size={16} /> PASS
                 </button>
                 <button
                   onClick={() => updateSectionReview(activeQuestionIdx, { rating: 'bad' })}
                   className={`p-3 rounded-2xl border-2 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                     localAnswers[activeQuestionIdx]?.rating === 'bad'
                       ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/30'
                       : 'bg-transparent border-gray-100 dark:border-slate-700 text-gray-400 hover:border-rose-500/50'
                   }`}
                 >
                    <ThumbsDown size={16} /> FAIL
                 </button>
              </div>
           </div>

           <textarea
             value={localAnswers[activeQuestionIdx]?.feedback || ""}
             onChange={(e) => updateSectionReview(activeQuestionIdx, { feedback: e.target.value })}
             placeholder="Enter specific counselor observations for this answer segment..."
             className="w-full bg-gray-50 dark:bg-[#0F172A] border-none rounded-[32px] p-6 text-sm font-medium leading-relaxed dark:text-slate-200 focus:ring-2 focus:ring-blue-500 min-h-[120px] transition-all"
           />

           <div className="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-slate-700">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                 <AlertCircle size={14} className="text-amber-500" /> Changes are stored locally until committed.
              </p>
              <button
                onClick={handleSaveAllReviews}
                disabled={saving}
                className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                 {saving ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                 Commit Full Audit
              </button>
           </div>
        </div>
      </div>

      {/* Side-by-Side Asked Questions List */}
      <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col h-[calc(100vh-200px)] lg:sticky lg:top-8">
        <div className="p-8 border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <List className="text-blue-500" size={20} />
            <h3 className="font-black dark:text-white uppercase tracking-tighter">Asked Questions & Segments</h3>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            {questionList.length} Questions
          </span>
        </div>

        {/* Scrollable Question Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {questionList.map((questionText, idx) => {
            const isActive = activeQuestionIdx === idx;
            const rating = localAnswers[idx]?.rating;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelection(idx)}
                className={`w-full text-left p-6 rounded-3xl transition-all cursor-pointer border group relative ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500/80 shadow-sm"
                    : "bg-gray-50 dark:bg-[#0F172A] border-gray-100 dark:border-slate-800 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-700/60"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? "text-blue-600 dark:text-blue-400" : "text-blue-500 group-hover:text-blue-300"}`}>
                    Question #{idx + 1}
                  </span>

                  <div className="flex gap-2">
                     {rating === 'good' && <ThumbsUp size={14} className="text-emerald-500" />}
                     {rating === 'bad' && <ThumbsDown size={14} className="text-rose-500" />}
                     {!isChunked && attempt.questionTimestamps?.[idx] && (
                        <span className="text-[10px] font-black font-mono px-2.5 py-1 bg-white dark:bg-slate-900 rounded-full border border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-300 group-hover:border-blue-400">
                           ⏱ {formatMMSS(attempt.questionTimestamps[idx].startTime)}
                        </span>
                     )}
                  </div>
                </div>

                <p className="text-sm font-bold text-gray-800 dark:text-slate-200 leading-snug group-hover:text-white">
                  "{questionText}"
                </p>

                <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-gray-400 group-hover:text-blue-300 transition-colors uppercase tracking-widest">
                  {isChunked ? (
                    <><Video size={14} /> Play Segment</>
                  ) : (
                    <><PlayCircle size={14} /> Jump to Timestamp</>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
