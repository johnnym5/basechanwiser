"use client";

import React, { useEffect, useState } from "react";
import AppShell from "@/components/layout/app-shell";
import Link from "next/link";
import { BookOpen, CheckCircle2, Play, Lock, Sparkles, FolderOpen, Award, HelpCircle } from "lucide-react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth/auth-context";
import { QuestionPack, UserProfile } from "@/types";

export default function LearningModulesPage() {
  const { user } = useAuth();
  const [assignedPacks, setAssignedPacks] = useState<QuestionPack[]>([]);
  const [completedPackIds, setCompletedPackIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Get user profile to check assignedPackIds
        let userAssignedIds: string[] = [];
        if (user) {
          const userSnap = await getDoc(doc(db, "Users", user.uid));
          if (userSnap.exists()) {
            const uData = userSnap.data() as UserProfile;
            userAssignedIds = uData.assignedPackIds || [];
          }

          const progSnap = await getDoc(doc(db, "Progress", user.uid));
          if (progSnap.exists()) {
            setCompletedPackIds(progSnap.data().completedPackIds || progSnap.data().completedModuleIds || []);
          }
        }

        // 2. Get all question packs from Firestore
        const packsSnap = await getDocs(collection(db, "question_packs"));
        if (!packsSnap.empty) {
          const allPacks = packsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as QuestionPack));

          // Filter: pack is default OR student has explicit assignment
          const studentPacks = allPacks.filter(
            (pack) => pack.isDefault || userAssignedIds.includes(pack.id)
          );

          setAssignedPacks(studentPacks);
        } else {
          setAssignedPacks([]);
        }
      } catch (err) {
        console.warn("Learning packs fetch error:", err);
        setAssignedPacks([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 font-google">
            <BookOpen className="w-6 h-6 text-[#1a73e8] dark:text-blue-400" /> Assigned Learning Drills & Question Packs
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Complete your assigned compliance drills and pass each MCQ quiz to build interview readiness.
          </p>
        </div>

        {/* ── Google Drive Study Resource Vault Banner ───────────── */}
        <div className="bg-gradient-to-r from-blue-600 via-[#1a73e8] to-indigo-600 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-google font-extrabold text-lg">
              <FolderOpen className="w-6 h-6" /> Google Drive Resource Vault
            </div>
            <p className="text-xs text-blue-100 max-w-xl">
              Access staff-curated video tutorials, UKVI visa compliance guides, financial template calculators, and interview prep resources in our official Google Drive folder.
            </p>
          </div>
          <a
            href="https://drive.google.com/drive/folders/1Wp7SweOk4_wZAVjpOpicYiQdVYR1EKNb?usp=sharing"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 px-5 py-3 rounded-2xl bg-white hover:bg-blue-50 text-[#1a73e8] font-bold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95"
          >
            <FolderOpen className="w-4 h-4 text-[#1a73e8]" /> Open Google Drive Vault
          </a>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 text-gray-500 dark:text-gray-400 font-semibold">
            <Sparkles className="w-5 h-5 animate-spin text-[#1a73e8] dark:text-blue-400" /> Loading assigned drills...
          </div>
        ) : assignedPacks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 border border-gray-200 dark:border-gray-700 text-center space-y-3">
            <FolderOpen className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-google">No Active Drills Assigned Yet</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Your counselor has not assigned any custom compliance question packs to your account yet. Contact your assigned counselor for access.
            </p>
          </div>
        ) : (
          /* Grid of Pack Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignedPacks.map((pack, idx) => {
              const isCompleted = completedPackIds.includes(pack.id);
              const isLocked = false; // All assigned packs are accessible

              return (
                <div
                  key={pack.id}
                  className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200/80 dark:border-gray-700 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {pack.category || "General Compliance"}
                      </span>
                      {isCompleted ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#1a73e8] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                          Available
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug">{pack.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3">{pack.description || "Compliance video & MCQ quiz drill."}</p>

                    <div className="flex items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-300 pt-1">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-[#1a73e8] dark:text-blue-400" />
                        {pack.questions ? pack.questions.length : 0} Questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        Pass: {pack.passScore || 80}%
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/learning/detail?packId=${pack.id}`}
                      className="w-full py-3 px-4 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-md shadow-blue-500/20"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{isCompleted ? "Review Drill Pack" : "Start Learning & Quiz"}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
