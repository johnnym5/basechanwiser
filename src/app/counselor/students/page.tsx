"use client";

import React, { useState, useEffect, useMemo } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  Search,
  FolderKanban,
  X,
  Save,
  Check,
  AlertCircle,
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  Eye,
  MoreVertical,
  UserPlus,
  Building,
  Mail,
  User,
  ExternalLink,
  Loader2,
  Filter,
  ArrowUpDown,
  FileCheck,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import { collection, doc, setDoc, query, deleteDoc, serverTimestamp, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserProfile, QuestionPack, InterviewPack } from "@/types";
import { withTimeout } from "@/lib/utils/promise-timeout";
import Link from "next/link";
import QuickPortfolioModal from "@/components/counselor/QuickPortfolioModal";
import AssignCounselorModal from "@/components/counselor/AssignCounselorModal";
import EmptyState from "@/components/common/EmptyState";

const generateStudentId = () => {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `BW-${randomNum}`;
};

// ── Status Badge Renderers ──

const renderPackStatus = (status: string) => {
  const base = "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap border transition-all duration-200";

  switch (status?.toUpperCase()) {
    case 'VERIFIED':
    case 'GRADED':
      return (
        <span className={`${base} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}>
          VERIFIED
        </span>
      );
    case 'SUBMITTED':
      return (
        <span className={`${base} bg-blue-500/10 text-blue-400 border-blue-500/20`}>
          SUBMITTED
        </span>
      );
    default:
      return (
        <span className={`${base} bg-slate-800/50 text-slate-400 border-slate-700`}>
          NOT STARTED
        </span>
      );
  }
};

const renderOverallStatus = (status: string) => {
  const base = "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap border transition-all duration-200";

  const getStyles = () => {
    switch (status?.toUpperCase()) {
      case 'RED': return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', dot: 'bg-red-500' };
      case 'AMBER':
      case 'YELLOW':
      case 'ORANGE':
        return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-500' };
      case 'GREEN': return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-500' };
      default: return { bg: 'bg-slate-800/50', text: 'text-slate-400', border: 'border-slate-700', dot: 'bg-slate-500' };
    }
  };

  const styles = getStyles();
  const label = status ? status.toUpperCase() : 'GRAY';

  return (
    <span className={`${base} ${styles.bg} ${styles.text} ${styles.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${styles.dot} shadow-[0_0_8px_rgba(0,0,0,0.5)]`}></span>
      {label}
    </span>
  );
};

export default function CounselorStudentsPage() {
  const { role, loading: authLoading, userId, userProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [students, setStudents] = useState<UserProfile[]>([]);
  const [interviewPacks, setInterviewPacks] = useState<Record<string, InterviewPack>>({});
  const [availablePacks, setAvailablePacks] = useState<QuestionPack[]>([]);
  const [counselorsList, setCounselorsList] = useState<UserProfile[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── Filter & Sort States ──
  const [searchQuery, setSearchQuery] = useState("");
  const [smartFilter, setSmartFilter] = useState("ALL");
  const [counselorFilter, setCounselorFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("recent");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Read initial filters from URL
  useEffect(() => {
    const filter = searchParams.get("filter");
    if (filter) setSmartFilter(filter);

    const initialSearch = searchParams.get("search");
    if (initialSearch) setSearchQuery(initialSearch);
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && role !== "Counselor" && role !== "Admin" && role !== "Super Admin") {
      router.push("/dashboard");
    }
  }, [role, authLoading, router]);

  // CRUD Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    uid: "",
    displayName: "",
    email: "",
    office: "London HQ",
    role: "Student" as any,
    studentId: ""
  });

  // Assignment Modal State
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [selectedQuickStudent, setSelectedQuickStudent] = useState<UserProfile | null>(null);
  const [selectedStudentForCounselor, setSelectedStudentForCounselor] = useState<UserProfile | null>(null);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);

  const isAdmin = role === "Admin" || role === "Super Admin";

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  /**
   * Data Fetching & State Resolution Hook:
   * 
   * PATCH: Infinite Loop Prevention & Reliable State Resolution
   * 1. Dependency Array: Uses stable auth state.
   * 2. finally block: Guaranteed setDataLoading(false) ensures spinner unmounts.
   * 3. Timeout: withTimeout utility forces Promise rejection after 10s.
   */
  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setDataLoading(false);
      return;
    }

    let isSubscribed = true;

    async function loadData() {
      setDataLoading(true);
      setFetchError(null);

      try {
        // Run primary queries with 10s timeout fail-safe
        // ── VISIBILITY RESTRICTION: Counselors only see assigned scholars ──
        let usersQuery = query(collection(db, "Users"));
        if (role === 'Counselor') {
          usersQuery = query(collection(db, "Users"), where('assignedCounselorId', '==', userId));
        }

        const [usersSnap, packsSnap, qPacksSnap] = await Promise.all([
          withTimeout(getDocs(usersQuery), 10000),
          withTimeout(getDocs(collection(db, "Interview_Packs")), 10000),
          withTimeout(getDocs(collection(db, "question_packs")), 10000)
        ]);

        if (!isSubscribed) return;

        // Process Students & Counselors
        const studentList: UserProfile[] = [];
        const staffList: UserProfile[] = [];

        usersSnap.forEach((docSnap) => {
          const data = docSnap.data() as UserProfile;
          if (data.role === "Student" || !data.role) {
            studentList.push({ ...data, uid: docSnap.id });
          } else if (data.role === "Counselor" || data.role === "Admin" || data.role === "Super Admin") {
            staffList.push({ ...data, uid: docSnap.id });
          }
        });

        // Process Interview Packs
        const packMap: Record<string, InterviewPack> = {};
        packsSnap.forEach((docSnap) => {
          packMap[docSnap.id] = docSnap.data() as InterviewPack;
        });

        // Process Question Packs
        const packList: QuestionPack[] = [];
        qPacksSnap.forEach((docSnap) => {
          packList.push({ id: docSnap.id, ...docSnap.data() } as QuestionPack);
        });

        setStudents(studentList);
        setCounselorsList(staffList);
        setInterviewPacks(packMap);
        setAvailablePacks(packList);

      } catch (err: any) {
        console.error("[StudentsPage] Fetch Error:", err);
        if (isSubscribed) {
          setFetchError(err?.message === "REQUEST_TIMEOUT"
            ? "Connection timeout. Please check your internet and try again."
            : "Failed to synchronize workspace data.");
        }
      } finally {
        // UNIVERSAL RESOLUTION: This block runs regardless of success or error,
        // preventing the "infinite loading workspace" loop.
        if (isSubscribed) {
          setDataLoading(false);
        }
      }
    }

    loadData();

    return () => { isSubscribed = false; };
  }, [authLoading, userId]);

  // ── Filter & Sort Logic ──
  const displayedStudents = useMemo(() => {
    let processed = [...students];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      processed = processed.filter(s =>
        s.displayName?.toLowerCase().includes(q) ||
        s.studentId?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q)
      );
    }

    // Smart Filters
    if (smartFilter !== "ALL") {
      switch (smartFilter) {
        case "STAR":
          processed = processed.filter(s => (s.learningProgress || 0) >= 80);
          break;
        case "IN_PROGRESS":
          processed = processed.filter(s => (s.learningProgress || 0) > 0 && (s.learningProgress || 0) < 100);
          break;
        case "AT_RISK":
          processed = processed.filter(s => s.readinessStatus === 'Red');
          break;
        case "READY":
          processed = processed.filter(s => s.readinessStatus === 'Green');
          break;
        case "INACTIVE":
          const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
          processed = processed.filter(s => {
            if (!s.lastLoginAt) return true;
            return (s.lastLoginAt.seconds * 1000) < sevenDaysAgo;
          });
          break;
        case "SUBMITTED":
          processed = processed.filter(s => (interviewPacks[s.uid]?.status === 'Submitted'));
          break;
      }
    }

    // Counselor Filter
    if (counselorFilter !== "ALL") {
      if (counselorFilter === "UNASSIGNED") {
        processed = processed.filter(s => !s.assignedCounselorId);
      } else {
        processed = processed.filter(s => s.assignedCounselorId === counselorFilter);
      }
    }

    // Sorting
    processed.sort((a, b) => {
      switch (sortBy) {
        case "progressHigh": return (b.learningProgress || 0) - (a.learningProgress || 0);
        case "progressLow": return (a.learningProgress || 0) - (b.learningProgress || 0);
        case "lastActive":
          return (b.lastLoginAt?.seconds || 0) - (a.lastLoginAt?.seconds || 0);
        case "name": return (a.displayName || "").localeCompare(b.displayName || "");
        default: return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      }
    });

    return processed;
  }, [students, interviewPacks, searchQuery, smartFilter, sortBy, counselorFilter]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.displayName) return;
    setIsProcessing(true);
    try {
      const dummyUid = `student_${Date.now()}`;
      const studentId = generateStudentId();
      await setDoc(doc(db, "Users", dummyUid), {
        uid: dummyUid,
        studentId,
        displayName: formData.displayName,
        email: formData.email,
        office: formData.office,
        role: "Student",
        suspended: false,
        currentModuleLevel: 1,
        moduleScores: {},
        readinessStatus: "Gray",
        learningProgress: 0,
        createdAt: serverTimestamp(),
      });

      showToast(`Student profile for ${formData.displayName} created! ID: ${studentId}`, "success");
      setShowAddModal(false);
      setFormData({ uid: "", displayName: "", email: "", office: "London HQ", role: "Student", studentId: "" });
    } catch (err: any) {
      showToast(`Failed to create student: ${err.message}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditStudent = (student: UserProfile) => {
    setFormData({
      uid: student.uid,
      displayName: student.displayName || "",
      email: student.email || "",
      office: student.office || "London HQ",
      role: student.role || "Student",
      studentId: student.studentId || ""
    });
    setShowEditModal(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.uid) return;
    setIsProcessing(true);
    try {
      await setDoc(doc(db, "Users", formData.uid), {
        displayName: formData.displayName,
        office: formData.office,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      showToast("Student profile updated successfully.", "success");
      setShowEditModal(false);
    } catch (err: any) {
      showToast(`Update failed: ${err.message}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteStudent = async (uid: string, name: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete student ${name}? This will also delete their quiz history.`)) return;
    setIsProcessing(true);
    try {
      // 1. Delete attempts
      const q = query(collection(db, "quiz_attempts"), where("userId", "==", uid));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
      // 2. Delete user
      await deleteDoc(doc(db, "Users", uid));
      showToast("Student account and history purged.", "success");
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const openAssignmentModal = (student: UserProfile) => {
    setSelectedStudent(student);
    const defaultIds = availablePacks.filter((p) => p.isDefault).map((p) => p.id);
    const existingIds = student.assignedPackIds || [];
    const merged = Array.from(new Set([...defaultIds, ...existingIds]));
    setAssignedIds(merged);
  };

  const togglePackAssignment = (packId: string) => {
    setAssignedIds((prev) =>
      prev.includes(packId) ? prev.filter((id) => id !== packId) : [...prev, packId]
    );
  };

  const handleSaveAssignments = async () => {
    if (!selectedStudent) return;
    setIsSavingAssignments(true);
    try {
      await setDoc(
        doc(db, "Users", selectedStudent.uid),
        { assignedPackIds: assignedIds },
        { merge: true }
      );

      showToast(`Assigned learning packs updated for ${selectedStudent.displayName || "student"}!`, "success");
      setSelectedStudent(null);
    } catch (err) {
      console.error("Save assignments error:", err);
      showToast("Failed to update learning pack assignments.", "error");
    } finally {
      setIsSavingAssignments(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">

        {/* Quick View Modal */}
        {selectedQuickStudent && (
          <QuickPortfolioModal
            student={selectedQuickStudent}
            onClose={() => setSelectedQuickStudent(null)}
          />
        )}

        {/* Toast */}
        {toast && (
          <div className={`fixed top-20 right-6 z-[60] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border transition-all ${toast.type === "success" ? "bg-emerald-600 text-white border-emerald-500" : "bg-rose-600 text-white border-rose-500"}`}>
            {toast.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 font-google">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#1a73e8] dark:text-blue-400" /> Master Student Directory
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Unified command center for demographics, compliance KPIs, and interview readiness.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-black rounded-full text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <UserPlus size={16} /> Add Student
          </button>
        </div>

        {/* Filter & Sort Controls */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, ID, or email..."
                className="w-full bg-gray-50 dark:bg-slate-900 border-none rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-gray-700 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
               <div className="relative group">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-500 pointer-events-none" />
                  <select
                    value={smartFilter}
                    onChange={(e) => setSmartFilter(e.target.value)}
                    className="w-full appearance-none bg-gray-50 dark:bg-slate-900 border-none rounded-2xl pl-11 pr-10 py-3 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    <option value="ALL">All Scholars</option>
                    <option value="STAR">Star Students (80%+)</option>
                    <option value="IN_PROGRESS">In-Progress</option>
                    <option value="READY">Ready (Green)</option>
                    <option value="AT_RISK">At-Risk (Red)</option>
                    <option value="INACTIVE">Inactive (7+ Days)</option>
                    <option value="SUBMITTED">Packs Submitted</option>
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none rotate-90" />
               </div>

               {isAdmin && (
                 <div className="relative group">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-500 pointer-events-none" />
                   <select
                     value={counselorFilter}
                     onChange={(e) => setCounselorFilter(e.target.value)}
                     className="w-full appearance-none bg-gray-50 dark:bg-slate-900 border-none rounded-2xl pl-11 pr-10 py-3 text-[10px] font-black uppercase tracking-widest text-[#1a73e8] focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                   >
                     <option value="ALL">All Counselors</option>
                     <option value="UNASSIGNED">Unassigned</option>
                     {counselorsList.map(c => (
                       <option key={c.uid} value={c.uid}>{c.displayName}</option>
                     ))}
                   </select>
                   <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none rotate-90" />
                 </div>
               )}

               <div className="relative group">
                  <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500 pointer-events-none" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none bg-gray-50 dark:bg-slate-900 border-none rounded-2xl pl-11 pr-10 py-3 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    <option value="recent">Recently Added</option>
                    <option value="lastActive">Recently Active</option>
                    <option value="progressHigh">Progress: High → Low</option>
                    <option value="progressLow">Progress: Low → High</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none rotate-90" />
               </div>
            </div>
          </div>
        </div>

        {/* Master Data Table */}
        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-[32px] overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase font-black text-[10px] tracking-widest border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="p-6">Student Identity</th>
                  <th className="p-6">Counselor</th>
                  <th className="p-6">Progress</th>
                  <th className="p-6">Interview Pack</th>
                  <th className="p-6">Status</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700 font-medium text-gray-800 dark:text-gray-200">
                {dataLoading ? (
                  <tr><td colSpan={6} className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#1a73e8] mb-2" />
                    <p className="font-black uppercase tracking-widest text-[10px] text-gray-400">Synchronizing Master Data...</p>
                  </td></tr>
                ) : fetchError ? (
                   <tr><td colSpan={6} className="p-12">
                     <EmptyState
                       icon={AlertCircle}
                       title="Unable to load workspace"
                       description={fetchError}
                       actionText="Retry Refresh"
                       onAction={() => window.location.reload()}
                     />
                   </td></tr>
                ) : displayedStudents.length === 0 ? (
                  <tr><td colSpan={6} className="p-12">
                    <EmptyState
                      icon={Search}
                      title="No Results Found"
                      description="Try adjusting your filters or reset search to see students."
                      actionText="Reset All Filters"
                      onAction={() => { setSearchQuery(""); setSmartFilter("ALL"); setCounselorFilter("ALL"); }}
                    />
                  </td></tr>
                ) : (
                  displayedStudents.map((student) => {
                    const packStatus = interviewPacks[student.uid]?.status || "Not Started";
                    const assignedCounselor = counselorsList.find(c => c.uid === student.assignedCounselorId);

                    return (
                      <tr
                        key={student.uid}
                        className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group cursor-pointer"
                        onClick={() => setSelectedQuickStudent(student)}
                      >
                        <td className="p-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center font-black text-[#1a73e8] text-sm group-hover:scale-110 transition-transform">
                                {(student.displayName || "S").charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                 <p className="font-black text-sm text-gray-900 dark:text-white truncate">{student.displayName}</p>
                                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{student.email}</p>
                              </div>
                           </div>
                        </td>
                        <td className="p-6">
                           <div className="flex items-center gap-2">
                              <span className="text-[11px] text-gray-700 dark:text-gray-300 font-bold whitespace-nowrap">
                                 {assignedCounselor?.displayName || "Unassigned"}
                              </span>
                              {isAdmin && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedStudentForCounselor(student); }}
                                  className="text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30 px-2 py-1 rounded transition-all"
                                >
                                  Assign
                                </button>
                              )}
                           </div>
                        </td>
                        <td className="p-6">
                           <div className="w-24 bg-gray-100 dark:bg-gray-900 rounded-full h-1.5 overflow-hidden">
                             <div className="h-full bg-blue-500" style={{ width: `${student.learningProgress || 0}%` }} />
                           </div>
                           <p className="text-[9px] font-black text-gray-400 mt-1 uppercase">{student.learningProgress || 0}% Complete</p>
                        </td>
                        <td className="p-6">
                           {renderPackStatus(packStatus)}
                        </td>
                        <td className="p-6">
                           {renderOverallStatus(student.readinessStatus || "Gray")}
                        </td>
                        <td className="p-6 text-right">
                           <button onClick={(e) => { e.stopPropagation(); setSelectedQuickStudent(student); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 transition-colors"><Eye size={16}/></button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Mobile View: Simplified Cards ── */}
        <div className="md:hidden">
          {dataLoading ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin mx-auto text-[#1a73e8] mb-2" />
              <p className="font-black uppercase tracking-widest text-[10px]">Synchronizing Master Data...</p>
            </div>
          ) : displayedStudents.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={Search}
                title="No Results Found"
                description="Try adjusting your filters or reset search to see students."
                actionText="Reset All Filters"
                onAction={() => {
                  setSearchQuery("");
                  setSmartFilter("ALL");
                  setCounselorFilter("ALL");
                }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {displayedStudents.map((student) => {
                const assignedCounselor = counselorsList.find(c => c.uid === student.assignedCounselorId);
                return (
                  <div
                    key={student.uid}
                    onClick={() => setSelectedQuickStudent(student)}
                    className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center font-black text-blue-600 text-xs">
                          {(student.displayName || "S").charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-sm text-gray-900 dark:text-white truncate">{student.displayName}</p>
                          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">{student.studentId}</p>
                        </div>
                      </div>
                      {renderOverallStatus(student.readinessStatus || "Gray")}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50 dark:border-gray-700">
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Counselor</p>
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-[10px] font-black dark:text-white truncate">{assignedCounselor?.displayName || "Unassigned"}</p>
                          {isAdmin && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedStudentForCounselor(student); }}
                              className="text-indigo-400"
                            >
                              <Edit3 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Progress</p>
                        <p className="text-[10px] font-black dark:text-white">{student.learningProgress || 0}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Modals & Drawers ── */}

        {/* Assign Counselor Modal */}
        {selectedStudentForCounselor && (
          <AssignCounselorModal
            student={selectedStudentForCounselor}
            counselors={counselorsList}
            onClose={() => setSelectedStudentForCounselor(null)}
            onSuccess={() => {
              showToast("Counselor reassigned successfully.", "success");
              // UI will reflect changes due to live listeners or local state sync in a real app
            }}
          />
        )}

      </div>
    </AppShell>
  );
}
