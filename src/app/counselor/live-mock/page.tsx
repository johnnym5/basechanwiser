"use client";

import React, { useState, Suspense } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { useWebRTC } from "@/hooks/useWebRTC";
import LiveCallArena from "@/components/mock-interview/LiveCallArena";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Phone, ArrowLeft } from "lucide-react";

function LiveMockContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userId, userProfile } = useAuth();
  const studentId = searchParams.get("studentId");

  const { localStream, remoteStream, startCall, endCall, status } = useWebRTC(studentId || "", true);
  const [calling, setCalling] = useState(false);

  if (!studentId) {
    return (
      <div className="p-20 text-center space-y-4">
        <p className="text-gray-500 font-bold uppercase tracking-widest">No student selected for live override.</p>
        <button onClick={() => router.back()} className="text-blue-500 font-black uppercase text-[10px] flex items-center gap-2 mx-auto"><ArrowLeft size={14} /> Go Back</button>
      </div>
    );
  }

  const handleStart = async () => {
    setCalling(true);
    await startCall(userId!, userProfile?.displayName || "Counselor");
  };

  if (status === 'connected') {
    return <LiveCallArena localStream={localStream} remoteStream={remoteStream} onEndCall={async () => { await endCall(); router.back(); }} />;
  }

  return (
    <div className="max-w-4xl mx-auto py-20 text-center space-y-8 animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto shadow-sm">
         <Phone size={48} className="text-blue-500" />
      </div>
      <div className="space-y-2">
         <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter">Live WebRTC Override</h2>
         <p className="text-gray-500 font-bold max-w-sm mx-auto uppercase text-xs tracking-widest leading-relaxed">
           Initiate a secure peer-to-peer video session with student <span className="text-blue-500 font-black">{studentId}</span>.
         </p>
      </div>

      {calling ? (
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="animate-spin text-blue-500" size={32} />
           <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Establishing Uplink...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={handleStart}
            className="px-12 py-5 bg-blue-600 text-white font-black rounded-full text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
          >
            <Phone size={18} /> Connect Secure Line
          </button>
          <button onClick={() => router.back()} className="text-[10px] font-black uppercase text-gray-400 hover:text-gray-600 transition-all">Abort Mission</button>
        </div>
      )}
    </div>
  );
}

export default function CounselorLiveMockPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></div>}>
        <LiveMockContent />
      </Suspense>
    </AppShell>
  );
}
