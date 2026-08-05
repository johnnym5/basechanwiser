"use client";

import React, { useState, useEffect, useMemo } from "react";
import AppShell from "@/components/layout/app-shell";
import Link from "next/link";
import StudentHistoryModal from "@/components/StudentHistoryModal";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Search,
  FileText,
  FileCheck,
  DollarSign,
  User,
  X,
  CheckCircle2,
  MoreVertical,
  Trash2,
  RotateCcw,
  CheckSquare,
  Square,
  FolderKanban,
  AlertTriangle,
  History,
  TrendingUp,
  Users,
  Award,
  Clock,
  ExternalLink,
  ChevronRight,
  Zap,
  FolderOpen,
  Loader2
} from "lucide-react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { TrafficLightStatus, EvaluationDecision, InterviewPack, JuniorEvaluation, QuestionPack } from "@/types";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import ResourceVaultModal from "@/components/common/ResourceVaultModal";

interface StudentTableRow {
  uid: string;
  studentId?: string;
  name: string;
  email: string;
  location: string;
  learningProgress: number;
  status: TrafficLightStatus;
  pack?: InterviewPack;
  lastLoginAt?: any;
  averageScore: number;
  failedAttemptsCount: number;
  totalAttempts: number;
}

interface QuizAttempt {
  id: string;
  userId: string;
  packId: string;
  packTitle: string;
  score: number;
  attemptNumber: number;
  timestamp: any;
}

const COLORS = ["#10B981", "#F59E0B", "#F97316", "#EF4444", "#94A3B8"];

export default function CounselorAnalyticsDashboardPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role !== "Counselor" && role !== "Admin" && role !== "Super Admin") {
      router.push("/dashboard");
    }
  }, [role, loading, router]);

  const searchParams = useSearchParams();
  const initialView = searchParams.get("view") === "table" ? "table" : "analytics";

  const [view, setView] = useState<"analytics" | "table">(initialView);
  const [activeTab, setActiveTab] = useState<"star" | "at_risk" | "in_progress" | "unstarted" | "forms">("in_progress");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentTableRow | null>(null);

  const [decision, setDecision] = useState<EvaluationDecision>("Pass");
  const [evalTrafficLight, setEvalTrafficLight] = useState<TrafficLightStatus>("Green");
  const [evalNotes, setEvalNotes] = useState("");
  const [isSavingEval, setIsSavingEval] = useState(false);
  const [evalSuccessToast, setEvalSuccessToast] = useState<string | null>(null);
  const [showDossier, setShowDossier] = useState<StudentTableRow | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [students, setStudents] = useState<StudentTableRow[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // ── Multi-Select State ──────────────────────────────────────────
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [activeMenuUid, setActiveMenuUid] = useState<string | null>(null);

  // ── Modals State ───────────────────────────────────────────────
  const [historyStudent, setHistoryStudent] = useState<StudentTableRow | null>(null);
  const [showBulkPackModal, setShowBulkPackModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ uids: string[]; names: string[] } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<{ uids: string[]; names: string[] } | null>(null);
  const [deleteInputText, setDeleteInputText] = useState("");
  const [availablePacks, setAvailablePacks] = useState<QuestionPack[]>([]);
  const [bulkPackId, setBulkPackId] = useState("");
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  const fetchRealData = async () => {
    try {
      const usersSnap = await getDocs(collection(db, "Users"));
      const packsSnap = await getDocs(collection(db, "Interview_Packs"));
      const attemptsSnap = await getDocs(collection(db, "quiz_attempts"));

      const packMap: Record<string, InterviewPack> = {};
      if (!packsSnap.empty) {
        packsSnap.docs.forEach((d) => {
          packMap[d.id] = d.data() as InterviewPack;
        });
      }

      const allAttempts: QuizAttempt[] = attemptsSnap.docs.map(d => ({ id: d.id, ...d.data() } as QuizAttempt));
      setAttempts(allAttempts);

      if (!usersSnap.empty) {
        const fetchedRows: StudentTableRow[] = usersSnap.docs
          .filter((d) => d.data().role === "Student" || !d.data().role)
          .map((d) => {
            const uData = d.data();
            const pack = packMap[d.id];

            // Calculate student-specific stats
            const studentAttempts = allAttempts.filter(a => a.userId === d.id);
            const totalScore = studentAttempts.reduce((sum, a) => sum + a.score, 0);
            const avgScore = studentAttempts.length > 0 ? Math.round(totalScore / studentAttempts.length) : 0;
            const failedCount = studentAttempts.filter(a => a.score < 80).length;

            let status: TrafficLightStatus = uData.readinessStatus || "Red";
            if (!uData.readinessStatus && pack) {
              status = "Yellow";
            }

            return {
              uid: d.id,
              studentId: uData.studentId || "N/A",
              name: uData.displayName || "Student",
              email: uData.email || "N/A",
              location: uData.office || uData.officeLocation || "Head Office",
              learningProgress: uData.learningProgress ?? (avgScore >= 80 ? 100 : avgScore > 0 ? 50 : 0),
              status,
              pack,
              lastLoginAt: uData.lastLoginAt,
              averageScore: avgScore,
              failedAttemptsCount: failedCount,
              totalAttempts: studentAttempts.length,
            };
          });

        setStudents(fetchedRows);
      }
    } catch (err) {
      console.warn("Counselor dashboard fetch error:", err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
    async function fetchPacks() {
      try {
        const qSnap = await getDocs(collection(db, "question_packs"));
        if (!qSnap.empty) {
          setAvailablePacks(qSnap.docs.map((d) => ({ id: d.id, ...d.data() } as QuestionPack)));
        }
      } catch (err) {
        console.warn("Packs fetch error:", err);
      }
    }
    fetchPacks();
  }, []);

  // ── Metrics Computation ───────────────────────────────────────
  const metrics = useMemo(() => {
    const total = students.length;
    const now = Date.now();
    const activeLast7Days = students.filter(s => {
      if (!s.lastLoginAt) return false;
      const loginTime = s.lastLoginAt.seconds * 1000;
      return (now - loginTime) < (7 * 24 * 60 * 60 * 1000);
    }).length;

    const inactiveCount = students.filter(s => {
      if (!s.lastLoginAt) return true;
      const loginTime = s.lastLoginAt.seconds * 1000;
      return (now - loginTime) > (14 * 24 * 60 * 60 * 1000);
    }).length;

    const firstTimePasses = attempts.filter(a => a.attemptNumber === 1 && a.score >= 80).length;
    const totalFirstAttempts = attempts.filter(a => a.attemptNumber === 1).length;
    const firstTimePassRate = totalFirstAttempts > 0 ? Math.round((firstTimePasses / totalFirstAttempts) * 100) : 0;

    const formsSubmitted = students.filter(s => s.pack?.status === 'Submitted').length;
    const formCompletionRate = total > 0 ? Math.round((formsSubmitted / total) * 100) : 0;

    const urgentCount = students.filter(s => s.status === 'Red' || s.failedAttemptsCount >= 2).length;

    return {
      total,
      activeLast7Days,
      inactiveCount,
      firstTimePassRate,
      formCompletionRate,
      formsSubmitted,
      urgentCount
    };
  }, [students, attempts]);

  // ── Chart Data Computation ────────────────────────────────────
  const readinessData = useMemo(() => [
    { name: "Green", value: students.filter(s => s.status === 'Green').length },
    { name: "Yellow", value: students.filter(s => s.status === 'Yellow').length },
    { name: "Orange", value: students.filter(s => s.status === 'Orange').length },
    { name: "Red", value: students.filter(s => s.status === 'Red').length },
    { name: "Gray", value: students.filter(s => !s.status).length },
  ], [students]);

  const moduleUsageData = useMemo(() => {
    const usageMap: Record<string, { name: string; pass: number; fail: number }> = {};
    attempts.forEach(a => {
      if (!usageMap[a.packId]) {
        usageMap[a.packId] = { name: a.packTitle || "Module", pass: 0, fail: 0 };
      }
      if (a.score >= 80) usageMap[a.packId].pass++;
      else usageMap[a.packId].fail++;
    });
    return Object.values(usageMap);
  }, [attempts]);

  const progressDistribution = useMemo(() => [
    { name: "Not Started (0%)", count: students.filter(s => s.learningProgress === 0).length },
    { name: "Early (1-49%)", count: students.filter(s => s.learningProgress > 0 && s.learningProgress < 50).length },
    { name: "Mid (50-79%)", count: students.filter(s => s.learningProgress >= 50 && s.learningProgress < 80).length },
    { name: "Ready (80-100%)", count: students.filter(s => s.learningProgress >= 80).length },
  ], [students]);

  // ── Tab Filters ───────────────────────────────────────────────
  const segmentedStudents = useMemo(() => {
    let list = [...students];
    if (searchTerm) {
      list = list.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    switch (activeTab) {
      case "star":
        return list.filter(s => s.averageScore >= 80 && s.pack?.status === 'Submitted');
      case "at_risk":
        return list.filter(s => s.failedAttemptsCount >= 2 || s.status === 'Red');
      case "in_progress":
        return list.filter(s => s.learningProgress > 0 && s.learningProgress < 100);
      case "unstarted":
        const now = Date.now();
      return list.filter(s => s.learningProgress === 0 || (s.lastLoginAt && (now - s.lastLoginAt.seconds * 1000) > 14 * 24 * 60 * 60 * 1000));
      case "forms":
        return list.filter(s => !!s.pack);
      default:
        return list;
    }
  }, [students, activeTab, searchTerm]);

  // ── Handlers ──────────────────────────────────────────────────
  const isAllSelected = segmentedStudents.length > 0 && segmentedStudents.every((s) => selectedUids.includes(s.uid));
  const handleSelectAllToggle = () => isAllSelected ? setSelectedUids([]) : setSelectedUids(segmentedStudents.map((s) => s.uid));
  const handleRowSelectToggle = (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUids(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };

  const showToast = (message: string) => {
    setEvalSuccessToast(message);
    setTimeout(() => setEvalSuccessToast(null), 4000);
  };

  const handleBulkStatusUpdate = async (newStatus: TrafficLightStatus) => {
    if (selectedUids.length === 0) return;
    try {
      const batch = writeBatch(db);
      selectedUids.forEach((uid) => batch.set(doc(db, "Users", uid), { readinessStatus: newStatus }, { merge: true }));
      await batch.commit();
      setStudents(prev => prev.map(s => selectedUids.includes(s.uid) ? { ...s, status: newStatus } : s));
      showToast(`Updated ${selectedUids.length} student(s) to ${newStatus}.`);
    } catch (err: any) { alert(err.message); }
  };

  const handleBulkAssignPack = async () => {
    if (!bulkPackId || selectedUids.length === 0) return;
    try {
      const batch = writeBatch(db);
      for (const uid of selectedUids) {
        const uSnap = students.find(s => s.uid === uid);
        batch.set(doc(db, "Users", uid), { assignedPackIds: [...new Set([...(uSnap?.pack ? [uSnap.pack.id] : []), bulkPackId])] }, { merge: true });
      }
      await batch.commit();
      setShowBulkPackModal(false);
      showToast(`Assigned pack to ${selectedUids.length} students.`);
    } catch (err: any) { alert(err.message); }
  };

  const handleCascadeDeleteUsers = async () => {
    if (!showDeleteConfirm || deleteInputText.trim().toUpperCase() !== "DELETE") return;
    try {
      for (const uid of showDeleteConfirm.uids) {
        await deleteDoc(doc(db, "Users", uid));
        const qSnap = await getDocs(query(collection(db, "quiz_attempts"), where("userId", "==", uid)));
        qSnap.forEach(async d => await deleteDoc(d.ref));
      }
      setStudents(prev => prev.filter(s => !showDeleteConfirm.uids.includes(s.uid)));
      setSelectedUids([]);
      setShowDeleteConfirm(null);
      showToast("Accounts deleted successfully.");
    } catch (err: any) { alert(err.message); }
  };

  const handleCascadeResetHistory = async () => {
    if (!showResetConfirm) return;
    try {
      for (const uid of showResetConfirm.uids) {
        const qSnap = await getDocs(query(collection(db, "quiz_attempts"), where("userId", "==", uid)));
        qSnap.forEach(async d => await deleteDoc(d.ref));
        await setDoc(doc(db, "Users", uid), { completedPackIds: [], learningProgress: 0, readinessStatus: "Red", updatedAt: serverTimestamp() }, { merge: true });
      }
      setStudents(prev => prev.map(s => showResetConfirm.uids.includes(s.uid) ? { ...s, learningProgress: 0, status: "Red" } : s));
      setShowResetConfirm(null);
      showToast("Student history reset.");
    } catch (err: any) { alert(err.message); }
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !user) return;
    setIsSavingEval(true);
    try {
      const evalData: JuniorEvaluation = { studentId: selectedStudent.uid, counselorId: user.uid, decision, trafficLight: evalTrafficLight, notes: evalNotes, createdAt: serverTimestamp() };
      await setDoc(doc(db, "Junior_Evaluations", selectedStudent.uid), evalData, { merge: true });
      await setDoc(doc(db, "Users", selectedStudent.uid), { readinessStatus: evalTrafficLight }, { merge: true });
      setStudents(prev => prev.map(s => s.uid === selectedStudent.uid ? { ...s, status: evalTrafficLight } : s));
      showToast("Evaluation Saved!");
      setSelectedStudent(null);
    } catch (err) { console.error(err); } finally { setIsSavingEval(false); }
  };

  const StatCard = ({ title, value, sub, icon: Icon, color, link }: any) => {
    const cardContent = (
      <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2 h-full hover:shadow-md transition-all cursor-pointer group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 group-hover:text-[#1a73e8] transition-colors">{title}</span>
          <div className={`p-2 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}><Icon className={`w-4 h-4 ${color.replace('bg-', 'text-')}`} /></div>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-black text-gray-900 dark:text-white">{value}</span>
          <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500">{sub}</span>
        </div>
      </div>
    );

    if (link) {
      return (
        <Link href={link} className="block no-underline">
          {cardContent}
        </Link>
      );
    }

    return cardContent;
  };

  const handleVerifyDossier = async (student: StudentTableRow) => {
    if (!student.uid) return;
    setIsVerifying(true);
    try {
      await setDoc(doc(db, "Interview_Packs", student.uid), { status: 'Verified', updatedAt: serverTimestamp() }, { merge: true });
      await setDoc(doc(db, "Users", student.uid), { readinessStatus: 'Green' }, { merge: true });
      showToast("Dossier Verified & Student Set to Green!");
      setShowDossier(null);
      fetchRealData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-[1600px] mx-auto space-y-8 pb-20">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 font-google">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#1a73e8] dark:text-blue-400" />
              {view === 'analytics' ? "Analytics Control Center" : "Student Compliance Table"}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Review student packs, conduct Junior Interviews, and evaluate readiness.
            </p>
          </div>

          <div className="flex bg-gray-100 dark:bg-[#1E293B] p-1 rounded-2xl border border-gray-200 dark:border-slate-800">
            <button
              onClick={() => setView('analytics')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'analytics' ? 'bg-white dark:bg-[#0F172A] text-[#1a73e8] shadow-sm' : 'text-gray-500'}`}
            >
              Analytics
            </button>
            <button
              onClick={() => setView('table')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'table' ? 'bg-white dark:bg-[#0F172A] text-[#1a73e8] shadow-sm' : 'text-gray-500'}`}
            >
              Data Table
            </button>
          </div>
        </div>

        {view === 'analytics' && (
          <>
            {/* KPI Banner */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <StatCard title="Total Students" value={metrics.total} sub={`${metrics.activeLast7Days} active this week`} icon={Users} color="bg-blue-500" link="/counselor/students" />
              <StatCard title="First-Try Pass Rate" value={`${metrics.firstTimePassRate}%`} sub="Students passing attempt #1" icon={Zap} color="bg-emerald-500" />
              <StatCard title="Pack Completion" value={`${metrics.formCompletionRate}%`} sub={`${metrics.formsSubmitted} forms submitted`} icon={FileText} color="bg-amber-500" link="/counselor/students?tab=forms" />
              <StatCard title="At-Risk" value={metrics.urgentCount} sub="Red status or 2+ fails" icon={AlertTriangle} color="bg-rose-500" link="/counselor/students?status=Red" />
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-6 duration-700">
              {/* Readiness Donut */}
              <div className="xl:col-span-1 bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-gray-100 dark:border-slate-800">
                <h3 className="text-sm font-black uppercase tracking-tighter text-gray-900 dark:text-white mb-6">Readiness Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={readinessData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {readinessData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Module Usage */}
              <div className="xl:col-span-2 bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-gray-100 dark:border-slate-800">
                 <h3 className="text-sm font-black uppercase tracking-tighter text-gray-900 dark:text-white mb-6">Module Usage & Pass/Fail Ratio</h3>
                 <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moduleUsageData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                      <XAxis dataKey="name" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <Bar dataKey="pass" name="Passed" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="fail" name="Failed" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                 </div>
              </div>

              {/* Progress Breakdown */}
              <div className="xl:col-span-1 bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-gray-100 dark:border-slate-800">
                 <h3 className="text-sm font-black uppercase tracking-tighter text-gray-900 dark:text-white mb-6">Learning Progression</h3>
                 <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={progressDistribution}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#1a73e8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" hide />
                        <Tooltip />
                        <Area type="monotone" dataKey="count" stroke="#1a73e8" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="grid grid-cols-2 gap-2 mt-4">
                    {progressDistribution.map((d, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-[#0F172A] p-2 rounded-xl border border-gray-100 dark:border-slate-800">
                        <p className="text-[9px] font-black uppercase text-gray-400">{d.name}</p>
                        <p className="text-sm font-black dark:text-white">{d.count}</p>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </>
        )}

        {/* ── Resource Vault Banner ───────────── */}
        <div className="bg-gradient-to-r from-blue-600 via-[#1a73e8] to-indigo-600 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-google font-extrabold text-lg">
              <FolderOpen className="w-6 h-6" /> Google Drive Resource Vault
            </div>
            <p className="text-xs text-blue-100 max-w-xl">
              Manage and view staff-curated video tutorials, UKVI visa compliance guides, and financial template calculators.
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

        {/* Action Center Tabs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2 overflow-x-auto gap-4 scrollbar-hide">
            {[
              { id: "in_progress", label: "In-Progress", icon: Clock },
              { id: "star", label: "Star Students", icon: Award },
              { id: "at_risk", label: "At-Risk", icon: AlertTriangle },
              { id: "unstarted", label: "Inactive/New", icon: Zap },
              { id: "forms", label: "Form Matrix", icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-[#1a73e8] text-white shadow-lg shadow-blue-500/20"
                    : "text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
             <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search cohort..."
                  className="w-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                />
             </div>
          </div>

          {/* Tabbed List Rendering */}
          <div className="bg-white dark:bg-[#1E293B] rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/20 overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-left text-xs">
                 <thead>
                    <tr className="bg-gray-50/50 dark:bg-[#0F172A]/50 border-b border-gray-100 dark:border-slate-800">
                       <th className="p-5 w-10 text-center"><button onClick={handleSelectAllToggle}>{isAllSelected ? <CheckSquare className="w-4 h-4 text-[#1a73e8]" /> : <Square className="w-4 h-4" />}</button></th>
                       <th className="p-5 font-black uppercase tracking-widest text-gray-400">Student</th>
                       <th className="p-5 font-black uppercase tracking-widest text-gray-400">Progression</th>
                       <th className="p-5 font-black uppercase tracking-widest text-gray-400">Form Status</th>
                       <th className="p-5 font-black uppercase tracking-widest text-gray-400">Last Activity</th>
                       <th className="p-5 text-right font-black uppercase tracking-widest text-gray-400">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                    {segmentedStudents.length === 0 ? (
                      <tr><td colSpan={6} className="p-12 text-center text-sm font-bold text-gray-400">No students in this cohort.</td></tr>
                    ) : (
                      segmentedStudents.map((s) => (
                        <tr key={s.uid} className={`group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all ${selectedUids.includes(s.uid) ? "bg-blue-50/50 dark:bg-blue-900/20" : ""}`}>
                          <td className="p-5 text-center" onClick={(e) => handleRowSelectToggle(s.uid, e)}>{selectedUids.includes(s.uid) ? <CheckSquare className="w-4 h-4 text-[#1a73e8]" /> : <Square className="w-4 h-4 text-gray-300" />}</td>
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-[#0F172A] flex items-center justify-center font-black text-[#1a73e8]">{s.name.charAt(0)}</div>
                               <div>
                                  <p className="font-black text-gray-900 dark:text-white text-sm leading-none mb-1">{s.name}</p>
                                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">{s.studentId}</p>
                               </div>
                            </div>
                          </td>
                          <td className="p-5">
                             <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tighter">
                                   <span className="text-gray-500">{s.learningProgress}% Complete</span>
                                   <span className={s.averageScore >= 80 ? "text-emerald-500" : "text-gray-400"}>Avg: {s.averageScore}%</span>
                                </div>
                                <div className="w-32 bg-gray-100 dark:bg-[#0F172A] rounded-full h-1.5 overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-500 ${s.status === 'Green' ? 'bg-emerald-500' : s.status === 'Yellow' ? 'bg-amber-500' : s.status === 'Orange' ? 'bg-orange-500' : s.status === 'Red' ? 'bg-rose-500' : 'bg-blue-600'}`} style={{ width: `${s.learningProgress}%` }} />
                                </div>
                             </div>
                          </td>
                          <td className="p-5">
                             <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase border ${s.pack?.status === 'Submitted' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                {s.pack?.status === 'Submitted' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {s.pack?.status || "Not Started"}
                             </span>
                          </td>
                          <td className="p-5">
                             <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-black uppercase text-gray-900 dark:text-white">{s.lastLoginAt ? new Date(s.lastLoginAt.seconds * 1000).toLocaleDateString() : "Never"}</span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{s.location}</span>
                             </div>
                          </td>
                          <td className="p-5 text-right relative">
                             <button onClick={() => setActiveMenuUid(activeMenuUid === s.uid ? null : s.uid)} className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#0F172A] transition-all"><MoreVertical className="w-4 h-4" /></button>
                             {activeMenuUid === s.uid && (
                                <div className="absolute right-12 top-5 w-56 bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 py-2 z-[100] text-left animate-in fade-in slide-in-from-right-2">
                                   <button onClick={() => { setShowDossier(s); setActiveMenuUid(null); }} className="w-full px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-[#0F172A] text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-slate-300 flex items-center gap-3"><FileCheck className="w-4 h-4 text-emerald-500" /> View Compliance Dossier</button>
                                   <button onClick={() => { setHistoryStudent(s); setActiveMenuUid(null); }} className="w-full px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-[#0F172A] text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-slate-300 flex items-center gap-3"><History className="w-4 h-4 text-blue-500" /> Full Audit History</button>
                                   <button onClick={() => { setSelectedStudent(s); setActiveMenuUid(null); }} className="w-full px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-[#0F172A] text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-slate-300 flex items-center gap-3"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Evaluate Readiness</button>
                                   <div className="border-t border-gray-50 dark:border-slate-800 my-1" />
                                   <button onClick={() => { setShowDeleteConfirm({ uids: [s.uid], names: [s.name] }); setActiveMenuUid(null); }} className="w-full px-4 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-[10px] font-black uppercase tracking-widest text-rose-600 flex items-center gap-3"><Trash2 className="w-4 h-4" /> Purge Account</button>
                                </div>
                             )}
                          </td>
                        </tr>
                      ))
                    )}
                 </tbody>
               </table>
            </div>
          </div>
        </div>

        {/* ── STICKY BULK ACTIONS TOOLBAR ─────────────────────────── */}
        {selectedUids.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-6 py-4 rounded-[32px] shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-10">
            <div className="flex items-center gap-3 border-r border-white/10 pr-8">
              <div className="w-10 h-10 rounded-full bg-[#1a73e8] flex items-center justify-center font-black text-sm">{selectedUids.length}</div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Selected</span>
            </div>
            <div className="flex items-center gap-4">
               <button onClick={() => handleBulkStatusUpdate("Green")} className="text-[10px] font-black uppercase tracking-widest hover:text-emerald-400 transition-colors">● Ready</button>
               <button onClick={() => handleBulkStatusUpdate("Red")} className="text-[10px] font-black uppercase tracking-widest hover:text-rose-400 transition-colors">● Urgent</button>
               <button onClick={() => setShowBulkPackModal(true)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-blue-400 transition-colors"><FolderKanban className="w-4 h-4" /> Assign</button>
               <button onClick={() => setSelectedUids([])} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"><X className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {showDossier && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
             <div className="bg-white dark:bg-[#1E293B] w-full max-w-4xl max-h-[90vh] rounded-[40px] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-200">
                <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-[#0F172A]/50">
                   <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Student Compliance Dossier</h2>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{showDossier.name} • {showDossier.email}</p>
                   </div>
                   <button onClick={() => setShowDossier(null)} className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all"><X className="w-6 h-6 text-gray-400" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-12">
                   {showDossier.pack ? (
                     <>
                        {/* Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <div className="p-5 rounded-3xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                              <p className="text-[9px] font-black text-blue-500 uppercase">App ID</p>
                              <p className="text-sm font-black dark:text-white">{showDossier.pack.applicationId || "N/A"}</p>
                           </div>
                           <div className="p-5 rounded-3xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30">
                              <p className="text-[9px] font-black text-purple-500 uppercase">CAS Ref</p>
                              <p className="text-sm font-black dark:text-white">{showDossier.pack.casNumber || "N/A"}</p>
                           </div>
                           <div className="p-5 rounded-3xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                              <p className="text-[9px] font-black text-amber-500 uppercase">Balance Due</p>
                              <p className="text-sm font-black dark:text-white">£{(showDossier.pack.tuitionAmount || 0) - (showDossier.pack.depositPaid || 0)}</p>
                           </div>
                           <div className="p-5 rounded-3xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                              <p className="text-[9px] font-black text-emerald-500 uppercase">Status</p>
                              <p className="text-sm font-black dark:text-white">{showDossier.pack.status}</p>
                           </div>
                        </div>

                        {/* Document Confirmation Status */}
                        <div className="space-y-4">
                           <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-slate-800 pb-2">Document Submission Status (Sent Locally)</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              {[
                                { label: 'Statement of Purpose', val: showDossier.pack.hasSop, icon: FileText, color: 'text-blue-500' },
                                { label: 'Professional CV', val: showDossier.pack.hasCv, icon: User, color: 'text-purple-500' },
                                { label: 'Financial Evidence', val: showDossier.pack.hasFinancials, icon: DollarSign, color: 'text-emerald-500' },
                              ].map((docItem, idx) => (
                                <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-slate-800 flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                      <docItem.icon className={`w-4 h-4 ${docItem.color}`} />
                                      <span className="text-[10px] font-bold dark:text-slate-300">{docItem.label}</span>
                                   </div>
                                   <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${docItem.val ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                      {docItem.val ? 'Sent' : 'Pending'}
                                   </span>
                                </div>
                              ))}
                           </div>
                        </div>

                        {/* Deep Dives */}
                        <div className="space-y-8">
                           <div className="space-y-3">
                              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sponsorship & Accommodation</h4>
                              <div className="p-6 rounded-3xl bg-gray-50 dark:bg-[#0F172A] space-y-4">
                                 <p className="text-xs leading-relaxed dark:text-slate-300"><span className="font-black text-gray-900 dark:text-white uppercase mr-2">Sponsor:</span> {showDossier.pack.sponsorInfo}</p>
                                 <p className="text-xs leading-relaxed dark:text-slate-300"><span className="font-black text-gray-900 dark:text-white uppercase mr-2">Accommodation:</span> {showDossier.pack.accommodationDetails}</p>
                              </div>
                           </div>

                           <div className="space-y-3">
                              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Intent & Career Alignment</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="p-6 rounded-3xl bg-gray-50 dark:bg-[#0F172A] space-y-2">
                                    <p className="text-[9px] font-black text-blue-500 uppercase">Why UK/Uni?</p>
                                    <p className="text-xs leading-relaxed dark:text-slate-300 italic">"{showDossier.pack.reasonsForUniversity || showDossier.pack.whyUniversity}"</p>
                                 </div>
                                 <div className="p-6 rounded-3xl bg-gray-50 dark:bg-[#0F172A] space-y-2">
                                    <p className="text-[9px] font-black text-purple-500 uppercase">Future Plans</p>
                                    <p className="text-xs leading-relaxed dark:text-slate-300 italic">"{showDossier.pack.careerPlans}"</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </>
                   ) : (
                     <div className="text-center py-20">
                        <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-400 font-black uppercase tracking-widest">Student has not started the dossier.</p>
                     </div>
                   )}
                </div>

                {showDossier.pack && showDossier.pack.status !== 'Verified' && (
                  <div className="p-8 bg-gray-50 dark:bg-[#0F172A] border-t border-gray-100 dark:border-slate-800 flex justify-center">
                     <button
                       onClick={() => handleVerifyDossier(showDossier)}
                       disabled={isVerifying}
                       className="px-12 py-5 bg-emerald-600 text-white font-black rounded-full text-xs uppercase tracking-widest shadow-2xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
                     >
                        {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        Verify & Approve Candidate
                     </button>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* Evaluation Drawer */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex justify-end">
             <div className="w-full max-w-xl bg-white dark:bg-[#1E293B] h-full p-10 overflow-y-auto space-y-10 animate-in slide-in-from-right duration-300 shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-6">
                   <div className="space-y-1">
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white font-google">{selectedStudent.name}</h2>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedStudent.email}</p>
                   </div>
                   <button onClick={() => setSelectedStudent(null)} className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-[#0F172A] flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white"><X className="w-6 h-6" /></button>
                </div>

                <form onSubmit={handleSaveEvaluation} className="space-y-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Evaluation Decision</label>
                      <select value={decision} onChange={(e) => setDecision(e.target.value as any)} className="w-full bg-gray-50 dark:bg-[#0F172A] border-none rounded-2xl p-4 text-sm font-black text-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]">
                        <option value="Pass">Pass Interview</option>
                        <option value="Retry">Needs Further Prep</option>
                        <option value="Escalate">Escalate to Senior</option>
                      </select>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Assign Readiness Status</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { v: "Green", label: "Ready", c: "bg-emerald-500" },
                          { v: "Yellow", label: "Work", c: "bg-amber-500" },
                          { v: "Red", label: "Urgent", c: "bg-rose-500" },
                        ].map(opt => (
                          <button key={opt.v} type="button" onClick={() => setEvalTrafficLight(opt.v as any)} className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-tighter border-2 transition-all ${evalTrafficLight === opt.v ? `border-${opt.c.replace('bg-', '')} ${opt.c} text-white shadow-xl` : 'border-gray-100 dark:border-slate-800 text-gray-400 opacity-60'}`}>{opt.label}</button>
                        ))}
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Counselor Assessment Notes</label>
                      <textarea rows={6} value={evalNotes} onChange={(e) => setEvalNotes(e.target.value)} placeholder="Review financial credibility, course research depth..." className="w-full bg-gray-50 dark:bg-[#0F172A] border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-[#1a73e8]" />
                   </div>

                   <button type="submit" disabled={isSavingEval} className="w-full py-5 bg-[#1a73e8] text-white font-black rounded-3xl text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all">
                      {isSavingEval ? "Committing Entry..." : "Save Evaluation Log"}
                   </button>
                </form>
             </div>
          </div>
        )}

        {/* Modal Components */}
        {historyStudent && <StudentHistoryModal student={historyStudent} onClose={() => setHistoryStudent(null)} onRefreshParent={fetchRealData} />}
        {showBulkPackModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
             <div className="bg-white dark:bg-[#1E293B] w-full max-w-lg rounded-[40px] p-10 space-y-6 shadow-2xl border border-gray-100 dark:border-slate-800 animate-in zoom-in duration-200">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white font-google flex items-center gap-3"><FolderKanban className="w-8 h-8 text-[#1a73e8]" /> Assign Question Pack</h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Assigning to {selectedUids.length} students</p>
                <select value={bulkPackId} onChange={(e) => setBulkPackId(e.target.value)} className="w-full bg-gray-100 dark:bg-[#0F172A] border-none rounded-2xl p-4 text-sm font-black focus:ring-2 focus:ring-[#1a73e8]">
                   <option value="">Select Pack...</option>
                   {availablePacks.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
                <div className="flex gap-4 pt-4">
                   <button onClick={() => setShowBulkPackModal(false)} className="flex-1 py-4 text-xs font-black uppercase text-gray-500">Cancel</button>
                   <button onClick={handleBulkAssignPack} disabled={!bulkPackId} className="flex-1 py-4 bg-[#1a73e8] text-white font-black rounded-2xl text-xs uppercase shadow-xl disabled:opacity-50">Assign Packs</button>
                </div>
             </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
             <div className="bg-white dark:bg-[#1E293B] w-full max-w-lg rounded-[40px] p-10 space-y-8 shadow-2xl border border-rose-100 dark:border-rose-900/30">
                <div className="text-center space-y-4">
                   <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto"><AlertTriangle className="w-10 h-10 text-rose-600" /></div>
                   <h3 className="text-2xl font-black text-gray-900 dark:text-white font-google">Confirm Permanent Purge</h3>
                   <p className="text-xs font-bold text-gray-500 uppercase leading-relaxed px-6">You are about to delete {showDeleteConfirm.names.length} student accounts and all linked data forever.</p>
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase text-rose-600 text-center block">Type DELETE to execute</label>
                   <input type="text" value={deleteInputText} onChange={(e) => setDeleteInputText(e.target.value)} placeholder="DELETE" className="w-full bg-gray-100 dark:bg-[#0F172A] border-none rounded-2xl p-4 text-center text-sm font-black focus:ring-2 focus:ring-rose-500 uppercase" />
                </div>
                <div className="flex gap-4">
                   <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-4 text-xs font-black uppercase text-gray-500">Abort</button>
                   <button onClick={handleCascadeDeleteUsers} disabled={deleteInputText.toUpperCase() !== 'DELETE'} className="flex-1 py-4 bg-rose-600 text-white font-black rounded-2xl text-xs uppercase shadow-xl shadow-rose-500/20 disabled:opacity-50">Execute Delete</button>
                </div>
             </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
