"use client";

import React, { useState, useEffect, useMemo } from "react";
import AppShell from "@/components/layout/app-shell";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Megaphone,
  UserPlus,
  FileText,
  Clock,
  Zap,
  Users,
  Award,
  TrendingUp,
  ChevronRight,
  ClipboardList,
  Loader2,
  Play,
  ArrowRight
} from "lucide-react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface PriorityTask {
  id: string;
  type: 'mock' | 'dossier';
  title: string;
  subtitle: string;
  timestamp: any;
  studentId: string;
}

export default function CounselorDashboard() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [students, setStudents] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [priorityTasks, setPriorityTasks] = useState<PriorityTask[]>([]);
  const [liveActivities, setLiveActivities] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && role !== "Counselor" && role !== "Admin" && role !== "Super Admin") {
      router.push("/dashboard");
    }
  }, [role, loading, router]);

  const fetchDashboardData = async () => {
    try {
      setDataLoading(true);

      // ── VISIBILITY RESTRICTION: Counselors only see assigned data ──
      let usersQuery = query(collection(db, "Users"));
      let packsQuery = query(collection(db, "Interview_Packs"), where("status", "==", "Submitted"));
      let mocksQuery = query(collection(db, "mock_interview_attempts"), where("status", "==", "pending_review"), limit(10));

      if (role === 'Counselor' && user) {
        usersQuery = query(collection(db, "Users"), where('assignedCounselorId', '==', user.uid));
        // Strict cross-collection filtering for Counselors
        packsQuery = query(collection(db, "Interview_Packs"), where("status", "==", "Submitted"), where("counselorId", "==", user.uid));
        mocksQuery = query(collection(db, "mock_interview_attempts"), where("status", "==", "pending_review"), where("counselorId", "==", user.uid), limit(10));
      }

      const [usersSnap, packsSnap, mocksSnap, logsSnap] = await Promise.all([
        getDocs(usersQuery),
        getDocs(packsQuery),
        getDocs(mocksQuery),
        getDocs(query(collection(db, "activity_logs"), orderBy("createdAt", "desc"), limit(5)))
      ]);

      const studentList = usersSnap.docs
        .filter(d => d.data().role === "Student" || !d.data().role)
        .map(d => ({ uid: d.id, ...d.data() }));

      const studentIds = studentList.map(s => s.uid);

      setStudents(studentList);

      // ── Process Activity Logs ──
      const logs = logsSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(log => role !== 'Counselor' || studentIds.includes(log.studentId));

      setLiveActivities(logs);

      // ── Build Priority Action items ──
      const tasks: PriorityTask[] = [];

      // 1. Pending Mock Interviews
      mocksSnap.forEach(doc => {
        const data = doc.data() as any;
        if (role !== 'Counselor' || studentIds.includes(data.studentId)) {
          tasks.push({
            id: doc.id,
            type: 'mock',
            title: "Grade Pending Mock Interview",
            subtitle: `Student: ${data.studentName || 'Unknown'} • Submitted recently`,
            timestamp: data.submittedAt,
            studentId: data.studentId
          });
        }
      });

      // 2. Unverified Dossiers
      packsSnap.forEach(doc => {
        const data = doc.data() as any;
        if (role !== 'Counselor' || studentIds.includes(data.userId)) {
          tasks.push({
            id: doc.id,
            type: 'dossier',
            title: "Verify Compliance Dossier",
            subtitle: `Scholar: ${data.studentName || 'Unknown'} • Needs audit`,
            timestamp: data.updatedAt,
            studentId: data.userId
          });
        }
      });

      setPriorityTasks(tasks.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));

    } catch (err) {
      console.warn("Dashboard fetch error:", err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const metrics = useMemo(() => {
    const total = students.length;
    const atRisk = students.filter(s => s.readinessStatus === 'Red').length;
    const ready = students.filter(s => s.readinessStatus === 'Green').length;
    const inProgress = students.filter(s => s.readinessStatus === 'Yellow' || s.readinessStatus === 'Orange').length;

    return { total, atRisk, ready, inProgress };
  }, [students]);

  if (loading || dataLoading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Synchronizing Command Center...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">

        {/* ── 1. KPI QUICK LINKS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <StatLink
            title="Total Students"
            value={metrics.total}
            icon={Users}
            color="indigo"
            href="/counselor/students"
          />
          <StatLink
            title="At-Risk (Urgent)"
            value={metrics.atRisk}
            icon={AlertCircle}
            color="rose"
            href="/counselor/students?filter=AT_RISK"
          />
          <StatLink
            title="In-Progress"
            value={metrics.inProgress}
            icon={TrendingUp}
            color="amber"
            href="/counselor/students?filter=IN_PROGRESS"
          />
          <StatLink
            title="Mission Ready"
            value={metrics.ready}
            icon={CheckCircle2}
            color="emerald"
            href="/counselor/students?filter=READY"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── 2. PRIORITY ACTION CENTER (Left 2 Columns) ── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-800 rounded-[40px] p-8 shadow-sm h-full">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center">
                   <CheckCircle2 className="mr-3 text-blue-500" /> Priority Action Center
                 </h2>
                 <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase rounded-full border border-blue-100 dark:border-blue-900/30">
                    {priorityTasks.length} Pending Tasks
                 </span>
              </div>

              <div className="space-y-4">
                {priorityTasks.length === 0 ? (
                  <div className="p-20 text-center space-y-3 opacity-40">
                     <ClipboardList className="w-12 h-12 mx-auto" />
                     <p className="text-xs font-bold uppercase tracking-widest">No pending priority actions.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {priorityTasks.map((task, idx) => {
                      const hoursOld = task.timestamp?.seconds
                        ? (Date.now() / 1000 - task.timestamp.seconds) / 3600
                        : 0;

                      const getSLAStyles = (hours: number) => {
                        if (hours > 48) return 'border-red-500/50 bg-red-500/5 hover:bg-red-500/10';
                        if (hours > 24) return 'border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10';
                        return 'border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-[#0F172A] hover:border-blue-500/50';
                      };

                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`flex items-center justify-between p-5 rounded-3xl border transition-all group shadow-sm ${getSLAStyles(hoursOld)}`}
                        >
                          <div className="flex items-center gap-5">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${task.type === 'mock' ? 'bg-orange-50 text-orange-500 shadow-inner' : 'bg-blue-50 text-blue-500 shadow-inner'}`}>
                              {task.type === 'mock' ? <Zap size={24} /> : <FileText size={24} />}
                            </div>
                            <div>
                              <p className="text-sm font-black dark:text-white uppercase tracking-tighter">{task.title}</p>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{task.subtitle}</p>
                            </div>
                          </div>
                          <Link
                            href={task.type === 'mock'
                              ? `/counselor/mock-interviews/playback?attemptId=${task.id}`
                              : `/counselor/students/portfolio?id=${task.studentId}`}
                            className="px-5 py-2.5 bg-white dark:bg-[#1E293B] hover:bg-blue-600 hover:text-white dark:text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-all flex items-center gap-2"
                          >
                            Review Now <ChevronRight size={14} />
                          </Link>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>

          {/* ── 3. QUICK ACTIONS & ACTIVITY FEED (Right Column) ── */}
          <div className="space-y-8">

            {/* Quick Actions */}
            <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-800 rounded-[40px] p-8 shadow-sm">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Quick Infrastructure</h2>
              <div className="grid grid-cols-2 gap-4">
                <QuickActionButton
                   icon={UserPlus}
                   label="Add Student"
                   color="blue"
                   onClick={() => router.push('/counselor/students')}
                />
                <QuickActionButton
                   icon={Megaphone}
                   label="Broadcast"
                   color="emerald"
                />
                <QuickActionButton
                   icon={Play}
                   label="Conduct Live"
                   color="indigo"
                />
                <QuickActionButton
                   icon={ClipboardList}
                   label="View Rubrics"
                   color="purple"
                   onClick={() => router.push('/counselor/settings')}
                />
              </div>
            </div>

            {/* Live Activity Feed */}
            <div className="bg-[#0F172A] rounded-[40px] p-8 text-white shadow-2xl space-y-6">
               <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Live Activity Feed</h2>
               <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:h-full before:w-0.5 before:bg-blue-900/30">
                  {liveActivities.length === 0 ? (
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center py-10 italic">No recent activity detected.</p>
                  ) : (
                    liveActivities.map((log) => {
                      const timeStr = log.createdAt?.seconds
                        ? formatDistanceToNow(log.createdAt.seconds * 1000) + ' ago'
                        : 'Just now';

                      const iconMap: any = {
                        'ACADEMY_MODULE': CheckCircle2,
                        'MOCK_INTERVIEW': Zap,
                        'DOCUMENT': FileText,
                        'SYSTEM': Clock
                      };

                      const colorMap: any = {
                        'ACADEMY_MODULE': 'emerald',
                        'MOCK_INTERVIEW': 'orange',
                        'DOCUMENT': 'blue',
                        'SYSTEM': 'indigo'
                      };

                      return (
                        <ActivityItem
                          key={log.id}
                          studentId={log.studentId}
                          user={log.studentName}
                          action={log.action}
                          time={timeStr}
                          icon={iconMap[log.type] || Clock}
                          color={colorMap[log.type] || 'indigo'}
                        />
                      );
                    })
                  )}
               </div>
               <Link href="/counselor/activity-log" className="block w-full py-3 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-blue-400 transition-all text-center">
                  View Full Event Log
               </Link>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatLink({ title, value, icon: Icon, color, href }: any) {
  const colorMap: any = {
    blue: "text-blue-500 bg-blue-50 dark:bg-blue-900/10 border-blue-100",
    emerald: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100",
    rose: "text-rose-500 bg-rose-50 dark:bg-rose-900/10 border-rose-100",
    amber: "text-amber-500 bg-amber-50 dark:bg-amber-900/10 border-amber-100",
    indigo: "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100",
  };

  return (
    <Link href={href} className="bg-white dark:bg-[#1E293B] p-6 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm hover:border-blue-500/50 transition-all group">
       <div className="flex justify-between items-start">
         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">{title}</span>
         <div className={`p-2 rounded-xl ${colorMap[color].split(' ')[1]} group-hover:scale-110 transition-transform`}>
           <Icon className={`w-4 h-4 ${colorMap[color].split(' ')[0]}`} />
         </div>
       </div>
       <p className="text-3xl font-black text-gray-900 dark:text-white mt-4 tracking-tighter">{value}</p>
    </Link>
  );
}

function QuickActionButton({ icon: Icon, label, color, onClick }: any) {
  const colorMap: any = {
    blue: "text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 hover:border-blue-500/50",
    emerald: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-500/50",
    indigo: "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30 hover:border-indigo-500/50",
    purple: "text-purple-500 bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/30 hover:border-purple-500/50",
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all hover:scale-105 active:scale-95 ${colorMap[color]}`}
    >
      <Icon size={24} className="mb-3" />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function ActivityItem({ studentId, user, action, time, icon: Icon, color }: any) {
  const colorMap: any = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    orange: "bg-orange-500",
    indigo: "bg-indigo-500",
  };

  return (
    <Link href={`/counselor/students/portfolio?id=${studentId}`} className="relative flex items-center gap-4 group cursor-pointer">
      <div className={`w-4 h-4 rounded-full border-4 border-[#0F172A] ${colorMap[color]} shrink-0 z-10 transition-transform group-hover:scale-125`} />
      <div className="flex-1 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/5 group-hover:border-white/20 group-hover:bg-white/10 transition-all">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-black uppercase tracking-tight">{user}</span>
          <time className="text-[9px] font-bold text-gray-500 flex items-center"><Clock size={10} className="mr-1"/> {time}</time>
        </div>
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">{action}</p>
      </div>
    </Link>
  );
}
