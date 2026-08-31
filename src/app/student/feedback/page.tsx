"use client";

import React from "react";
import AppShell from "@/components/layout/app-shell";
import StudentProfileView from "@/components/student/StudentProfileView";
import { useAuth } from "@/lib/auth/auth-context";
import { Loader2, MessageSquare, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function StudentFeedbackHubPage() {
  const { userId, loading } = useAuth();

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center p-20 gap-4">
           <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
           <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Synchronizing Feedback Hub...</p>
        </div>
      </AppShell>
    );
  }

  if (!userId) {
    return (
      <AppShell>
        <div className="p-20 text-center">
          <p className="text-gray-500 font-bold">Please log in to view your feedback.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="space-y-4">
           <Link href="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 transition-colors">
              <ChevronLeft size={16} /> Back to Dashboard
           </Link>
           <div className="flex items-center gap-3 border-b border-slate-800 pb-6">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400">
                 <MessageSquare size={28} />
              </div>
              <div>
                 <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Feedback Hub</h1>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Review counselor evaluations and mission status</p>
              </div>
           </div>
        </div>

        <StudentProfileView
          studentId={userId}
          hideHeader // Hiding header because AppShell/Page already provides context
        />
      </div>
    </AppShell>
  );
}
