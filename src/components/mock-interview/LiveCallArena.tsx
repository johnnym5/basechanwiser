"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Timer,
  Send,
  ChevronRight,
  RotateCcw,
  CircleStop,
  AlertCircle,
  Camera,
  ShieldCheck,
  Loader2,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  User,
  Monitor
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, getDocs, collection, query, where, limit, addDoc, serverTimestamp } from "firebase/firestore";
import { MockQuestionSet, MockInterviewAttempt } from "@/types/mock";

interface LiveCallArenaProps {
  // WebRTC Live Call Props
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  onEndCall?: () => void;
  studentUid?: string;
  studentName?: string;

  // Student Recording / Session Arena Props
  phase?: 'setup' | 'interview';
  stream?: MediaStream | null;
  videoRef?: React.RefObject<HTMLVideoElement | null> | React.RefObject<HTMLVideoElement>;
  timeLeft?: number;
  currentIdx?: number;
  totalQuestions?: number;
  currentQuestion?: string;
  isRecording?: boolean;
  isFinalizing?: boolean;
  volume?: number;
  permissionError?: string | null;
  onPermissions?: () => void;
  onStart?: () => void;
  onNext?: () => void;
  onFinish?: () => void;
  onRestart?: () => void;
  countdown?: number | null;
  questionSetTitle?: string;
  timePerQuestion?: number;
}

/**
 * Smart Set Fetching Logic for Student Interview Sessions:
 * 1. Checks if student has assignedMockSetId in user profile.
 * 2. Fallback to global default non-archived set.
 */
export async function fetchSmartStudentQuestionSet(studentUid: string): Promise<MockQuestionSet | null> {
  try {
    const userSnap = await getDoc(doc(db, "Users", studentUid));
    const assignedSetId = userSnap.exists() ? userSnap.data()?.assignedMockSetId : null;

    if (assignedSetId) {
      const assignedSnap = await getDoc(doc(db, "mock_interview_sets", assignedSetId));
      if (assignedSnap.exists() && !assignedSnap.data().isArchived) {
        return { id: assignedSnap.id, ...assignedSnap.data() } as MockQuestionSet;
      }
    }

    const defaultQuery = query(
      collection(db, "mock_interview_sets"),
      where("isDefault", "==", true),
      where("isArchived", "==", false),
      limit(1)
    );
    const defaultSnap = await getDocs(defaultQuery);
    if (!defaultSnap.empty) {
      return { id: defaultSnap.docs[0].id, ...defaultSnap.docs[0].data() } as MockQuestionSet;
    }

    return null;
  } catch (err) {
    console.error("Error in fetchSmartStudentQuestionSet:", err);
    return null;
  }
}

/**
 * LiveCallArena: Professional Recording Arena for UKVI Mock Interviews.
 * Features: 3-2-1 Countdown, Real-time Audio Visualizer, Responsive Aspect Ratios.
 */
export default function LiveCallArena(props: LiveCallArenaProps) {
  // WebRTC Peer-to-Peer Mode
  if (props.localStream !== undefined || props.remoteStream !== undefined) {
    const { localStream, remoteStream, onEndCall } = props;
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const [micMuted, setMicMuted] = useState(false);
    const [videoOff, setVideoOff] = useState(false);

    useEffect(() => {
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    }, [localStream]);

    useEffect(() => {
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }, [remoteStream]);

    const toggleMic = () => {
      if (localStream) {
        localStream.getAudioTracks().forEach(track => { track.enabled = !track.enabled; });
        setMicMuted(!micMuted);
      }
    };

    const toggleVideo = () => {
      if (localStream) {
        localStream.getVideoTracks().forEach(track => { track.enabled = !track.enabled; });
        setVideoOff(!videoOff);
      }
    };

    return (
      <div className="fixed inset-0 bg-[#0F172A] z-[200] flex flex-col items-center justify-center p-6">
        <div className="relative w-full max-w-5xl aspect-video bg-black rounded-[40px] overflow-hidden shadow-2xl border-4 border-slate-800">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute bottom-8 right-8 w-48 aspect-video bg-slate-900 rounded-2xl overflow-hidden border-2 border-white shadow-xl">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          </div>
          {!remoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-4">
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center animate-pulse">
                <User size={40} className="text-slate-400" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Waiting for peer connection...</p>
            </div>
          )}
        </div>

        <div className="mt-12 flex items-center gap-6">
          <button onClick={toggleMic} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${micMuted ? "bg-rose-600 text-white" : "bg-slate-800 text-white hover:bg-slate-700"}`}>
            {micMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          <button onClick={toggleVideo} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${videoOff ? "bg-rose-600 text-white" : "bg-slate-800 text-white hover:bg-slate-700"}`}>
            {videoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>
          <button onClick={onEndCall} className="w-20 h-20 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 transition-all shadow-2xl hover:scale-105 active:scale-95">
            <PhoneOff size={32} />
          </button>
          <button className="w-14 h-14 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-all">
            <Monitor size={24} />
          </button>
        </div>
      </div>
    );
  }

  // Session / Recording Execution Mode
  const {
    phase = 'setup',
    stream = null,
    videoRef,
    timeLeft = 0,
    currentIdx = 0,
    totalQuestions = 1,
    currentQuestion = "",
    isRecording = false,
    isFinalizing = false,
    volume = 0,
    permissionError = null,
    onPermissions,
    onStart,
    onNext,
    onFinish,
    onRestart,
    countdown = null,
    questionSetTitle,
    timePerQuestion
  } = props;

  if (phase === 'setup') {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-up duration-500 py-10">
        <div className="bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 text-center space-y-8">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck size={40} className="text-blue-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter leading-none">Initialization</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
              {questionSetTitle || "Mock Interview"} • {timePerQuestion}s Limit
            </p>
          </div>

          <div className="w-full aspect-video max-w-sm mx-auto bg-black rounded-3xl overflow-hidden relative group shadow-2xl border-4 border-gray-50 dark:border-slate-900">
            <video
              ref={videoRef as any}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            {!stream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-4 bg-slate-900/60 backdrop-blur-sm">
                <button onClick={onPermissions} className="p-6 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all border border-white/20 shadow-xl">
                  <Camera size={32} />
                </button>
                <p className="text-[10px] font-black uppercase tracking-widest">Enable Camera Preview</p>
              </div>
            )}

            {stream && (
              <div className="absolute bottom-6 left-6 right-6 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500"
                  animate={{ width: `${volume}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              </div>
            )}
          </div>

          {permissionError && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 text-xs font-bold flex items-center gap-3">
              <AlertCircle size={18} /> {permissionError}
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={onStart}
              disabled={!!permissionError || !stream}
              className="px-12 py-5 bg-[#1a73e8] text-white font-black rounded-full text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/30 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50"
            >
              Enter Arena
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col items-center gap-8 py-4 sm:py-10">
      <div className="relative w-full max-w-sm md:max-w-4xl mx-auto aspect-[9/16] md:aspect-[4/3] rounded-[40px] overflow-hidden bg-slate-900 shadow-2xl border-4 border-white dark:border-slate-800">
        <video
          ref={videoRef as any}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover transform scale-x-[-1]"
        />

        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-md"
            >
              <motion.span
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                className="text-9xl font-black text-white italic drop-shadow-2xl font-google"
              >
                {countdown}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {isRecording && !countdown && (
          <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 bg-red-600/90 backdrop-blur-md text-white rounded-full z-30 shadow-lg border border-white/10">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">REC</span>
          </div>
        )}

        <div className="absolute bottom-10 left-4 right-4 z-20 md:hidden">
          <div className="bg-black/70 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">Direct Question</p>
              <div className="flex items-center gap-2 text-rose-500">
                <Timer size={14} className={timeLeft <= 10 ? 'animate-bounce' : ''} />
                <span className="text-xs font-black tabular-nums">{timeLeft}s</span>
              </div>
            </div>
            <h2 className="text-lg font-black text-white leading-tight italic">"{currentQuestion}"</h2>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/10 z-30">
          <motion.div
            className="h-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]"
            animate={{ width: `${volume}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      <div className="w-full max-w-4xl space-y-6">
        <div className="hidden md:block bg-white dark:bg-slate-800 p-10 rounded-[40px] shadow-xl border border-gray-100 dark:border-slate-700 space-y-8">
          <div className="flex justify-between items-center border-b border-gray-50 dark:border-slate-700 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500">
                <Timer size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Time Remaining</span>
                <span className={`text-2xl font-black tabular-nums ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'dark:text-white'}`}>
                  {timeLeft}s
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase text-gray-400 block mb-1 tracking-widest">Sequence</span>
              <p className="text-lg font-black dark:text-white">
                {currentIdx + 1} <span className="text-gray-400 text-sm font-bold">/ {totalQuestions}</span>
              </p>
            </div>
          </div>

          <div className="min-h-[120px] flex items-center justify-center text-center">
            <AnimatePresence mode="wait">
              <motion.h2
                key={currentIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-4xl font-black text-gray-900 dark:text-white leading-tight italic tracking-tighter"
              >
                "{currentQuestion}"
              </motion.h2>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
          <div className="flex items-center gap-4 order-2 sm:order-1">
            <button onClick={onRestart} className="px-6 py-3 text-gray-400 hover:text-gray-900 dark:hover:text-white font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2">
              <RotateCcw size={16} /> Restart
            </button>
            <button onClick={onFinish} className="px-6 py-3 rounded-2xl border-2 border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2">
              <CircleStop size={16} /> Stop Early
            </button>
          </div>

          <div className="order-1 sm:order-2 w-full sm:w-auto">
            <button
              onClick={currentIdx === totalQuestions - 1 ? onFinish : onNext}
              disabled={isFinalizing}
              className="w-full sm:px-12 py-5 bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-full shadow-2xl shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isFinalizing ? <Loader2 className="animate-spin" /> : currentIdx === totalQuestions - 1 ? <>Archive Session <Send size={18} /></> : <>Next Question <ChevronRight size={18} /></>}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-amber-700 dark:text-amber-400 shadow-sm max-w-md mx-auto text-center">
        <AlertCircle size={18} className="shrink-0" />
        <p className="text-[9px] font-bold leading-relaxed uppercase tracking-wider">Total Immersion Protocol: Camera framing must remain strictly active.</p>
      </div>
    </div>
  );
}
