"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Trophy, Crown, Sparkles, Loader2, User, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import EmptyState from "./EmptyState";

interface LeaderboardEntry {
  userId: string;
  studentId?: string;
  studentName: string;
  gamifiedScore: number;
  packId: string;
  packTitle: string;
  score: number;
  createdAt: any;
}

type TimeFilter = 'total' | 'week' | 'day';
type ModuleFilter = 'all' | 'module_1' | 'module_2' | 'module_3' | 'module_4' | 'module_5';

interface LeaderboardViewProps {
  isCounselorView?: boolean;
}

export default function LeaderboardView({ isCounselorView = false }: LeaderboardViewProps) {
  const { userId: currentUserId } = useAuth();
  const router = useRouter();
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('total');
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>('all');

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const q = query(
          collection(db, "quiz_attempts"),
          orderBy("gamifiedScore", "desc"),
          limit(100)
        );
        const snap = await getDocs(q);

        const list = snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            userId: data.userId,
            studentId: data.studentId,
            studentName: data.studentName,
            gamifiedScore: data.gamifiedScore,
            packId: data.packId,
            packTitle: data.packTitle,
            score: data.score,
            createdAt: data.createdAt
          } as LeaderboardEntry;
        });

        setAllEntries(list);
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    const now = new Date();

    // 1. Filter by Timeframe
    let filtered = allEntries.filter((item) => {
      const itemDate = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);

      if (timeFilter === 'day') {
        return itemDate.toDateString() === now.toDateString();
      }

      if (timeFilter === 'week') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return itemDate >= sevenDaysAgo;
      }

      return true; // 'total'
    });

    // 2. Filter by Module
    filtered = filtered.filter((item) => {
      if (moduleFilter === 'all') return true;
      return item.packId === moduleFilter;
    });

    // 3. Aggregate highest score per user
    const topUserMap = new Map<string, LeaderboardEntry>();

    filtered.forEach((attempt) => {
      const existing = topUserMap.get(attempt.userId);
      // Logic: Only update if user is not in map OR if new attempt has higher gamifiedScore
      if (!existing || attempt.gamifiedScore > existing.gamifiedScore) {
        topUserMap.set(attempt.userId, attempt);
      }
    });

    const finalEntries = Array.from(topUserMap.values())
      .sort((a, b) => b.gamifiedScore - a.gamifiedScore)
      .slice(0, 10);

    setFilteredEntries(finalEntries);
  }, [allEntries, timeFilter, moduleFilter]);

  const handleRowClick = (userId: string) => {
    if (isCounselorView) {
      router.push(`/counselor/students/portfolio?id=${userId}`);
    }
  };

  const topThree = filteredEntries.slice(0, 3);
  const others = filteredEntries.slice(3);

  const formatName = (entry: LeaderboardEntry) => {
    if (isCounselorView) {
      return `${entry.studentName} (${entry.studentId || "BW-XXXXX"})`;
    }
    return entry.userId === currentUserId ? entry.studentName : (entry.studentId || "BW-STUDENT");
  };

  const getInitial = (entry: LeaderboardEntry) => {
    const name = entry.userId === currentUserId || isCounselorView ? entry.studentName : (entry.studentId || "B");
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="space-y-12">
      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-slate-800 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-sm mb-6">
        <div className="flex gap-2 bg-gray-50 dark:bg-slate-900 p-1 rounded-2xl border border-gray-100 dark:border-slate-800">
          {(['total', 'week', 'day'] as TimeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTimeFilter(t)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                timeFilter === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t === 'total' ? 'All-Time' : t === 'week' ? 'Weekly' : 'Today'}
            </button>
          ))}
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value as ModuleFilter)}
          className="px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none min-w-[200px]"
        >
          <option value="all">All Modules</option>
          <option value="module_1">Module 1: Fundamentals</option>
          <option value="module_2">Module 2: CAS & Finance</option>
          <option value="module_3">Module 3: Course Knowledge</option>
          <option value="module_4">Module 4: Career & Return</option>
          <option value="module_5">Module 5: Behavioral</option>
        </select>
      </div>

      {filteredEntries.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No Rankings Found"
          description="Try adjusting your filters to find top scholars."
        />
      ) : (
        <>
          {/* ── Podium ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-4xl mx-auto">
             {/* 2nd Place */}
             {topThree[1] && (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2 }}
                 className="order-2 md:order-1 space-y-4"
               >
                  <div className="text-center">
                     <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-slate-300 mx-auto flex items-center justify-center relative shadow-xl">
                        <User className="w-8 h-8 text-slate-400" />
                        <div className="absolute -bottom-2 bg-slate-300 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-md">#2</div>
                     </div>
                     <p className="mt-4 font-black dark:text-white uppercase tracking-tighter truncate px-4">
                        {formatName(topThree[1])}
                     </p>
                     <p className="text-[10px] font-bold text-slate-500 uppercase">{topThree[1].gamifiedScore.toLocaleString()} PTS</p>
                  </div>
                  <div className="h-32 bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900/50 rounded-t-[32px] border-x border-t border-slate-300/30" />
               </motion.div>
             )}

             {/* 1st Place */}
             {topThree[0] && (
               <motion.div
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="order-1 md:order-2 space-y-4"
               >
                  <div className="text-center relative">
                     <div className="absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce">
                        <Crown className="w-10 h-10 text-amber-500 fill-amber-500" />
                     </div>
                     <div className="w-28 h-28 rounded-full bg-amber-50 dark:bg-amber-900/20 border-4 border-amber-500 mx-auto flex items-center justify-center relative shadow-[0_20px_50px_rgba(245,158,11,0.3)]">
                        <User className="w-10 h-10 text-amber-600" />
                        <div className="absolute -bottom-2 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-md">#1</div>
                     </div>
                     <p className="mt-4 text-lg font-black dark:text-white uppercase tracking-tighter truncate px-4">
                        {formatName(topThree[0])}
                     </p>
                     <p className="text-xs font-bold text-amber-600 uppercase">{topThree[0].gamifiedScore.toLocaleString()} PTS</p>
                  </div>
                  <div className="h-48 bg-gradient-to-t from-amber-500/20 to-amber-500/5 dark:from-amber-900/40 dark:to-amber-900/10 rounded-t-[40px] border-x border-t border-amber-500/30" />
               </motion.div>
             )}

             {/* 3rd Place */}
             {topThree[2] && (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.4 }}
                 className="order-3 space-y-4"
               >
                  <div className="text-center">
                     <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-900/20 border-4 border-orange-400 mx-auto flex items-center justify-center relative shadow-xl">
                        <User className="w-6 h-6 text-orange-400" />
                        <div className="absolute -bottom-2 bg-orange-400 text-white text-[10px] font-black px-2 py-0.5 rounded-md">#3</div>
                     </div>
                     <p className="mt-4 font-black dark:text-white uppercase tracking-tighter truncate px-4">
                        {formatName(topThree[2])}
                     </p>
                     <p className="text-[10px] font-bold text-orange-500 uppercase">{topThree[2].gamifiedScore.toLocaleString()} PTS</p>
                  </div>
                  <div className="h-24 bg-gradient-to-t from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-900/10 rounded-t-[24px] border-x border-t border-orange-400/30" />
               </motion.div>
             )}
          </div>

          {/* ── Table List ── */}
          <div className="bg-white dark:bg-[#1E293B] rounded-[40px] border border-gray-100 dark:border-slate-800 shadow-xl overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-[#0F172A] border-b border-gray-100 dark:border-slate-800">
                   <tr>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Rank</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Scholar</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Mission</th>
                      <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Score</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                   {filteredEntries.map((entry, idx) => (
                      <tr
                        key={idx}
                        onClick={() => handleRowClick(entry.userId)}
                        className={`group transition-all ${isCounselorView ? 'cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-900/10' : 'hover:bg-gray-50/10'}`}
                      >
                         <td className="px-8 py-6 font-black text-gray-400">#{idx + 1}</td>
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#0F172A] flex items-center justify-center font-black text-blue-500 text-xs">
                                  {getInitial(entry)}
                               </div>
                               <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                                  {formatName(entry)}
                               </span>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <span className="text-[10px] font-bold text-gray-500 uppercase">{entry.packTitle}</span>
                         </td>
                         <td className="px-8 py-6 text-right">
                            <div className="flex flex-col items-end">
                               <span className="text-sm font-black text-blue-600">{entry.gamifiedScore.toLocaleString()}</span>
                               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{entry.score}% Accuracy</span>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </>
      )}
    </div>
  );
}
