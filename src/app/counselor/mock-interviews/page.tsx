"use client";

import React from "react";
import AppShell from "@/components/layout/app-shell";
import MockConfigEditor from "@/components/mock-interview/MockConfigEditor";
import { MessageSquare } from "lucide-react";

export default function CounselorMockInterviewsPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col gap-1 border-l-4 border-blue-500 pl-6 py-2">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3 font-google">
            <MessageSquare className="w-8 h-8 text-blue-500" /> Mock Interview Manager
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-widest">
            Configure global defaults and student-specific interview sessions
          </p>
        </div>

        <MockConfigEditor />
      </div>
    </AppShell>
  );
}
