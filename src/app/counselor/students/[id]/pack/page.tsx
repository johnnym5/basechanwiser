"use client";

import React from "react";
import AppShell from "@/components/layout/app-shell";
import InterviewPackReview from "@/components/interview-pack/InterviewPackReview";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function CounselorStudentPackPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8">
        <button
          onClick={() => router.back()}
          className="text-[10px] font-black uppercase text-gray-400 hover:text-blue-500 transition-all flex items-center gap-2 mb-4"
        >
          <ArrowLeft size={14} /> Back to Student Portfolio
        </button>

        <InterviewPackReview studentId={id} />
      </div>
    </AppShell>
  );
}
