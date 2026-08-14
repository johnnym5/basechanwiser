"use client";

import React, { Suspense } from "react";
import AppShell from "@/components/layout/app-shell";
import MockInterviewPlayback from "@/components/mock-interview/MockInterviewPlayback";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

function PlaybackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const attemptId = searchParams.get("attemptId");

  if (!attemptId) {
    return (
      <div className="p-20 text-center space-y-4">
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No session ID provided for playback.</p>
        <button onClick={() => router.back()} className="text-blue-500 font-black uppercase text-[10px] flex items-center gap-2 mx-auto"><ArrowLeft size={14} /> Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-6 animate-in fade-in duration-500">
      <button
        onClick={() => router.back()}
        className="text-[10px] font-black uppercase text-gray-400 hover:text-blue-500 transition-all flex items-center gap-2"
      >
        <ArrowLeft size={14} /> Back to previous view
      </button>

      <MockInterviewPlayback attemptId={attemptId} />
    </div>
  );
}

export default function CounselorMockPlaybackPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" /></div>}>
        <PlaybackContent />
      </Suspense>
    </AppShell>
  );
}
