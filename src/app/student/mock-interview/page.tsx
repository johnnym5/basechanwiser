"use client";

import React from "react";
import AppShell from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import MockInterviewRecorder, { QUESTIONS } from "@/components/student/MockInterviewRecorder";
import { ShieldCheck, Video } from "lucide-react";

export default function StudentMockInterviewPage() {
  const { userProfile } = useAuth();

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-3 text-sm uppercase tracking-[0.3em] font-black text-slate-500">
                <ShieldCheck className="w-5 h-5 text-blue-500" /> Mock Interview Practice
              </div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Automated Video Interview</h1>
              <p className="max-w-2xl text-sm text-gray-500 dark:text-slate-400">Record your UKVI-style mock interview answers on camera. Each question advances automatically after 60 seconds, and your completed video is uploaded for counselor review.</p>
            </div>
            <div className="rounded-3xl bg-slate-100 dark:bg-slate-950 p-4 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Interview Status</p>
              <p className="mt-3 text-lg font-black text-slate-900 dark:text-white">{userProfile?.mockInterview?.status || "Not Submitted"}</p>
            </div>
          </div>

          {userProfile?.mockInterview?.videoUrl ? (
            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] bg-white dark:bg-[#111827] p-6 rounded-[40px] border border-gray-200 dark:border-slate-800 shadow-sm">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Latest Interview Submission</h2>
                <video
                  src={userProfile.mockInterview.videoUrl}
                  controls
                  className="w-full rounded-3xl bg-black aspect-video object-cover"
                />
                <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">
                  Submitted: {userProfile.mockInterview.submittedAt?.toDate ? userProfile.mockInterview.submittedAt.toDate().toLocaleString() : userProfile.mockInterview.submittedAt?.seconds ? new Date(userProfile.mockInterview.submittedAt.seconds * 1000).toLocaleString() : "Unknown"}
                </p>
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl bg-slate-950 p-5 border border-slate-800 text-white">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Reviewer Notes</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-200">{userProfile.mockInterview.counselorNotes || "Awaiting counselor feedback."}</p>
                </div>
                <div className="rounded-3xl bg-slate-950 p-5 border border-slate-800 text-white">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Score</p>
                  <p className="mt-3 text-3xl font-black">{userProfile.mockInterview.score ?? "—"}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="bg-white dark:bg-[#111827] p-8 rounded-[40px] border border-gray-200 dark:border-slate-800 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_0.4fr]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] font-black text-indigo-600 dark:text-indigo-300">
                <Video className="w-4 h-4" /> Practice Instructions
              </div>
              <div className="space-y-3 text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                <p>Answer each question on camera for 60 seconds. The system will advance automatically to the next prompt when time expires.</p>
                <p>Make sure your face is visible, speak clearly, and keep your answers concise but complete.</p>
                <p>When finished, the recording will upload automatically and your counselor can review it with comments and a score.</p>
              </div>
            </div>
            <div className="rounded-3xl bg-slate-950 p-6 border border-slate-800 text-white shadow-sm">
              <p className="text-xs uppercase tracking-[0.35em] font-black text-slate-400">Questions</p>
              <ol className="mt-4 space-y-3 text-sm leading-6">
                {QUESTIONS.map((question, idx) => (
                  <li key={idx} className="rounded-3xl bg-slate-900 p-4 border border-slate-800">
                    <span className="mr-2 font-black text-slate-200">{idx + 1}.</span>{question}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-10">
            <MockInterviewRecorder />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
