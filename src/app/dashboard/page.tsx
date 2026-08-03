"use client";

import React, { useEffect, useState } from "react";
import AppShell from "@/components/layout/app-shell";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import {
  BookOpen,
  FileCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function StudentDashboardPage() {
  const { user, userProfile } = useAuth();

  const [completedModulesCount, setCompletedModulesCount] = useState<number>(0);
  const [totalModulesCount] = useState<number>(5);
  const [interviewPackSubmitted, setInterviewPackSubmitted] = useState<boolean>(false);

  useEffect(() => {
    async function fetchStudentProgress() {
      if (!user) return;
      try {
        const progRef = doc(db, "Progress", user.uid);
        const snap = await getDoc(progRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.completedModuleIds) {
            setCompletedModulesCount(data.completedModuleIds.length);
          }
        }

        const packRef = doc(db, "Interview_Packs", user.uid);
        const packSnap = await getDoc(packRef);
        if (packSnap.exists()) {
          setInterviewPackSubmitted(true);
        }
      } catch (err) {
        console.warn("Fetch progress offline fallback:", err);
      }
    }
    fetchStudentProgress();
  }, [user]);

  const percentage = Math.round((completedModulesCount / totalModulesCount) * 100);
  const isModulesComplete = completedModulesCount >= totalModulesCount;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Screen 2 Hero Section: Welcome & Large Progress Ring */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 border border-gray-200/80 dark:border-gray-700 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-800">
              Student Preparation Tracker
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight font-google">
              Welcome back, {user?.displayName || "Student"} 👋
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
              Complete your foundation learning modules and submit your interview pack to prepare for Junior Compliance.
            </p>
          </div>

          {/* Progress Circular Widget */}
          <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-700">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="#1a73e8"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={213.6}
                  strokeDashoffset={213.6 - (213.6 * percentage) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <span className="absolute text-sm font-extrabold text-[#1a73e8] dark:text-blue-400">{percentage}%</span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">Overall Readiness</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">{completedModulesCount} of {totalModulesCount} Modules Passed</p>
            </div>
          </div>
        </div>

        {/* Current Readiness Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200/80 dark:border-gray-700 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1a73e8] dark:text-blue-400" /> Current Readiness Status
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                interviewPackSubmitted
                  ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : isModulesComplete
                  ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700"
              }`}
            >
              {interviewPackSubmitted
                ? "Awaiting Junior Compliance Interview"
                : isModulesComplete
                ? "Ready for Interview Pack Submission"
                : "Foundation Learning In Progress"}
            </span>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            {interviewPackSubmitted
              ? "Your Interview Pack has been submitted. A Counselor will evaluate your profile and schedule your Junior Compliance Interview."
              : isModulesComplete
              ? "Great job completing all foundation modules! Please fill out your Interview Pack below."
              : "Complete all foundation video modules with at least an 80% quiz score to unlock the Interview Pack."}
          </p>
        </div>

        {/* Action List Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Foundation Modules */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200/80 dark:border-gray-700 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-400 flex items-center justify-center font-bold border border-blue-200 dark:border-blue-800">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white text-base">Foundation Learning Modules</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Watch foundational videos and pass 10-question MCQ quizzes with an 80%+ score.
              </p>
            </div>

            <Link
              href="/learning"
              className="w-full py-3 px-4 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20"
            >
              <span>Go to Learning Modules</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2: Interview Pack */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200/80 dark:border-gray-700 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold border ${
                  isModulesComplete
                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700"
                }`}
              >
                {isModulesComplete ? <FileCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white text-base">Student Interview Pack</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Multi-step form covering Application Details, Financials, and Career Goals.
              </p>
            </div>

            <Link
              href="/interview-pack"
              className={`w-full py-3 px-4 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isModulesComplete
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
                  : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
              }`}
            >
              <span>{interviewPackSubmitted ? "View Submitted Pack" : "Fill Interview Pack"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
