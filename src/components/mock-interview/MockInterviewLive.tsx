"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { MockInterviewConfig, MockInterviewAttempt, QuestionTimestamp } from "@/types/mock";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import { uploadMockVideo } from "@/lib/firebase/storage-utils";
import { Loader2, Timer, Send, ChevronRight, Video, VideoOff, AlertCircle, CheckCircle2 } from "lucide-react";

export default function MockInterviewLive() {
  const { user, userId, userProfile } = useAuth();
  const { isRecording, startRecording, stopRecording, videoPreviewRef, recordedChunks } = useMediaRecorder();

  const [config, setConfig] = useState<MockInterviewConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timestamps, setTimestamps] = useState<QuestionTimestamp[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [uploading, setUploading] = useState(false);

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (userId) fetchConfig();
  }, [userId]);

  const fetchConfig = async () => {
    const overrideRef = doc(db, "Users", userId!, "overrides", "mock_interview");
    const overrideSnap = await getDoc(overrideRef);
    if (overrideSnap.exists()) {
      setConfig(overrideSnap.data() as MockInterviewConfig);
    } else {
      const defaultSnap = await getDoc(doc(db, "mock_interview_configs", "default"));
      if (defaultSnap.exists()) setConfig(defaultSnap.data() as MockInterviewConfig);
    }
    setLoading(false);
  };

  const handleStart = async () => {
    const success = await startRecording();
    if (success) {
      setStarted(true);
      startTimeRef.current = Date.now();
      setTimeLeft(config!.durationMinutes * 60);

      // Record first question timestamp
      setTimestamps([{ questionId: config!.questions[0].id, startTime: 0 }]);

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleFinish('timeout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleNext = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < config!.questions.length) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setTimestamps([...timestamps, { questionId: config!.questions[nextIdx].id, startTime: elapsed }]);
      setCurrentIdx(nextIdx);
    }
  };

  const handleFinish = async (status: 'completed' | 'timeout' = 'completed') => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopRecording();
    setFinished(true);
  };

  // Upload trigger when chunks are ready after stop
  useEffect(() => {
    if (finished && recordedChunks.length > 0 && !uploading) {
      uploadResults();
    }
  }, [finished, recordedChunks]);

  const uploadResults = async () => {
    setUploading(true);
    try {
      const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
      const videoUrl = await uploadMockVideo(userId!, videoBlob);

      const attempt: MockInterviewAttempt = {
        studentId: userId!,
        studentName: userProfile?.displayName || user?.displayName || "Student",
        answers: [], // We are relying on video
        questionTimestamps: timestamps,
        videoUrl,
        startedAt: serverTimestamp(),
        submittedAt: serverTimestamp(),
        timeTakenSeconds: (config!.durationMinutes * 60) - timeLeft,
        status: timeLeft <= 0 ? 'timeout' : 'completed'
      };

      await addDoc(collection(db, "mock_interview_attempts"), attempt);
      setUploading(false);
    } catch (e) {
      console.error("Upload error:", e);
      setUploading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" /></div>;

  if (finished) {
    return (
      <div className="bg-white dark:bg-slate-800 p-12 rounded-[40px] shadow-xl text-center space-y-8 max-w-2xl mx-auto border border-emerald-100 dark:border-emerald-900/30">
        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto">
          {uploading ? <Loader2 className="animate-spin text-blue-500" size={40} /> : <CheckCircle2 size={48} className="text-emerald-500" />}
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
            {uploading ? "Uploading Interview..." : "Interview Recorded"}
          </h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-sm leading-relaxed">
            {uploading ? "Please wait while we secure your video response." : "Your video session has been saved for counselor evaluation."}
          </p>
        </div>
        {!uploading && (
          <button onClick={() => window.location.href = '/dashboard'} className="px-10 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105">
            Return to Dashboard
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Video Preview Side */}
      <div className="bg-black rounded-[40px] overflow-hidden aspect-video relative shadow-2xl border-4 border-white dark:border-slate-800">
        <video ref={videoPreviewRef} autoPlay muted playsInline className="w-full h-full object-cover" />

        {!started && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-8 text-center space-y-6">
            <Video size={48} className="text-blue-400" />
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tighter">Ready to Begin?</h3>
              <p className="text-xs font-bold text-gray-300 max-w-xs mx-auto">We will record your webcam and audio. Ensure you are in a bright, quiet room.</p>
            </div>
            <button onClick={handleStart} className="px-8 py-3 bg-blue-600 rounded-full font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg">Start Recording</button>
          </div>
        )}

        {isRecording && (
          <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-full animate-pulse shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-widest">Live Recording</span>
          </div>
        )}
      </div>

      {/* Control Side */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 space-y-8 h-full flex flex-col">
          <div className="flex justify-between items-center border-b border-gray-50 dark:border-slate-700 pb-6">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500">
                 <Timer size={20} />
               </div>
               <div className="flex flex-col">
                 <span className="text-[10px] font-black uppercase text-gray-400">Timer</span>
                 <span className={`text-xl font-black ${timeLeft < 60 && started ? 'text-rose-500 animate-pulse' : 'dark:text-white'}`}>
                    {started ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}` : '--:--'}
                 </span>
               </div>
             </div>
             <div className="text-right">
                <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Question Progress</span>
                <p className="text-sm font-black dark:text-white">{started ? `${currentIdx + 1} of ${config?.questions.length}` : 'Waiting...'}</p>
             </div>
          </div>

          <div className="flex-1 space-y-4">
             {started ? (
               <AnimatePresence mode="wait">
                 <motion.div
                   key={currentIdx}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   className="space-y-4"
                 >
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight tracking-tight italic">
                      "{config?.questions[currentIdx].text}"
                    </h2>
                 </motion.div>
               </AnimatePresence>
             ) : (
               <div className="text-center py-10 opacity-30">
                  <VideoOff size={48} className="mx-auto mb-4" />
                  <p className="text-xs font-bold uppercase tracking-widest">Start recording to see questions</p>
               </div>
             )}
          </div>

          <div className="pt-6 border-t border-gray-50 dark:border-slate-700">
            {started && (
              currentIdx === config!.questions.length - 1 ? (
                <button onClick={() => handleFinish()} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                  <Send size={16} /> Finish & Submit Interview
                </button>
              ) : (
                <button onClick={handleNext} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                  Next Question <ChevronRight size={16} />
                </button>
              )
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-amber-700 dark:text-amber-400">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-[10px] font-bold leading-relaxed uppercase tracking-wider">No pausing or rewinding allowed. This simulates a real UKVI session.</p>
        </div>
      </div>
    </div>
  );
}
