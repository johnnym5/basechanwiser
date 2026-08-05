"use client";

import React from "react";
import AppShell from "@/components/layout/app-shell";
import LeaderboardView from "@/components/common/LeaderboardView";
import { Trophy } from "lucide-react";

export default function CounselorLeaderboardPage() {
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-12 pb-20">

        <div className="text-center space-y-2">
           <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest animate-in fade-in duration-1000">
              <Trophy className="w-3 h-3" /> Staff Oversight
           </div>
           <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter font-google">Student Rankings</h1>
           <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Global student performance metrics and point leaders.</p>
        </div>

        <LeaderboardView isCounselorView={true} />
      </div>
    </AppShell>
  );
}
