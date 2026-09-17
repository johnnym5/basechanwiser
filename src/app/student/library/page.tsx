'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth/auth-context';
import AppShell from '@/components/layout/app-shell';
import ResourcePreviewModal from '@/components/library/ResourcePreviewModal';
import { BookOpen, FileText, Loader2, Video, Link2, ChevronLeft, Lock, ArrowRight, Play, Sparkles, CheckCircle2, Search, Filter, ArrowUpDown } from 'lucide-react';
import EmptyState from "@/components/common/EmptyState";
import Link from 'next/link';
import { TestQuestionSet } from '@/types/academy';
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Student Library: The primary entry point for study materials.
 * Paradigm: "Study First, Quiz Later"
 * Updated to Premium Executive Layout with Sequential Logic
 */
export default function StudentLibrary() {
  const { userId } = useAuth();
  const [resources, setResources] = useState<any[]>([]);
  const [coreModules, setCoreModules] = useState<TestQuestionSet[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [selectedResource, setSelectedResource] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (!userId) return;

    async function fetchData() {
      try {
        // 1. Fetch Core Modules to determine order/locking
        const setsSnap = await getDocs(query(
          collection(db, 'test_question_sets'),
          where('category', '==', 'core'),
          where('isArchived', '==', false)
        ));

        const core = setsSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as TestQuestionSet))
          .sort((a, b) => {
            const aNum = a.orderIndex !== undefined ? a.orderIndex : parseInt(a.title?.match(/\d+/)?.[0] || "999");
            const bNum = b.orderIndex !== undefined ? b.orderIndex : parseInt(b.title?.match(/\d+/)?.[0] || "999");
            return aNum - bNum;
          });
        setCoreModules(core);

        // 2. Fetch Quiz Attempts to calculate scores
        const attemptsSnap = await getDocs(query(
          collection(db, 'quiz_attempts'),
          where('userId', '==', userId)
        ));

        const tempScores: Record<string, number> = {};
        attemptsSnap.docs.forEach(d => {
          const attempt = d.data();
          const packId = attempt.packId || attempt.setId; // Handle both schemas if necessary
          const score = attempt.scorePercentage || 0;
          if (!tempScores[packId] || score > tempScores[packId]) {
            tempScores[packId] = score;
          }
        });
        setScores(tempScores);

        // 3. Listen to Library Resources (Real-time)
        const q = query(
          collection(db, 'library_resources'),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const allResources = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          // Filter for student visibility: isPublic OR assigned to this student
          const visible = allResources.filter((res: any) =>
            res.isPublic === true || (res.assignedStudentIds && res.assignedStudentIds.includes(userId))
          );

          setResources(visible);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching library data:", error);
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  const filteredResources = useMemo(() => {
    let result = [...resources];

    // 1. Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.title?.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term)
      );
    }

    // 2. Filter Type
    if (filterType !== 'all') {
      result = result.filter(r => r.fileType === filterType);
    }

    // 3. Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      if (sortBy === 'oldest') return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
      if (sortBy === 'alphabetical') return (a.title || '').localeCompare(b.title || '');
      return 0;
    });

    return result;
  }, [resources, searchTerm, filterType, sortBy]);

  return (
    <AppShell>
      <div className="space-y-10 animate-in fade-in duration-700 pb-20">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 transition-colors">
               <ChevronLeft size={16} /> Back to Dashboard
            </Link>
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                <BookOpen className="w-10 h-10 text-indigo-600" /> Resource Vault
              </h1>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest leading-relaxed max-w-2xl">
                Premium UKVI guides, University Briefings, and Strategic Credibility Materials.
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row items-center gap-4 bg-white/5 dark:bg-slate-900/40 backdrop-blur-md p-4 rounded-3xl border border-slate-200/10 dark:border-slate-800/50 shadow-sm">
           <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Search by title or protocol briefing..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all dark:text-white shadow-inner"
              />
           </div>

           <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-48">
                 <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                 <select
                   value={filterType}
                   onChange={(e) => setFilterType(e.target.value)}
                   className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-4 text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none cursor-pointer text-slate-600 dark:text-slate-300"
                 >
                    <option value="all">All Formats</option>
                    <option value="pdf">PDF Dossiers</option>
                    <option value="video">Video Briefings</option>
                    <option value="doc">Official Docs</option>
                    <option value="link">External Portals</option>
                 </select>
              </div>

              <div className="relative flex-1 lg:w-48">
                 <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                 <select
                   value={sortBy}
                   onChange={(e) => setSortBy(e.target.value)}
                   className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-4 text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none cursor-pointer text-slate-600 dark:text-slate-300"
                 >
                    <option value="newest">Recent First</option>
                    <option value="oldest">Legacy First</option>
                    <option value="alphabetical">A - Z Alpha</option>
                 </select>
              </div>
           </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-6 max-w-5xl">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-[32px]" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6 max-w-5xl">
            <AnimatePresence mode="popLayout">
              {filteredResources.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key="empty"
                >
                  <EmptyState
                    icon={Search}
                    title={searchTerm ? "No matching records" : "No Study Materials"}
                    description={searchTerm ? "No documents found matching your current search parameters." : "Your counselor hasn't assigned any resources yet."}
                  />
                </motion.div>
              ) : filteredResources.map((file, idx) => {
                // Determine if locked based on sequential module logic
                let isLocked = false;
                let moduleInfo = null;

                if (file.linkedPackId) {
                  const modIndex = coreModules.findIndex(m => m.id === file.linkedPackId);
                  if (modIndex !== -1) {
                    moduleInfo = coreModules[modIndex];
                    // If not the first module, check if previous module is passed (>= 80%)
                    if (modIndex > 0) {
                      const prevMod = coreModules[modIndex - 1];
                      const prevScore = scores[prevMod.id] || 0;
                      if (prevScore < 80) {
                        isLocked = true;
                      }
                    }
                  }
                }

                const score = file.linkedPackId ? scores[file.linkedPackId] || 0 : 0;
                const isPassed = score >= 80;

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    key={file.id}
                    className={`group relative transition-all duration-500 ${isLocked ? "opacity-50 grayscale" : ""}`}
                  >
                    <div
                      onClick={() => !isLocked && setSelectedResource(file)}
                      className={`
                        relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-10 rounded-[32px] border-2 transition-all duration-500 cursor-pointer
                        ${isLocked
                          ? "bg-white/30 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800"
                          : "bg-white dark:bg-slate-900/40 backdrop-blur-md border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:border-indigo-500/50 hover:-translate-y-1"}
                      `}
                    >
                      <div className="flex items-center gap-8 w-full md:w-auto">
                        {/* Visual Type Indicator */}
                        <div className={`
                          w-20 h-20 rounded-[24px] flex items-center justify-center shrink-0 border-2 transition-all duration-500
                          ${isLocked
                            ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300"
                            : "bg-indigo-50 dark:bg-slate-800 border-indigo-100 dark:border-indigo-900/30 text-indigo-500 shadow-lg shadow-indigo-500/5 group-hover:scale-105"}
                        `}>
                          {isLocked ? <Lock className="w-8 h-8" /> : (
                            <>
                              {file.fileType === 'pdf' && <FileText className="w-10 h-10 text-rose-500" />}
                              {file.fileType === 'video' && <Video className="w-10 h-10 text-blue-500" />}
                              {file.fileType === 'doc' && <FileText className="w-10 h-10 text-emerald-500" />}
                              {file.fileType === 'link' && <Link2 className="w-10 h-10 text-indigo-500" />}
                            </>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isLocked ? 'text-slate-400' : 'text-indigo-500'}`}>
                              {file.fileType} File {moduleInfo && `• Step ${moduleInfo.orderIndex || ''}`}
                            </span>
                            {file.linkedPackId && (
                              <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                                isPassed
                                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-800"
                                  : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-800"
                              }`}>
                                Quiz Linked {isPassed && `• ${score}%`}
                              </div>
                            )}
                          </div>
                          <h3 className={`text-2xl font-black tracking-tighter uppercase ${isLocked ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                            {file.title?.replace(/_/g, ' ')}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed line-clamp-2 max-w-lg">
                            {file.description || 'Access guides and university preparation documents.'}
                          </p>
                        </div>
                      </div>

                      <div className="w-full md:w-auto flex flex-col gap-3 pt-6 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 min-w-[240px] justify-center">
                        {isLocked ? (
                          <div className="w-full py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border border-dashed border-slate-200 dark:border-slate-800">
                            <Lock className="w-4 h-4" /> Locked: Complete previous step
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedResource(file);
                              }}
                              className="w-full py-5 bg-indigo-600 text-white rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                              <BookOpen className="w-4 h-4" />
                              Study Material
                            </button>

                            {file.linkedPackId ? (
                              <Link
                                href={`/learning/detail?packId=${file.linkedPackId}`}
                                onClick={(e) => e.stopPropagation()}
                                className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all border
                                  ${isPassed
                                    ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100"
                                    : "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:text-indigo-600"}`}
                              >
                                {isPassed ? "Review Quiz" : "Jump to Quiz"} <ArrowRight className="w-3 h-3" />
                              </Link>
                            ) : (
                              <div className="h-[42px] invisible" aria-hidden="true" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {selectedResource && (
          <ResourcePreviewModal
            resource={selectedResource}
            onClose={() => setSelectedResource(null)}
          />
        )}
      </div>
    </AppShell>
  );
}
