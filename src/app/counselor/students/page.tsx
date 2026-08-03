"use client";

import React from "react";
import AppShell from "@/components/layout/app-shell";
import { Users } from "lucide-react";
import Link from "next/link";

export default function CounselorStudentsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 font-google">
              <Users className="w-6 h-6 text-[#1a73e8] dark:text-blue-400" /> Student Directory
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              View and manage all registered student profiles across offices.
            </p>
          </div>

          <Link
            href="/counselor/dashboard"
            className="px-4 py-2 rounded-full bg-[#1a73e8] text-white text-xs font-bold shadow-md shadow-blue-500/20"
          >
            Go to Traffic Light Dashboard
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
          <p className="text-xs text-gray-600 dark:text-gray-300">
            For full readiness filtering and Junior Interview Evaluations, please use the <strong>Traffic Light Dashboard</strong>.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
