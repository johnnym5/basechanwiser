"use client";

import React, { useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, User, Monitor } from "lucide-react";

interface LiveCallArenaProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onEndCall: () => void;
}

export default function LiveCallArena({ localStream, remoteStream, onEndCall }: LiveCallArenaProps) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

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

  return (
    <div className="fixed inset-0 bg-[#0F172A] z-[200] flex flex-col items-center justify-center p-6">
      {/* Remote Video (Main) */}
      <div className="relative w-full max-w-5xl aspect-video bg-black rounded-[40px] overflow-hidden shadow-2xl border-4 border-slate-800">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute bottom-8 right-8 w-48 aspect-video bg-slate-900 rounded-2xl overflow-hidden border-2 border-white shadow-xl">
           <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        </div>

        {/* Remote Status Overlay if not streaming */}
        {!remoteStream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-4">
             <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center animate-pulse">
                <User size={40} className="text-slate-400" />
             </div>
             <p className="text-xs font-black uppercase tracking-widest text-slate-400">Waiting for peer connection...</p>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="mt-12 flex items-center gap-6">
         <button className="w-14 h-14 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-all">
            <Mic size={24} />
         </button>
         <button className="w-14 h-14 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-all">
            <Video size={24} />
         </button>
         <button
           onClick={onEndCall}
           className="w-20 h-20 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 transition-all shadow-2xl shadow-rose-900/40"
          >
            <PhoneOff size={32} />
         </button>
         <button className="w-14 h-14 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-all">
            <Monitor size={24} />
         </button>
      </div>
    </div>
  );
}
