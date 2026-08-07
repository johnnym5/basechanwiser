"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useSettings } from "@/context/SettingsContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { MockInterviewConfig, MockInterviewAttempt, QuestionTimestamp } from "@/types/mock";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import { uploadMockVideo } from "@/lib/firebase/storage-utils";
import { Loader2, Timer, Send, ChevronRight, Video, VideoOff, AlertCircle, CheckCircle2, ShieldCheck, Camera, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MockInterviewLive() {
  const { user, userId, userProfile } = useAuth();
  const { userPreferences } = useSettings();
  const { isRecording, startRecording, stopRecording, videoPreviewRef, recordedChunks } = useMediaRecorder();

  const [config, setConfig] = useState<MockInterviewConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<'setup' | 'interview' | 'uploading' | 'finished'>('setup');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timestamps, setTimestamps] = useState<QuestionTimestamp[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);

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

  const handlePermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      setPermissionError(null);
    } catch (err) {
      setPermissionError("Camera and Microphone access are required to proceed with the mock interview.");
    }
  };

  const startInterview = async () => {
    const success = await startRecording({ lowBandwidth: userPreferences?.lowBandwidthMode });
    if (success) {
      setPhase('interview');
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
    } else {
      setPermissionError("Failed to start recording. Please check your hardware.");
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
    setPhase('uploading');
  };

  // Upload trigger when chunks are ready after stop
  useEffect(() => {
    if (phase === 'uploading' && recordedChunks.length > 0) {
      uploadResults();
    }
  }, [phase, recordedChunks]);

  const uploadResults = async () => {
    try {
      const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
      const videoUrl = await uploadMockVideo(userId!, videoBlob);

      const attempt: MockInterviewAttempt = {
        studentId: userId!,
        studentName: userProfile?.displayName || user?.displayName || "Student",
        answers: [],
        questionTimestamps: timestamps,
        videoUrl,
        startedAt: serverTimestamp(),
        submittedAt: serverTimestamp(),
        timeTakenSeconds: (config!.durationMinutes * 60) - timeLeft,
        status: 'pending_review'
      };

      await addDoc(collection(db, "mock_interview_attempts"), attempt);
      setPhase('finished');
    } catch (e) {
      console.error("Upload error:", e);
      setPhase('interview'); // Allow retry? Or show error
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" /></div>;

  if (phase === 'setup') {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-up duration-500">
         <div className="bg-white dark:bg-slate-800 rounded-[40px] p-10 shadow-sm border border-gray-100 dark:border-slate-700 text-center space-y-8">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
               <ShieldCheck size={40} className="text-blue-500" />
            </div>
            <div className="space-y-2">
               <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Setup & Permissions</h2>
               <p className="text-sm font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                 Secure your environment. We need to verify your hardware before entering the arena.
               </p>
            </div>

            <div className="bg-black rounded-3xl overflow-hidden aspect-video relative group">
               <video ref={videoPreviewRef} autoPlay muted playsInline className="w-full h-full object-cover" />
               {!videoPreviewRef.current?.srcObject && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-4">
                     <button onClick={handlePermissions} className="p-6 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all">
                        <Camera size={32} />
                     </button>
                     <p className="text-[10px] font-black uppercase tracking-widest">Click to enable camera preview</p>
                  </div>
               )}
            </div>

            {permissionError && (
               <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 text-xs font-bold flex items-center gap-3">
                  <AlertCircle size={18} /> {permissionError}
               </div>
            )}

            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center"><Mic size={16} /></div>
                  <span className="text-[10px] font-black uppercase dark:text-slate-300">Microphone Ready</span>
               </div>
               <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center"><Camera size={16} /></div>
                  <span className="text-[10px] font-black uppercase dark:text-slate-300">Camera Active</span>
               </div>
            </div>

            <button
              onClick={startInterview}
              disabled={!!permissionError}
              className="w-full py-5 bg-[#1a73e8] text-white font-black rounded-full text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Start Official Mock Interview
            </button>
         </div>
      </div>
    );
  }

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
        <button onClick={() => window.location.href = '/dashboard'} className="px-10 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95">
          Return to Mission Control
        </button>
      </div>
    );
  }

  const currentQ = config!.questions[currentIdx];

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Muted Live Video View */}
      <div className="bg-black rounded-[40px] overflow-hidden aspect-video relative shadow-2xl border-4 border-white dark:border-slate-800">
        <video ref={videoPreviewRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-full animate-pulse shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full" />
          <span className="text-[10px] font-black uppercase tracking-widest">Recording Active</span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 space-y-8 h-full flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center border-b border-gray-50 dark:border-slate-700 pb-6">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500">
                 <Timer size={20} />
               </div>
               <div className="flex flex-col">
                 <span className="text-[10px] font-black uppercase text-gray-400">Time Remaining</span>
                 <span className={`text-xl font-black ${timeLeft < 60 ? 'text-rose-500 animate-pulse' : 'dark:text-white'}`}>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                 </span>
               </div>
             </div>
             <div className="text-right">
                <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Question Progress</span>
                <p className="text-sm font-black dark:text-white">{currentIdx + 1} of {config?.questions.length}</p>
             </div>
          </div>

          <div className="flex-1 space-y-4 pt-4">
             <AnimatePresence mode="wait">
               <motion.div
                 key={currentIdx}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 className="space-y-6"
               >
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Direct Question</p>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight tracking-tight italic">
                    "{config?.questions[currentIdx].text}"
                  </h2>
                  <p className="text-xs font-bold text-gray-400 leading-relaxed uppercase">Provide your response clearly into the camera. Do not look away.</p>
               </motion.div>
             </AnimatePresence>
          </div>

          <div className="pt-6 border-t border-gray-50 dark:border-slate-700">
            {currentIdx === config!.questions.length - 1 ? (
              <button onClick={() => handleFinish()} className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                <Send size={18} /> Finalize & Submit Session
              </button>
            ) : (
              <button onClick={handleNext} className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                Proceed to Next Question <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-amber-700 dark:text-amber-400 shadow-sm">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-[10px] font-bold leading-relaxed uppercase tracking-wider">No pausing allowed. Total immersion protocol in effect.</p>
        </div>
      </div>
    </div>
  );
}
