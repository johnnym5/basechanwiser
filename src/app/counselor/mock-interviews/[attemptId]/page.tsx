"use client";

import React from "react";
import AppShell from "@/components/layout/app-shell";
import MockInterviewPlayback from "@/components/mock-interview/MockInterviewPlayback";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function CounselorMockPlaybackPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  return (
    <AppShell>
      <div className="py-8 space-y-6">
        <button
          onClick={() => router.back()}
          className="text-[10px] font-black uppercase text-gray-400 hover:text-blue-500 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={14} /> Back to List
        </button>

        <MockInterviewPlayback attemptId={attemptId} />
      </div>
    </AppShell>
  );
}
