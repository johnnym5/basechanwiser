"use client";

import React, { useEffect, useState } from "react";
import AppShell from "@/components/layout/app-shell";
import Link from "next/link";
import { BookOpen, CheckCircle2, Play, Lock, Sparkles, FolderOpen, Award, HelpCircle } from "lucide-react";
import { collection, getDocs, doc, getDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth/auth-context";
import { LearningModule, UserProfile } from "@/types";
import ResourceVaultModal from "@/components/common/ResourceVaultModal";

export default function LearningModulesPage() {
  const { user } = useAuth();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Get user profile
        if (user) {
          const userSnap = await getDoc(doc(db, "Users", user.uid));
          if (userSnap.exists()) {
            setUserProfile({ uid: userSnap.id, ...userSnap.data() } as UserProfile);
          }
        }

        // 2. Get all learning modules from Firestore, ordered by 'order'
        const modulesSnap = await getDocs(query(collection(db, "learning_modules"), orderBy("order", "asc")));
        if (!modulesSnap.empty) {
          const allModules = modulesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as LearningModule));
          setModules(allModules);
        } else {
          setModules([]);
        }
      } catch (err) {
        console.warn("Learning modules fetch error:", err);
        setModules([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const currentLevel = userProfile?.currentModuleLevel || 1;
  const moduleScores = userProfile?.moduleScores || {};

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
          <button
            onClick={() => setIsVaultOpen(true)}
            className="shrink-0 px-5 py-3 rounded-2xl bg-white hover:bg-blue-50 text-[#1a73e8] font-bold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95"
          >
            <FolderOpen className="w-4 h-4 text-[#1a73e8]" /> Open Resource Vault
          </button>
        </div>

        <ResourceVaultModal isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} />

        {loading ? (
          <div className="flex items-center justify-center p-12 text-gray-500 dark:text-gray-400 font-semibold">
            <Sparkles className="w-5 h-5 animate-spin text-[#1a73e8] dark:text-blue-400" /> Loading learning track...
          </div>
        ) : modules.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 border border-gray-200 dark:border-gray-700 text-center space-y-3">
            <FolderOpen className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-google">No Learning Modules Available</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              The UKVI Credibility framework modules have not been initialized yet.
            </p>
          </div>
        ) : (
          /* Grid of Module Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod) => {
              const isLocked = mod.order > currentLevel;
              const score = moduleScores[mod.id];
              const isPassed = score !== undefined && score >= (mod.passScore || 80);

              return (
                <div
                  key={mod.id}
                  className={`bg-white dark:bg-gray-800 rounded-3xl p-6 border shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                    isLocked
                      ? "opacity-60 grayscale border-gray-200 dark:border-gray-700"
                      : "border-gray-200/80 dark:border-gray-700 hover:shadow-md"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        Module {mod.order}
                      </span>
                      {isLocked ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          <Lock className="w-3.5 h-3.5" /> Locked
                        </span>
                      ) : isPassed ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passed ({score}%)
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#1a73e8] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                          {score !== undefined ? `Retake (${score}%)` : "Start"}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug">{mod.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3">{mod.description || "UKVI Credibility Learning Module."}</p>

                    <div className="flex items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-300 pt-1">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-[#1a73e8] dark:text-blue-400" />
                        {mod.questions ? mod.questions.length : 0} Questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        Pass: {mod.passScore || 80}%
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    {isLocked ? (
                      <div className="w-full py-3 px-4 rounded-full text-xs font-bold flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-400 border border-gray-200 dark:border-gray-600">
                        <Lock className="w-4 h-4" />
                        <span>Score 80% in Module {mod.order - 1} to unlock</span>
                      </div>
                    ) : (
                      <Link
                        href={`/learning/detail?packId=${mod.id}`}
                        className="w-full py-3 px-4 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-md shadow-blue-500/20"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>{isPassed ? "Review Module" : score !== undefined ? "Retake Quiz" : "Start Learning"}</span>
                      </Link>
                    )}
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
