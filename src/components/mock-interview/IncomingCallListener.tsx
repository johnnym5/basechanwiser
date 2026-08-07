"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot, limit, orderBy } from "firebase/firestore";
import { Phone, PhoneOff, X } from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";
import LiveCallArena from "./LiveCallArena";

export default function IncomingCallListener() {
  const { userId } = useAuth();
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const { localStream, remoteStream, joinCall, endCall, status } = useWebRTC(null, false);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "calls"),
      where("calleeId", "==", userId),
      where("status", "==", "ringing"),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setIncomingCall({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        setIncomingCall(null);
      }
    });

    return () => unsub();
  }, [userId]);

  const handleAccept = async () => {
    if (incomingCall) {
      await joinCall(incomingCall.id);
    }
  };

  const handleReject = async () => {
    // In a real app, update Firestore status to 'rejected'
    setIncomingCall(null);
  };

  if (status === 'connected') {
    return <LiveCallArena localStream={localStream} remoteStream={remoteStream} onEndCall={async () => { await endCall(); setIncomingCall(null); }} />;
  }

  if (!incomingCall) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[250] animate-in slide-in-from-right-10 duration-500">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-slate-700 flex flex-col items-center space-y-6 max-w-sm">
         <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center animate-bounce">
            <Phone size={32} className="text-blue-500" />
         </div>
         <div className="text-center space-y-1">
            <h3 className="text-lg font-black dark:text-white uppercase tracking-tighter">Incoming Live Mock</h3>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{incomingCall.callerName} is calling...</p>
         </div>
         <div className="flex gap-4 w-full">
            <button onClick={handleReject} className="flex-1 py-4 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest">Decline</button>
            <button onClick={handleAccept} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20">Accept</button>
         </div>
      </div>
    </div>
  );
}
