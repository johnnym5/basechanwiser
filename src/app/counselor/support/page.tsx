"use client";

import React from "react";
import AppShell from "@/components/layout/app-shell";
import SupportTerminal from "@/components/support/SupportTerminal";
import { MessageSquare } from "lucide-react";

/**
 * Staff Support Terminal Page
 * Centralized hub for counselor-student communications.
 */
export default function StaffSupportPage() {
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-1 border-l-4 border-blue-600 pl-6 py-2">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3 font-google uppercase tracking-tighter">
            <MessageSquare className="w-8 h-8 text-blue-600" /> Support Terminal
          </h1>
          <p className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest leading-none">
            Secure Communications Hub & Real-time Student Assistance
          </p>
        </div>

        <SupportTerminal />
      </div>
    </AppShell>
  );
}
