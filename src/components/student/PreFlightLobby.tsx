"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, Mic, ShieldCheck, AlertCircle, Play } from "lucide-react";
import { motion } from "framer-motion";

interface PreFlightLobbyProps {
  onStart: (stream: MediaStream) => void;
  onStreamAcquired?: (stream: MediaStream) => void; // ── Sync with parent for global cleanup ──
  title: string;
  duration: string;
}

export default function PreFlightLobby({ onStart, onStreamAcquired, title, duration }: PreFlightLobbyProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isStartedRef = useRef(false);

  useEffect(() => {
    let localStream: MediaStream | null = null;

    async function getMedia() {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true
        });
        localStream = userStream;
        setStream(userStream);
        if (onStreamAcquired) onStreamAcquired(userStream);
        if (videoRef.current) {
          videoRef.current.srcObject = userStream;
        }
      } catch (err) {
        console.error("Media access error:", err);
        setError("Camera and Microphone access are required to begin.");
      }
    }
    getMedia();

    return () => {
      // ── CRITICAL: Hardware Release ──
      // If we unmount (navigate away) before clicking 'Begin', we MUST kill the tracks.
      if (localStream && !isStartedRef.current) {
        localStream.getTracks().forEach(track => {
          track.stop();
          console.log(`[LobbyCleanup] Hardware access revoked: ${track.kind}`);
        });
      }
    };
  }, []);

  const handleBegin = () => {
    if (stream) {
      isStartedRef.current = true;
      onStart(stream);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-up duration-500">
      <div className="bg-white dark:bg-slate-800 p-10 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 text-center space-y-8">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck size={40} className="text-blue-500" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Equipment Check</h2>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {title} • {duration}
          </p>
        </div>

        <div className="bg-black rounded-3xl overflow-hidden aspect-video relative group shadow-2xl border-4 border-gray-50 dark:border-slate-900">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
          {!stream && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-slate-900/60 backdrop-blur-sm">
              <Loader2 className="animate-spin" size={32} />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-rose-900/60 backdrop-blur-sm p-6 text-center space-y-4">
              <AlertCircle size={40} />
              <p className="text-sm font-bold uppercase tracking-widest leading-relaxed">{error}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatusCard icon={Camera} label="Video Feed" active={!!stream} />
          <StatusCard icon={Mic} label="Audio Input" active={!!stream} />
        </div>

        <button
          onClick={handleBegin}
          disabled={!stream || loading}
          className="w-full py-5 bg-[#1a73e8] text-white font-black rounded-full text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : <><Play size={18} /> Start Official Interview</>}
        </button>
      </div>
    </div>
  );
}

function StatusCard({ icon: Icon, label, active }: { icon: any; label: string; active: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${active ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
      <Icon size={18} />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      <div className={`ml-auto w-2 h-2 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
