"use client";

import React from "react";
import AppShell from "@/components/layout/app-shell";
import LeaderboardView from "@/components/common/LeaderboardView";

export default function LeaderboardPage() {
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-12 pb-20 p-6">
        <div className="text-center">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Global Leaderboard</h1>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Compete with top compliance scholars across the world.</p>
        </div>

        <LeaderboardView isCounselorView={false} />
      </div>
    </AppShell>
  );
}
