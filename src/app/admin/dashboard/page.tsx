"use client";

import React from "react";
import AppShell from "@/components/layout/app-shell";
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";
import { BarChart3 } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-1 border-l-4 border-indigo-500 pl-6 py-2">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3 font-google">
            <BarChart3 className="w-8 h-8 text-indigo-500" /> Compliance Analytics
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-widest">
            Strategic performance data and institutional compliance tracking
          </p>
        </div>

        <AnalyticsCharts />
      </div>
    </AppShell>
  );
}
