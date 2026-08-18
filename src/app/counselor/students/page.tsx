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
  ChevronRight,
  ChevronLeft,
  Activity,
  FileText,
  Clock,
  CalendarPlus,
  StickyNote
} from "lucide-react";
import { collection, doc, setDoc, query, deleteDoc, serverTimestamp, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserProfile, QuestionPack, InterviewPack } from "@/types";
import { withTimeout } from "@/lib/utils/promise-timeout";
import Link from "next/link";
import QuickPortfolioModal from "@/components/counselor/QuickPortfolioModal";
import AssignCounselorModal from "@/components/counselor/AssignCounselorModal";
import SetReminderModal from "@/components/counselor/SetReminderModal";
import QuickNoteModal from "@/components/counselor/QuickNoteModal";
import EmptyState from "@/components/common/EmptyState";
import StatusDropdown from "@/components/ui/StatusDropdown";
import { formatDistanceToNow } from "date-fns";

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

  // ── Pagination & Dropdown State ──
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const itemsPerPage = 10;

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
  const [selectedStudentForReminder, setSelectedStudentForReminder] = useState<UserProfile | null>(null);
  const [selectedStudentForNote, setSelectedStudentForNote] = useState<UserProfile | null>(null);
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
          processed = processed.filter(s =>
            s.readinessStatus === 'Yellow' ||
            s.readinessStatus === 'Orange'
          );
          break;
        case "AT_RISK":
          processed = processed.filter(s => s.readinessStatus === 'Red');
          break;
        case "INTERVIEW_READY":
          processed = processed.filter(s => s.readinessStatus === 'Green');
          break;
        case "NOT_STARTED":
          processed = processed.filter(s => !s.readinessStatus || s.readinessStatus === 'Gray');
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

  // ── Pagination Calculation ──
  const totalPages = Math.ceil(displayedStudents.length / itemsPerPage);
  const visibleStudents = displayedStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ── Parent callback to update local state without refreshing ──
  const handleLocalStatusUpdate = (studentId: string, newStatus: string) => {
    setStudents(prev => prev.map(s => s.uid === studentId ? { ...s, readinessStatus: newStatus as any } : s));
  };

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
        readinessStatus: "NOT_STARTED",
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
                    <option value="INTERVIEW_READY">Interview Ready (Green)</option>
                    <option value="AT_RISK">At-Risk (Red)</option>
                    <option value="IN_PROGRESS">In-Progress (Amber)</option>
                    <option value="NOT_STARTED">Not Started (Gray)</option>
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

        {/* Master Student Card Grid */}
        <div className="space-y-6">
          {dataLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#1a73e8] mb-2" />
              <p className="font-black uppercase tracking-widest text-[10px] text-gray-400">Synchronizing Master Data...</p>
            </div>
          ) : fetchError ? (
            <div className="p-12">
              <EmptyState
                icon={AlertCircle}
                title="Unable to load workspace"
                description={fetchError}
                actionText="Retry Refresh"
                onAction={() => window.location.reload()}
              />
            </div>
          ) : visibleStudents.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={Search}
                title="No Results Found"
                description="Try adjusting your filters or reset search to see students."
                actionText="Reset All Filters"
                onAction={() => { setSearchQuery(""); setSmartFilter("ALL"); setCounselorFilter("ALL"); }}
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 animate-in fade-in duration-500">
                {visibleStudents.map((student) => {
                  const packStatus = interviewPacks[student.uid]?.status || "Not Started";
                  const assignedCounselor = counselorsList.find(c => c.uid === student.assignedCounselorId);
                  const lastSeen = student.lastLoginAt
                    ? formatDistanceToNow(student.lastLoginAt.seconds * 1000) + ' ago'
                    : 'Never';

                  return (
                    <div
                      key={student.uid}
                      className="relative bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-500/50 transition-all group shadow-sm"
                    >
                      {/* Top Row: Identity & Actions */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center font-black text-xl border border-blue-100 dark:border-blue-900/30 group-hover:scale-105 transition-transform">
                            {(student.displayName || "S").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tighter truncate">
                              {student.displayName}
                            </h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{student.email}</p>
                            <p className="text-xs text-blue-500 font-black uppercase tracking-tighter mt-1">
                              Counselor: {assignedCounselor?.displayName || 'Unassigned'}
                            </p>
                          </div>
                        </div>

                        {/* Action Dropdown */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === student.uid ? null : student.uid);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-[#0F172A] transition-all"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {openDropdownId === student.uid && (
                            <>
                              <div className="fixed inset-0 z-[40]" onClick={() => setOpenDropdownId(null)} />
                              <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl z-[50] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="py-1">
                                  <button
                                    onClick={() => { router.push(`/counselor/students/portfolio?id=${student.uid}`); setOpenDropdownId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5 mr-3 text-blue-500"/> View Profile
                                  </button>
                                  <button
                                    onClick={() => { setSelectedQuickStudent(student); setOpenDropdownId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center transition-colors"
                                  >
                                    <FileText className="w-3.5 h-3.5 mr-3 text-emerald-500"/> View Pack
                                  </button>
                                  <button
                                    onClick={() => { handleEditStudent(student); setOpenDropdownId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center transition-colors"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 mr-3 text-amber-500"/> Edit Student
                                  </button>
                                  <button
                                    onClick={() => { setSelectedStudentForCounselor(student); setOpenDropdownId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center transition-colors"
                                  >
                                    <UserPlus className="w-3.5 h-3.5 mr-3 text-indigo-500"/> Assign Counselor
                                  </button>
                                  <button
                                    onClick={() => { setSelectedStudentForReminder(student); setOpenDropdownId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center transition-colors"
                                  >
                                    <CalendarPlus className="w-3.5 h-3.5 mr-3 text-purple-500"/> Set Reminder
                                  </button>
                                  <button
                                    onClick={() => { setSelectedStudentForNote(student); setOpenDropdownId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center transition-colors"
                                  >
                                    <StickyNote className="w-3.5 h-3.5 mr-3 text-amber-500"/> Quick Note
                                  </button>
                                  <div className="h-px bg-gray-50 dark:bg-slate-800 my-1"></div>
                                  <button
                                    onClick={() => { handleDeleteStudent(student.uid, student.displayName || "Scholar"); setOpenDropdownId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-3"/> Purge Account
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Bottom Row: Pill Metrics */}
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-50 dark:border-slate-800">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-gray-50 dark:bg-[#0F172A] text-gray-400 border border-gray-100 dark:border-slate-800">
                          <Clock className="w-3 h-3 mr-1.5" />
                          Last Seen: {lastSeen}
                        </span>
                        {renderPackStatus(packStatus)}

                        {/* 🚨 THE ONLY STATUS INDICATOR - Dropped redundant pills */}
                        <div className="ml-auto">
                           <StatusDropdown
                             studentId={student.uid}
                             initialStatus={student.readinessStatus || "NOT_STARTED"}
                             onStatusChange={handleLocalStatusUpdate}
                           />
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-10 p-6 bg-white dark:bg-[#1E293B] rounded-3xl border border-gray-100 dark:border-slate-800 gap-4">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, displayedStudents.length)} of {displayedStudents.length} Scholars
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl bg-gray-50 dark:bg-[#0F172A] text-gray-500 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-slate-900 transition-all border border-gray-100 dark:border-slate-800"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center px-6 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                       <span className="text-xs font-black text-blue-600 dark:text-blue-400">{currentPage} <span className="text-gray-400 mx-1">/</span> {totalPages}</span>
                    </div>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl bg-gray-50 dark:bg-[#0F172A] text-gray-500 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-slate-900 transition-all border border-gray-100 dark:border-slate-800"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
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

        {/* Set Reminder Modal */}
        {selectedStudentForReminder && (
          <SetReminderModal
            student={{
              uid: selectedStudentForReminder.uid,
              studentId: selectedStudentForReminder.studentId,
              displayName: selectedStudentForReminder.displayName
            }}
            onClose={() => setSelectedStudentForReminder(null)}
            onSuccess={() => showToast("Reminder scheduled successfully.", "success")}
          />
        )}

        {/* Quick Note Modal */}
        {selectedStudentForNote && (
          <QuickNoteModal
            student={{
              uid: selectedStudentForNote.uid,
              displayName: selectedStudentForNote.displayName
            }}
            onClose={() => setSelectedStudentForNote(null)}
            onSuccess={() => showToast("Note saved to timeline.", "success")}
          />
        )}

      </div>
    </AppShell>
  );
}
