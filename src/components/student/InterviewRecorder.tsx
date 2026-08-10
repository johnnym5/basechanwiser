"use client";

import React, { useState, useEffect, useRef } from "react";
import { Timer, Send, ChevronRight, CircleStop, Mic, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MockQuestion, MockInterviewAttempt, MockInterviewAnswer } from "@/types/mock";
import { storage } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface InterviewRecorderProps {
  stream: MediaStream;
  questions: MockQuestion[];
  studentId: string;
  mockId: string;
  onFinish: (videoUrls: string[], answers: MockInterviewAnswer[]) => void;
}

export default function InterviewRecorder({ stream, questions, studentId, mockId, onFinish }: InterviewRecorderProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(questions[0].timeLimit || 60);
  const [isUploading, setIsUploading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Results accumulation
  const videoUrlsRef = useRef<string[]>([]);
  const answersRef = useRef<MockInterviewAnswer[]>([]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    // Initialize Recorder
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      chunksRef.current = []; // Clear for next chunk

      const qIndex = currentIdx; // Capture current index for naming
      await uploadChunk(blob, qIndex);
    };

    recorderRef.current = recorder;
    recorder.start();

    return () => {
      if (recorder.state === 'recording') recorder.stop();
    };
  }, []);

  const uploadChunk = async (blob: Blob, index: number) => {
    setIsUploading(true);
    try {
      const storagePath = `mock_interviews/${studentId}/${mockId}/q_${index}_${Date.now()}.webm`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      videoUrlsRef.current.push(url);
      answersRef.current.push({
        questionId: questions[index].id,
        questionText: questions[index].text,
        videoUrl: url
      });
    } catch (err) {
      console.error("Chunk upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  // Dynamic Timer Engine
  useEffect(() => {
    const q = questions[currentIdx];
    setTimeLeft(q.timeLimit || 60);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIdx]);

  const handleNext = () => {
    if (isFinalizing) return;

    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setTimeout(() => {
        if (recorderRef.current && recorderRef.current.state === 'inactive') {
          recorderRef.current.start();
        }
      }, 600); // Buffer for onstop/onstart cycle
    } else {
      finalizeInterview();
    }
  };

  const finalizeInterview = async () => {
    setIsFinalizing(true);
    // Wait for final chunk upload to finish if still in progress
    // In a production app, we'd use a more robust queue, but for now we poll
    const checkCompletion = setInterval(() => {
      if (!isUploading) {
        clearInterval(checkCompletion);
        onFinish(videoUrlsRef.current, answersRef.current);
      }
    }, 500);
  };

  const currentQ = questions[currentIdx];
  const isLowTime = timeLeft <= 10;

  return (
    <div className="max-w-6xl mx-auto flex flex-col items-center gap-8 py-6">

      {/* ── VIDEO ARENA ── */}
      <div className={`w-full max-w-sm md:max-w-4xl mx-auto aspect-[9/16] md:aspect-[4/3] rounded-[40px] overflow-hidden bg-slate-900 relative shadow-2xl border-4 border-white dark:border-slate-800 transition-colors ${isLowTime ? 'border-rose-500/50 animate-pulse' : ''}`}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover transform scale-x-[-1]"
        />

        <div className="absolute top-8 right-8 flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-full animate-pulse shadow-lg z-20">
          <div className="w-2 h-2 bg-white rounded-full" />
          <span className="text-[10px] font-black uppercase tracking-widest">REC</span>
        </div>

        <div className="absolute bottom-10 left-6 right-6 z-20 md:hidden">
           <div className="bg-black/60 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
              <div className="flex justify-between items-center">
                 <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">Direct Question</p>
                 <div className="flex items-center gap-2 text-rose-500">
                    <Timer size={14} className={isLowTime ? 'animate-bounce' : ''} />
                    <span className="text-xs font-black tabular-nums">{timeLeft}s</span>
                 </div>
              </div>
              <h2 className="text-lg font-black text-white leading-tight italic">"{currentQ.text}"</h2>
           </div>
        </div>

        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/20" />
      </div>

      {/* ── CONTROLS & HUD ── */}
      <div className="w-full max-w-4xl space-y-6">
        <div className="hidden md:block bg-white dark:bg-slate-800 p-10 rounded-[40px] shadow-xl border border-gray-100 dark:border-slate-700 space-y-8">
           <div className="flex justify-between items-center border-b border-gray-50 dark:border-slate-700 pb-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500">
                    <Timer size={24} />
                 </div>
                 <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Time Remaining</span>
                <span className={`text-2xl font-black tabular-nums transition-colors duration-300 ${isLowTime ? 'text-rose-600 animate-pulse scale-110 origin-left' : 'dark:text-white'}`}>
                   {timeLeft}s
                </span>
              </div>
              </div>
              <div className="text-right">
                 <span className="text-[10px] font-black uppercase text-gray-400 block mb-1 tracking-widest">Question Sequence</span>
                 <p className="text-lg font-black dark:text-white">{currentIdx + 1} <span className="text-gray-400 font-bold">/ {questions.length}</span></p>
              </div>
           </div>

           <div className="min-h-[140px] flex items-center justify-center text-center">
              <AnimatePresence mode="wait">
                 <motion.h2
                   key={currentIdx}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="text-4xl font-black text-gray-900 dark:text-white leading-tight italic tracking-tighter max-w-2xl"
                 >
                    "{currentQ.text}"
                 </motion.h2>
              </AnimatePresence>
           </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          {isFinalizing ? (
            <div className="flex items-center gap-3 px-10 py-5 bg-emerald-500 text-white rounded-full font-black uppercase text-xs">
              <Loader2 className="animate-spin" size={20} /> Finalizing Session...
            </div>
          ) : (
            <button
              onClick={handleNext}
              className="px-12 py-5 bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-full shadow-2xl shadow-blue-500/30 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-3"
            >
              {currentIdx === questions.length - 1 ? 'Complete Interview' : 'Next Question'} <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] justify-center w-full max-w-md">
        <AlertCircle size={14} className="shrink-0" />
        Protocol: Chunked recording in effect. Auto-uploading segments.
      </div>
    </div>
  );
}
