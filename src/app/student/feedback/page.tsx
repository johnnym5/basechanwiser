"use client";

import React from "react";
import AppShell from "@/components/layout/app-shell";
import StudentProfileView from "@/components/student/StudentProfileView";
import { useAuth } from "@/lib/auth/auth-context";
import { MessageSquare, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentFeedbackHubPage() {
  const { userId, loading } = useAuth();

  return (
    <AppShell>
      {loading ? (
        <div className="space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-6">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-[600px] w-full rounded-3xl" />
            <div className="lg:col-span-2">
              <Skeleton className="h-[600px] w-full rounded-3xl" />
            </div>
          </div>
        </div>
      ) : !userId ? (
        <div className="p-20 text-center">
          <p className="text-gray-500 font-bold">Please log in to view your feedback.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="space-y-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 transition-colors"
            >
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
      )}
    </AppShell>
  );
}
