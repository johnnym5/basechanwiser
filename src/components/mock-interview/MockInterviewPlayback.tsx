"use client";

import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { MockInterviewAttempt } from "@/types/mock";
import { Loader2, PlayCircle, Clock, List, Calendar, User, UserCheck } from "lucide-react";

export default function MockInterviewPlayback({ attemptId }: { attemptId: string }) {
  const [attempt, setAttempt] = useState<MockInterviewAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (attemptId) fetchAttempt();
  }, [attemptId]);

  const fetchAttempt = async () => {
    const snap = await getDoc(doc(db, "mock_interview_attempts", attemptId));
    if (snap.exists()) {
      setAttempt({ id: snap.id, ...snap.data() } as MockInterviewAttempt);
    }
    setLoading(false);
  };

  const jumpTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  if (!attempt) return <div className="p-8 text-center text-gray-500">Attempt not found.</div>;

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-32">
      {/* Video Player Column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-black rounded-[40px] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 aspect-video">
          <video
            ref={videoRef}
            src={attempt.videoUrl}
            controls
            className="w-full h-full"
            playsInline
          />
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                <UserCheck size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">{attempt.studentName}</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                   <Calendar size={12} /> {attempt.submittedAt?.toDate().toLocaleDateString() || "Recently"}
                   <span className="mx-1">•</span>
                   <Clock size={12} /> {Math.floor(attempt.timeTakenSeconds / 60)}m {attempt.timeTakenSeconds % 60}s duration
                </p>
              </div>
           </div>
           <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${attempt.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
              {attempt.status}
           </span>
        </div>
      </div>

      {/* Question List Column */}
      <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col h-[calc(100vh-200px)] lg:sticky lg:top-8">
        <div className="p-8 border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex items-center gap-3">
          <List className="text-blue-500" size={20} />
          <h3 className="font-black dark:text-white uppercase tracking-tighter">Interview Segments</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {attempt.questionTimestamps.map((ts, idx) => (
            <button
              key={ts.questionId}
              onClick={() => jumpTo(ts.startTime)}
              className="w-full text-left p-6 rounded-3xl bg-gray-50 dark:bg-[#0F172A] border border-gray-100 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Question {idx + 1}</span>
                <span className="text-[10px] font-black text-gray-400 font-mono group-hover:text-blue-500 transition-colors">
                  {Math.floor(ts.startTime / 60)}:{(Math.floor(ts.startTime % 60)).toString().padStart(2, '0')}
                </span>
              </div>
              <p className="text-sm font-bold text-gray-700 dark:text-slate-300 leading-tight">
                {attempt.answers.find(a => a.questionId === ts.questionId)?.questionText || "Unknown Question"}
              </p>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-gray-400 group-hover:text-blue-500 transition-colors">
                <PlayCircle size={14} /> JUMP TO MOMENT
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
