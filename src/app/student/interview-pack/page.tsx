"use client";

import React from "react";
import AppShell from "@/components/layout/app-shell";
import InterviewPackForm from "@/components/interview-pack/InterviewPackForm";
import { ShieldCheck } from "lucide-react";

export default function StudentInterviewPackPage() {
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col gap-1 border-l-4 border-emerald-500 pl-6 py-2">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3 font-google">
            <ShieldCheck className="w-8 h-8 text-emerald-500" /> Digital Interview Pack
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-widest">
            Submit your documents and credibility details for pre-CAS assessment
          </p>
        </div>

        <InterviewPackForm />
      </div>
    </AppShell>
  );
}
