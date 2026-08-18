"use client";

import React, { useState, useEffect, useRef } from "react";
import { Timer, Send, ChevronRight, CircleStop, Mic, AlertCircle, Loader2, RotateCcw, Play, CheckCircle2, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MockQuestion, MockInterviewAnswer } from "@/types/mock";
import { db, storage } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { logActivityAndNotify } from "@/lib/server/notifications";
import { showPushNotification } from "@/lib/client/push-notifications";
import { useRouter } from "next/navigation";

interface RecordedChunk {
  questionId: string;
  questionText: string;
  blob: Blob;
  url: string;
}

interface InterviewRecorderProps {
  stream: MediaStream;
  questions: MockQuestion[];
  studentId: string;
  studentName: string;
  counselorId?: string;
  mockId: string;
  onFinish: () => void; // Parent just needs to know we are done
  onRetake: () => void; // ── NEW: Request a full reset ──
}

type Step = 'recording' | 'preview' | 'uploading' | 'completed';

export default function InterviewRecorder({ stream, questions, studentId, studentName, counselorId, mockId, onFinish, onRetake }: InterviewRecorderProps) {
  const [step, setStep] = useState<Step>('recording');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(questions[0].timeLimit || 60);
  const [recordedChunks, setRecordedChunks] = useState<RecordedChunk[]>([]);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const router = useRouter();
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const totalStartTimeRef = useRef<number>(Date.now());

  // 1. Initialize Recorder & Live Feed
  useEffect(() => {
    if (liveVideoRef.current && step === 'recording') {
      liveVideoRef.current.srcObject = stream;
    }

    if (step === 'recording') {
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);

        setRecordedChunks(prev => {
          // Check if we already have a chunk for this index (restart scenario)
          const filtered = prev.filter(c => c.questionId !== questions[currentIndex].id);
          return [...filtered, {
            questionId: questions[currentIndex].id,
            questionText: questions[currentIndex].text,
            blob,
            url
          }];
        });

        chunksRef.current = [];
      };

      recorderRef.current = recorder;
      recorder.start();
    }

    return () => {
      if (recorderRef.current && recorderRef.current.state === 'recording') {
        recorderRef.current.stop();
      }
    };
  }, [step, currentIndex]);

  // 2. Dynamic HUD Timer
  useEffect(() => {
    if (step !== 'recording') return;

    const q = questions[currentIndex];
    setTimeLeft(q.timeLimit || 60);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, step]);

  const handleNextQuestion = () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // ── CLEANUP: Revoke hardware access as we enter preview mode ──
      stream.getTracks().forEach(track => track.stop());
      setStep('preview');
    }
  };

  const handleRestartQuestion = () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      chunksRef.current = []; // Wipe current buffer
      recorderRef.current.stop();
      // useEffect will re-trigger and start a new recording for this same index
    }
    setTimeLeft(questions[currentIndex].timeLimit || 60);
  };

  const handleStopEarly = () => {
    if (confirm("Stop the interview now and go to preview? Current question will be saved.")) {
      if (recorderRef.current && recorderRef.current.state === 'recording') {
        recorderRef.current.stop();
      }
      // ── CLEANUP: Revoke hardware access as we enter preview mode ──
      stream.getTracks().forEach(track => track.stop());
      setStep('preview');
    }
  };

  const handleFinalSubmit = async () => {
    setIsFinalizing(true);
    setStep('uploading');

    try {
      // 1. Upload Blobs to Firebase Storage
      const uploadPromises = recordedChunks.map(async (chunk, idx) => {
        const storagePath = `mock_interviews/${studentId}/${mockId}/q_${idx}_${Date.now()}.webm`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, chunk.blob);
        return getDownloadURL(storageRef);
      });

      const videoUrls = await Promise.all(uploadPromises);

      // 2. Update Firestore Attempt
      const attemptId = `${studentId}_${mockId}`;
      const attemptRef = doc(db, 'mock_interview_attempts', attemptId);
      const totalDuration = (Date.now() - totalStartTimeRef.current) / 1000;

      const answers: MockInterviewAnswer[] = recordedChunks.map((chunk, idx) => ({
        questionId: chunk.questionId,
        questionText: chunk.questionText,
        videoUrl: videoUrls[idx]
      }));

      await updateDoc(attemptRef, {
        videoUrls,
        answers,
        status: 'pending_review',
        submittedAt: serverTimestamp(),
        timeTakenSeconds: totalDuration,
        counselorId: counselorId || "" // Save counselorId to allow filtering in dashboard
      });

      // 3. Log Activity & Notify Counselor
      await logActivityAndNotify({
        studentId,
        studentName,
        counselorId: counselorId || "",
        type: 'MOCK_INTERVIEW',
        message: `finalized a Mock Interview session. Review pending.`,
        link: `/counselor/mock-interviews/playback?attemptId=${attemptId}`
      });

      // ── SYSTEM PUSH NOTIFICATION ──
      await showPushNotification("Mock Interview Submitted", {
        body: `${studentName} has successfully uploaded their UKVI Mock Interview segments.`,
        tag: 'mock-submission'
      });

      setStep('completed');
      setTimeout(() => onFinish(), 2000);
    } catch (err) {
      console.error("Submission failed", err);
      alert("Critical error during upload. Please check your connection.");
      setStep('preview');
      setIsFinalizing(false);
    }
  };

  if (step === 'preview') {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Review Mission Dossier</h2>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Verify your recordings before final transmission to Counselor.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {recordedChunks.map((chunk, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[32px] overflow-hidden shadow-xl group">
               <div className="p-6 border-b border-gray-50 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Segment Q{idx + 1}</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
               </div>
               <video src={chunk.url} controls className="w-full aspect-video object-cover bg-black" />
               <div className="p-6">
                  <p className="text-xs font-bold text-gray-600 dark:text-slate-300 leading-relaxed italic">"{chunk.questionText}"</p>
               </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10 border-t border-gray-100 dark:border-slate-800">
          <button
            onClick={() => { if(confirm("Discard these segments and restart?")) onRetake(); }}
            className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 transition-all"
          >
            <RotateCcw size={16} /> Discard & Retake Entire Interview
          </button>

          <button
            onClick={handleFinalSubmit}
            disabled={isFinalizing}
            className="px-12 py-5 bg-[#1a73e8] text-white font-black rounded-full text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {isFinalizing ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Submit to Counselor</>}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'uploading') {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center space-y-8 animate-in zoom-in duration-500">
         <div className="w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto border-4 border-blue-100 relative">
            <Loader2 className="animate-spin text-blue-500" size={48} />
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
         </div>
         <div className="space-y-2">
            <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter">Transmitting Data</h2>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Encrypting video segments and updating mission records...</p>
         </div>
      </div>
    );
  }

  if (step === 'completed') {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center space-y-8 animate-in zoom-in duration-500">
         <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-100">
            <CheckCircle2 size={48} className="text-emerald-500" />
         </div>
         <div className="space-y-2">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Session Secured</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Mission dossier archived. Counselor notification dispatched.</p>
         </div>
      </div>
    );
  }

  // ── Recording HUD UI ──
  return (
    <div className="max-w-6xl mx-auto py-4">
      <div className="relative w-full h-[75vh] md:h-[80vh] bg-black rounded-[40px] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 group">

        {/* Live Camera Feed */}
        <video
          ref={liveVideoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
        />

        {/* HUD: Top Status Bar */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20">
          <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center space-x-3 shadow-lg">
             <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
             <span className="text-white font-black text-[10px] uppercase tracking-[0.2em]">Live Transmission</span>
          </div>

          <div className="flex gap-3">
             <div className="bg-black/40 backdrop-blur-md px-5 py-2 rounded-2xl border border-white/10 text-white font-black text-[10px] uppercase tracking-widest shadow-lg">
                Question {currentIndex + 1} / {questions.length}
             </div>
          </div>
        </div>

        {/* HUD: Question Overlay (Immersive Center) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-4xl z-20">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-black/60 backdrop-blur-xl border border-white/10 p-10 md:p-14 rounded-[40px] text-center shadow-2xl space-y-8 relative overflow-hidden"
          >
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500" />

             <h2 className="text-3xl md:text-5xl font-black text-white leading-tight italic tracking-tighter drop-shadow-2xl">
               "{questions[currentIndex].text}"
             </h2>

             <div className="flex items-center justify-center gap-6">
                <div className={`px-8 py-3 rounded-2xl font-black tabular-nums transition-all border-2 ${timeLeft <= 10 ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse scale-110' : 'bg-white/5 border-white/20 text-white'}`}>
                   00:{timeLeft.toString().padStart(2, '0')}
                </div>
                <div className="h-8 w-px bg-white/10" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Time Remaining</p>
             </div>
          </motion.div>
        </div>

        {/* HUD: Bottom Controls */}
        <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end z-20">

          {/* Left: Emergency / Reset */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleStopEarly}
              className="group bg-red-600/20 hover:bg-red-600 backdrop-blur-md text-red-500 hover:text-white p-5 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all border border-red-600/30 flex items-center gap-3"
            >
              <CircleStop size={20} className="group-hover:scale-110 transition-transform" />
              Stop Mission
            </button>

            <button
              onClick={handleRestartQuestion}
              className="group bg-white/5 hover:bg-white/10 backdrop-blur-md text-white p-5 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/10 flex items-center gap-3"
            >
              <RotateCcw size={20} className="group-hover:rotate-[-45deg] transition-transform" />
              Restart Drill
            </button>
          </div>

          {/* Right: Advance */}
          <button
            onClick={handleNextQuestion}
            className="group bg-blue-600 hover:bg-blue-500 text-white px-10 py-6 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] transition-all shadow-[0_20px_50px_rgba(37,99,235,0.4)] border border-blue-400/30 flex items-center gap-4 hover:scale-105 active:scale-95"
          >
            {currentIndex === questions.length - 1 ? 'Finish & Preview' : 'Next Question'}
            <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </button>

        </div>

        {/* Cinematic Vignette */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/20" />
      </div>

      <div className="mt-6 flex items-center justify-center gap-3 opacity-40">
        <AlertCircle size={14} className="text-gray-500" />
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">Security Protocol: Immersive HUD Active • Local Buffering Engaged</p>
      </div>
    </div>
  );
}
