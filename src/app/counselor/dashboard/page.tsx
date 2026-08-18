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
  User,
  Award,
  TrendingUp,
  ChevronRight,
  ClipboardList,
  Loader2,
  ArrowRight,
  FolderDown,
  Calendar,
  BellRing,
  FileDown,
  CheckCircle,
  ChevronLeft,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  collection,
  getDocs,
  doc,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { withTimeout } from "@/lib/utils/promise-timeout";

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
  const [scheduledSessions, setScheduledSessions] = useState<any[]>([]);

  // ── Action Center Filter & Pagination ──
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'mock' | 'dossier'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 5;

  const filteredTasks = useMemo(() => {
    return priorityTasks.filter(t => taskFilter === 'ALL' || t.type === taskFilter);
  }, [priorityTasks, taskFilter]);

  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
  const visibleTasks = filteredTasks.slice((currentPage - 1) * tasksPerPage, currentPage * tasksPerPage);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [taskFilter]);

  // ── Pagination & Grouping State for Live Activity ──
  const [activityPage, setActivityPage] = useState(1);
  const activitiesPerPage = 5;
  const [expandedStudentIds, setExpandedStudentIds] = useState<string[]>([]);

  const groupedActivities = useMemo(() => {
    const groups: Record<string, { studentId: string; studentName: string; logs: any[] }> = {};
    liveActivities.forEach(log => {
      const sId = log.studentId || 'unknown';
      if (!groups[sId]) {
        groups[sId] = {
          studentId: sId,
          studentName: log.studentName || 'Unknown Student',
          logs: []
        };
      }
      groups[sId].logs.push(log);
    });
    // Sort groups by the latest log in each group
    return Object.values(groups).sort((a, b) => {
      const latestA = a.logs[0]?.createdAt?.seconds || 0;
      const latestB = b.logs[0]?.createdAt?.seconds || 0;
      return latestB - latestA;
    });
  }, [liveActivities]);

  const totalActivityPages = Math.ceil(groupedActivities.length / activitiesPerPage);
  const visibleActivityGroups = groupedActivities.slice((activityPage - 1) * activitiesPerPage, activityPage * activitiesPerPage);

  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAcknowledge = async (taskId: string, type: 'mock' | 'dossier') => {
    try {
      // 1. Determine target collection
      const collectionName = type === 'mock' ? 'mock_interview_attempts' : 'Interview_Packs';
      const taskRef = doc(db, collectionName, taskId);

      // 2. Perform Backend update first (to ensure consistency)
      // or at least prepare it.
      const updatePromise = updateDoc(taskRef, {
        status: type === 'mock' ? 'acknowledged' : 'Verified',
        updatedAt: serverTimestamp()
      });

      // 3. UI update: Remove from local state
      setPriorityTasks(prev => prev.filter(t => t.id !== taskId));

      // 4. Adjust pagination if the page becomes empty
      // We calculate this based on the length BEFORE the state update finishes
      const currentFilteredCount = filteredTasks.length;
      if (currentFilteredCount <= 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }

      await updatePromise;

    } catch (error) {
      console.error("Acknowledgment failed:", error);
      // Re-fetch to ensure UI is accurate if update failed
      fetchDashboardData();
    }
  };

  useEffect(() => {
    if (!loading && role !== "Counselor" && role !== "Admin" && role !== "Super Admin") {
      router.push("/dashboard");
    }
  }, [role, loading, router]);

  const fetchDashboardData = async () => {
    let isMounted = true;
    try {
      setDataLoading(true);

      // ── VISIBILITY RESTRICTION: Counselors only see assigned data ──
      let usersQuery = query(collection(db, "Users"));
      let packsQuery = query(collection(db, "Interview_Packs"), where("status", "==", "Submitted"));
      let mocksQuery = query(collection(db, "mock_interview_attempts"), where("status", "==", "pending_review"), limit(10));

      if (role === 'Counselor' && user) {
        usersQuery = query(collection(db, "Users"), where('assignedCounselorId', '==', user.uid));
      }

      if (!user) {
        setDataLoading(false);
        return;
      }

      const [usersSnap, packsSnap, mocksSnap, logsSnap, sessionsSnap] = await Promise.all([
        withTimeout(getDocs(usersQuery), 10000),
        withTimeout(getDocs(query(collection(db, "Interview_Packs"), where("status", "==", "Submitted"))), 10000),
        withTimeout(getDocs(query(collection(db, "mock_interview_attempts"), where("status", "==", "pending_review"), limit(10))), 10000),
        withTimeout(getDocs(query(collection(db, "activity_logs"), orderBy("createdAt", "desc"), limit(5))), 10000),
        withTimeout(getDocs(query(collection(db, "reminders"), where("counselorUid", "==", user.uid), where("isTriggered", "==", false), orderBy("triggerAt", "asc"), limit(10))), 10000)
      ]);

      if (isMounted) {
        const studentList = usersSnap.docs
          .filter(d => d.data().role === "Student" || !d.data().role)
          .map(d => ({ uid: d.id, ...d.data() }));

        const studentIds = studentList.map(s => s.uid);

        setStudents(studentList);

        // ── Process Scheduled Sessions ──
        const sessions = sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setScheduledSessions(sessions);

        // ── Process Activity Logs ──
        const logs = logsSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter(log => role !== 'Counselor' || (studentIds && studentIds.includes(log.studentId)));

        setLiveActivities(logs);

        // ── Build Priority Action items ──
        const tasks: PriorityTask[] = [];

        // 1. Pending Mock Interviews
        mocksSnap.forEach(doc => {
          const data = doc.data() as any;
          if (role !== 'Counselor' || (studentIds && studentIds.includes(data.studentId))) {
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
          if (role !== 'Counselor' || (studentIds && studentIds.includes(data.userId))) {
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
      }

    } catch (err) {
      console.warn("Dashboard fetch error:", err);
    } finally {
      if (isMounted) setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const metrics = useMemo(() => {
    const total = students.length;
    const atRisk = students.filter(s => s.readinessStatus === 'Red' || s.readinessStatus === 'AT_RISK').length;
    const ready = students.filter(s => s.readinessStatus === 'Green' || s.readinessStatus === 'INTERVIEW_READY').length;
    const inProgress = students.filter(s =>
      s.readinessStatus === 'Yellow' ||
      s.readinessStatus === 'Orange' ||
      s.readinessStatus === 'IN_PROGRESS'
    ).length;

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
            title="Interview Ready"
            value={metrics.ready}
            icon={CheckCircle2}
            color="emerald"
            href="/counselor/students?filter=READY"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* ── 2. PRIORITY ACTION CENTER (Left 2 Columns) ── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-800 rounded-[40px] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center">
                   <CheckCircle2 className="mr-3 text-blue-500" /> Priority Action Center
                 </h2>
                 <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase rounded-full border border-blue-100 dark:border-blue-900/30">
                    {filteredTasks.length} Pending
                 </span>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center space-x-2 mb-8 border-b border-gray-50 dark:border-slate-800 pb-6 overflow-x-auto scrollbar-hide">
                {(['ALL', 'mock', 'dossier'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTaskFilter(type)}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                      taskFilter === type
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30'
                        : 'bg-gray-50 dark:bg-slate-900 text-gray-400 border-gray-100 dark:border-slate-800 hover:text-gray-600 dark:hover:text-white'
                    }`}
                  >
                    {type === 'mock' ? 'Mock Interviews' : type === 'dossier' ? 'Student Details' : 'All Tasks'}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                  <div className="p-20 text-center space-y-3 opacity-40">
                     <ClipboardList className="w-12 h-12 mx-auto" />
                     <p className="text-xs font-bold uppercase tracking-widest">No pending priority actions.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout" initial={false}>
                      {visibleTasks.map((task) => {
                        const hoursOld = task.timestamp?.seconds
                          ? (Date.now() / 1000 - task.timestamp.seconds) / 3600
                          : 0;

                        const getSLAStyles = (hours: number) => {
                          if (hours > 48) return 'border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10';
                          if (hours > 24) return 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10';
                          return 'border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-[#0F172A] hover:border-blue-500/50';
                        };

                        return (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: 20, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
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

                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleAcknowledge(task.id, task.type);
                                }}
                                className="p-3 text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-2xl transition-all active:scale-75 cursor-pointer"
                                title="Acknowledge & Dismiss"
                              >
                                <CheckCircle size={22} />
                              </button>
                              <Link
                                href={task.type === 'mock'
                                  ? `/counselor/mock-interviews/playback?attemptId=${task.id}`
                                  : `/counselor/students/portfolio?id=${task.studentId}`}
                                className="px-5 py-2.5 bg-white dark:bg-[#1E293B] hover:bg-blue-600 hover:text-white dark:text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-all flex items-center gap-2"
                              >
                                Review Now <ChevronRight size={14} />
                              </Link>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-50 dark:border-slate-800">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                          Showing {(currentPage - 1) * tasksPerPage + 1}-{Math.min(currentPage * tasksPerPage, priorityTasks.length)} of {priorityTasks.length}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-500 disabled:opacity-30 hover:bg-gray-100 transition-all"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400 px-2">{currentPage} / {totalPages}</span>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-500 disabled:opacity-30 hover:bg-gray-100 transition-all"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── 3. QUICK ACTIONS & ACTIVITY FEED (Right Column) ── */}
          <div className="space-y-8">

            {/* Quick Actions */}
            <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-800 rounded-[40px] p-8 shadow-sm">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <QuickActionButton
                   icon={UserPlus}
                   label="Add Student"
                   color="blue"
                   onClick={() => router.push('/counselor/students')}
                />
                <QuickActionButton
                   icon={FolderDown}
                   label="Assign Pack"
                   color="emerald"
                   onClick={() => router.push('/counselor/students')}
                />
                <QuickActionButton
                   icon={Calendar}
                   label="Schedule Mock"
                   color="purple"
                   onClick={() => router.push('/counselor/students')}
                />
                <QuickActionButton
                   icon={BellRing}
                   label="Send Nudge"
                   color="amber"
                   onClick={() => router.push('/counselor/students')}
                />
                <button
                  onClick={() => router.push('/counselor/activity-log')}
                  className="col-span-2 flex items-center justify-center gap-3 p-4 bg-gray-50 dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 rounded-3xl transition-all hover:scale-[1.02] active:scale-95 hover:border-indigo-500/50 group"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                    <FileDown size={18} className="text-indigo-400" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-slate-300">Generate Report</span>
                </button>
              </div>
            </div>

            {/* Upcoming Agenda Widget */}
            <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-800 rounded-[40px] p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Upcoming Sessions</h2>
                <button
                  onClick={() => router.push('/counselor/students')}
                  className="text-[9px] text-blue-500 hover:underline font-black uppercase tracking-widest"
                >
                  View Schedule
                </button>
              </div>

              <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 scrollbar-hide">
                {scheduledSessions.length === 0 ? (
                  <div className="py-10 text-center space-y-2 opacity-30">
                    <Calendar size={32} className="mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No sessions scheduled.</p>
                  </div>
                ) : (
                  scheduledSessions.map((session) => {
                    const date = new Date(session.triggerAt);
                    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const isToday = new Date().toDateString() === date.toDateString();

                    return (
                      <div
                        key={session.id}
                        className="p-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[28px] relative overflow-hidden group hover:border-blue-500/50 transition-all shadow-sm"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 rounded-l-[28px]"></div>
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase">
                              <Clock size={12} />
                              {isToday ? 'Today' : date.toLocaleDateString()} • {timeStr}
                            </div>
                            <div className="text-sm font-black dark:text-white uppercase tracking-tighter truncate max-w-[150px]">
                              {session.message}
                            </div>
                          </div>
                          <Link
                            href={`/counselor/live-mock?studentId=${session.studentUid}`}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 whitespace-nowrap"
                          >
                            Join Room
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Live Activity Feed */}
            <div className="bg-[#0F172A] rounded-[40px] p-8 text-white shadow-2xl space-y-6">
               <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Live Activity Feed</h2>
               <div className="space-y-4">
                  {visibleActivityGroups.length === 0 ? (
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center py-10 italic">No recent activity detected.</p>
                  ) : (
                    <div className="space-y-3">
                      {visibleActivityGroups.map((group) => {
                        const isExpanded = expandedStudentIds.includes(group.studentId);
                        return (
                          <div key={group.studentId} className="space-y-2">
                            <button
                              onClick={() => toggleStudentExpansion(group.studentId)}
                              className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                  <User size={16} className="text-blue-400" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-tight text-left">{group.studentName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-gray-500 uppercase">{group.logs.length} Actions</span>
                                {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                              </div>
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pl-4 space-y-2 pb-2">
                                    {group.logs.map((log) => {
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
                                          nested
                                        />
                                      );
                                    })}
                                    <Link
                                      href={`/counselor/students/portfolio?id=${group.studentId}`}
                                      className="block w-full py-2 text-center text-[9px] font-black uppercase text-blue-400 hover:text-blue-300 transition-colors bg-white/5 rounded-xl border border-dashed border-white/10"
                                    >
                                      View Full Student Profile
                                    </Link>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Activity Pagination Controls */}
                  {totalActivityPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                          disabled={activityPage === 1}
                          className="p-1.5 rounded-lg bg-white/5 text-gray-400 disabled:opacity-30 hover:bg-white/10 transition-all"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span className="text-[10px] font-black text-blue-400 px-2">{activityPage} / {totalActivityPages}</span>
                        <button
                          onClick={() => setActivityPage(p => Math.min(totalActivityPages, p + 1))}
                          disabled={activityPage === totalActivityPages}
                          className="p-1.5 rounded-lg bg-white/5 text-gray-400 disabled:opacity-30 hover:bg-white/10 transition-all"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                      <span className="text-[8px] font-black uppercase text-gray-500">
                        {groupedActivities.length} Scholars
                      </span>
                    </div>
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
    amber: "text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 hover:border-amber-500/50",
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

function ActivityItem({ studentId, user, action, time, icon: Icon, color, nested }: any) {
  const colorMap: any = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    orange: "bg-orange-500",
    indigo: "bg-indigo-500",
  };

  return (
    <Link href={`/counselor/students/portfolio?id=${studentId}`} className="relative flex items-center gap-4 group cursor-pointer">
      {!nested && <div className={`w-4 h-4 rounded-full border-4 border-[#0F172A] ${colorMap[color]} shrink-0 z-10 transition-transform group-hover:scale-125`} />}
      <div className={`flex-1 bg-white/5 backdrop-blur-md ${nested ? 'p-3' : 'p-4'} rounded-2xl border border-white/5 group-hover:border-white/20 group-hover:bg-white/10 transition-all`}>
        <div className="flex items-center justify-between mb-1">
          {!nested && <span className="text-xs font-black uppercase tracking-tight">{user}</span>}
          {nested && (
            <div className="flex items-center gap-2">
               <Icon size={12} className={color === 'emerald' ? 'text-emerald-400' : color === 'orange' ? 'text-orange-400' : color === 'blue' ? 'text-blue-400' : 'text-indigo-400'} />
               <p className="text-[10px] font-black uppercase text-gray-300">{action.split(' ')[0]}</p>
            </div>
          )}
          <time className="text-[9px] font-bold text-gray-500 flex items-center ml-auto"><Clock size={10} className="mr-1"/> {time}</time>
        </div>
        <p className={`${nested ? 'text-[9px]' : 'text-[10px]'} text-gray-400 font-medium uppercase tracking-widest`}>{nested ? action : action}</p>
      </div>
    </Link>
  );
}
