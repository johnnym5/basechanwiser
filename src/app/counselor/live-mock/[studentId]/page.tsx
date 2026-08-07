"use client";

import React, { useEffect, useState } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { useWebRTC } from "@/hooks/useWebRTC";
import LiveCallArena from "@/components/mock-interview/LiveCallArena";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Phone } from "lucide-react";

export default function CounselorLiveMockPage() {
  const params = useParams();
  const router = useRouter();
  const { userId, userProfile } = useAuth();
  const studentId = params.studentId as string;

  const { localStream, remoteStream, startCall, endCall, status } = useWebRTC(studentId, true);
  const [calling, setCalling] = useState(false);

  const handleStart = async () => {
    setCalling(true);
    await startCall(userId!, userProfile?.displayName || "Counselor");
  };

  if (status === 'connected') {
    return <LiveCallArena localStream={localStream} remoteStream={remoteStream} onEndCall={async () => { await endCall(); router.back(); }} />;
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto py-20 text-center space-y-8">
        <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto shadow-sm">
           <Phone size={48} className="text-blue-500" />
        </div>
        <div className="space-y-2">
           <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter">Live WebRTC Override</h2>
           <p className="text-gray-500 font-bold max-w-sm mx-auto uppercase text-xs tracking-widest leading-relaxed">
             Initiate a secure peer-to-peer video session with student <span className="text-blue-500">{studentId}</span>.
           </p>
        </div>

        {calling ? (
          <div className="flex flex-col items-center gap-4">
             <Loader2 className="animate-spin text-blue-500" size={32} />
             <p className="text-xs font-black uppercase text-gray-400">Ringing Student...</p>
          </div>
        ) : (
          <button
            onClick={handleStart}
            className="px-12 py-5 bg-blue-600 text-white font-black rounded-full text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all"
          >
            Connect Secure Line
          </button>
        )}
      </div>
    </AppShell>
  );
}
