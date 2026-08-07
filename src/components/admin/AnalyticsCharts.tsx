"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { Loader2, TrendingDown, Clock, Users, AlertTriangle } from "lucide-react";

const COLORS = ['#1a73e8', '#4285f4', '#669df6', '#8ab4f8', '#aecdfb'];

export default function AnalyticsCharts() {
  const [loading, setLoading] = useState(true);
  const [failureData, setFailureData] = useState<any[]>([]);
  const [avgTime, setAvgTime] = useState(0);
  const [backlog, setBacklog] = useState<any[]>([]);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    // 1. Module Failure Rates (Lowest Average Scores)
    const attemptsSnap = await getDocs(collection(db, "quiz_attempts"));
    const moduleStats: Record<string, { total: number, count: number }> = {};

    attemptsSnap.forEach(d => {
      const data = d.data();
      const mid = data.packTitle || "Unknown";
      if (!moduleStats[mid]) moduleStats[mid] = { total: 0, count: 0 };
      moduleStats[mid].total += data.score || 0;
      moduleStats[mid].count += 1;
    });

    const failureChart = Object.entries(moduleStats).map(([name, stats]) => ({
      name: name.split(':')[0],
      avg: Math.round(stats.total / stats.count)
    })).sort((a, b) => a.avg - b.avg);

    setFailureData(failureChart);

    // 2. Average Mock Interview Time
    const mockSnap = await getDocs(collection(db, "mock_interview_attempts"));
    let totalTime = 0;
    let mockCount = 0;
    const counselorBacklog: Record<string, number> = {};

    mockSnap.forEach(d => {
      const data = d.data();
      totalTime += data.timeTakenSeconds || 0;
      mockCount += 1;

      // 3. Counselor Backlog
      if (data.status !== 'reviewed') {
        const cname = data.studentName; // Simplified: in real app use counselor assigned to student
        counselorBacklog[cname] = (counselorBacklog[cname] || 0) + 1;
      }
    });

    setAvgTime(mockCount > 0 ? Math.round(totalTime / mockCount / 60) : 0);
    setBacklog(Object.entries(counselorBacklog).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));

    setLoading(false);
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-8 pb-20">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500"><Clock /></div>
            <p className="text-3xl font-black dark:text-white leading-none">{avgTime}m</p>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Avg Interview Length</p>
         </div>
         <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500"><TrendingDown /></div>
            <p className="text-3xl font-black dark:text-white leading-none">{failureData[0]?.avg || 0}%</p>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Lowest Success Rate (M1)</p>
         </div>
         <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500"><Users /></div>
            <p className="text-3xl font-black dark:text-white leading-none">{backlog.reduce((acc, curr) => acc + curr.count, 0)}</p>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Pending Review Dossiers</p>
         </div>
      </div>

      {/* Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 space-y-8">
            <div className="flex items-center justify-between">
               <h3 className="font-black dark:text-white uppercase tracking-tighter">Module Performance Score</h3>
               <AlertTriangle size={20} className="text-rose-500" />
            </div>
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={failureData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415510" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                     <Tooltip
                       cursor={{ fill: '#f1f5f9' }}
                       contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                     />
                     <Bar dataKey="avg" radius={[10, 10, 0, 0]}>
                        {failureData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 space-y-8">
            <h3 className="font-black dark:text-white uppercase tracking-tighter text-center">Counselor Review Load</h3>
            <div className="space-y-4">
               {backlog.slice(0, 5).map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-black text-white">{item.name.charAt(0)}</div>
                       <span className="text-xs font-bold dark:text-slate-200">{item.name}</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-[10px] font-black border border-rose-100 dark:border-rose-900/30">
                       {item.count} Pending
                    </span>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
