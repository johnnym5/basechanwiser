"use client";

import React, { useEffect, useState } from "react";
import AppShell from "@/components/layout/app-shell";
import Link from "next/link";
import { BookOpen, CheckCircle2, Play, Lock, Sparkles, FolderOpen } from "lucide-react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth/auth-context";
import { Module } from "@/types";

export default function LearningModulesPage() {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [completedModuleIds, setCompletedModuleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const snap = await getDocs(collection(db, "modules"));
        if (!snap.empty) {
          const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Module));
          setModules(fetched);
        } else {
          setModules([]);
        }

        if (user) {
          const progSnap = await getDoc(doc(db, "Progress", user.uid));
          if (progSnap.exists()) {
            setCompletedModuleIds(progSnap.data().completedModuleIds || []);
          }
        }
      } catch (err) {
        console.warn("Firestore fetch error:", err);
        setModules([]);
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
            <BookOpen className="w-6 h-6 text-[#1a73e8] dark:text-blue-400" /> Foundation Learning Modules
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Complete each module by scoring 80% or higher on the dynamic MCQ quiz.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 text-gray-500 dark:text-gray-400 font-semibold">
            <Sparkles className="w-5 h-5 animate-spin text-[#1a73e8] dark:text-blue-400" /> Loading modules...
          </div>
        ) : modules.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 border border-gray-200 dark:border-gray-700 text-center space-y-3">
            <FolderOpen className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-google">No Learning Modules Available Yet</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Counselors have not published any modules. Once a counselor creates a module in the Module Editor, it will appear here.
            </p>
          </div>
        ) : (
          /* Grid of Material Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod, idx) => {
              const isCompleted = completedModuleIds.includes(mod.id);
              const isLocked = idx > 0 && !completedModuleIds.includes(modules[idx - 1]?.id);

              return (
                <div
                  key={mod.id}
                  className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200/80 dark:border-gray-700 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Module #{idx + 1}
                      </span>
                      {isCompleted ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                        </span>
                      ) : isLocked ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                          <Lock className="w-3.5 h-3.5" /> Locked
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#1a73e8] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                          Available
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug">{mod.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3">{mod.description || "Video & MCQ quiz module."}</p>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/learning/detail?id=${mod.id}`}
                      className={`w-full py-3 px-4 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        isLocked
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                          : "bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-md shadow-blue-500/20"
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{isCompleted ? "Review Module" : "Start Learning & Quiz"}</span>
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
