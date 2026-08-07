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
  CheckCircle2
} from "lucide-react";
import { collection, onSnapshot, doc, setDoc, query, deleteDoc, serverTimestamp, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserProfile, QuestionPack, InterviewPack } from "@/types";
import Link from "next/link";
import QuickViewModal from "@/components/counselor/QuickViewModal";
import EmptyState from "@/components/common/EmptyState";

const generateStudentId = () => {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `BW-${randomNum}`;
};

export default function CounselorStudentsPage() {
  const { role, loading: authLoading, userId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [students, setStudents] = useState<UserProfile[]>([]);
  const [interviewPacks, setInterviewPacks] = useState<Record<string, InterviewPack>>({});
  const [availablePacks, setAvailablePacks] = useState<QuestionPack[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // ── Filter & Sort States ──
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPack, setFilterPack] = useState("All");
  const [sortBy, setSortBy] = useState("recent");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Read initial filters from URL
  useEffect(() => {
    const status = searchParams.get("status");
    if (status) setFilterStatus(status);

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
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Real-time listener for Users, Interview Packs, and Question Packs
  useEffect(() => {
    if (authLoading || !userId || (role !== "Counselor" && role !== "Admin" && role !== "Super Admin")) {
      return;
    }

    setDataLoading(true);

    // 1. Real-time users listener
    const usersQuery = query(collection(db, "Users"));
    const unsubscribeUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        const studentList: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.role === "Student" || !data.role) {
            studentList.push({ uid: docSnap.id, ...data } as UserProfile);
          }
        });
        setStudents(studentList);
        setDataLoading(false);
      },
      (error) => {
        console.warn("Real-time users listener error:", error);
        setDataLoading(false);
      }
    );

    // 2. Real-time interview packs listener
    const packsRef = collection(db, "Interview_Packs");
    const unsubscribePacks = onSnapshot(packsRef, (snapshot) => {
      const packMap: Record<string, InterviewPack> = {};
      snapshot.forEach((docSnap) => {
        packMap[docSnap.id] = docSnap.data() as InterviewPack;
      });
      setInterviewPacks(packMap);
    });

    // 3. Real-time question packs listener
    const qPacksQuery = query(collection(db, "question_packs"));
    const unsubscribeQPacks = onSnapshot(
      qPacksQuery,
      (snapshot) => {
        const packList: QuestionPack[] = [];
        snapshot.forEach((docSnap) => {
          packList.push({ id: docSnap.id, ...docSnap.data() } as QuestionPack);
        });
        setAvailablePacks(packList);
      },
      (error) => {
        console.warn("Real-time question packs listener error:", error);
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribePacks();
      unsubscribeQPacks();
    };
  }, []);

  // ── Filter & Sort Logic ──
  const displayedStudents = useMemo(() => {
    let processed = [...students];

    // A. Search Filter
    if (searchQuery) {
      const queryStr = searchQuery.toLowerCase();
      processed = processed.filter(s =>
        s.displayName?.toLowerCase().includes(queryStr) ||
        s.studentId?.toLowerCase().includes(queryStr) ||
        s.email?.toLowerCase().includes(queryStr)
      );
    }
    return processed;
  }, [students, searchQuery]);

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
        {selectedStudent && (
          <QuickViewModal
            student={selectedStudent}
            onClose={() => setSelectedStudent(null)}
          />
        )}
        {/* Toast */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 font-google">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#1a73e8] dark:text-blue-400" /> Master Student Directory
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Unified source of truth for demographics, compliance KPIs, and interview readiness.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-black rounded-full text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> Add Student
          </button>
        </div>

        {/* ── Filter & Sort Controls UI ── */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Global Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, ID, or email..."
                className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-gray-700 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
               {/* Status Filter */}
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">Readiness Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-4 py-3 text-xs font-black text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Green">Green (Ready)</option>
                    <option value="Yellow">Yellow (Warning)</option>
                    <option value="Orange">Orange (Risk)</option>
                    <option value="Red">Red (Critical)</option>
                    <option value="Gray">Gray (New)</option>
                  </select>
               </div>

               {/* Interview Pack Filter */}
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">Pack Status</label>
                  <select
                    value={filterPack}
                    onChange={(e) => setFilterPack(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-4 py-3 text-xs font-black text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">All Pack States</option>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Verified">Verified</option>
                  </select>
               </div>

               {/* Sort Dropdown */}
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">Sort Data By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-4 py-3 text-xs font-black text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="recent">Recently Added</option>
                    <option value="lastActive">Recently Active</option>
                    <option value="progressHigh">Progress: High → Low</option>
                    <option value="progressLow">Progress: Low → High</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
               </div>
            </div>
          </div>
        </div>

        {/* ── Master Table ── */}
        <div className="bg-white dark:bg-slate-800 rounded-[32px] overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
               <tr>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Student Details</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Student ID</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
               {dataLoading ? (
                 <tr><td colSpan={3} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></td></tr>
               ) : displayedStudents.map(s => {
                  const statusColor = s.readinessStatus === "Green" ? "bg-emerald-500" : s.readinessStatus === "Yellow" ? "bg-amber-500" : "bg-rose-500";
                  return (
                    <tr key={s.uid} className="hover:bg-blue-50/10 transition-all group">
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center font-black text-blue-600 text-xs">
                                {s.displayName?.charAt(0)}
                             </div>
                             <div>
                                <div className="flex items-center gap-2">
                                   <span className="text-sm font-black dark:text-white uppercase tracking-tighter">{s.displayName}</span>
                                   <div className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">{s.studentId || 'ID-PENDING'}</span>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <button
                            onClick={() => setSelectedStudent(s)}
                            className="bg-white dark:bg-slate-800 px-6 py-2 rounded-xl text-[10px] font-black uppercase border border-gray-200 dark:border-slate-700 shadow-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                          >
                             Quick View
                          </button>
                       </td>
                    </tr>
                  );
               })}
            </tbody>
          </table>
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
                description="We couldn't find any students matching your current search or filter criteria. Try a different filter or reset your search."
                actionText="Reset Filters"
                onAction={() => {
                  setSearchQuery("");
                  setFilterStatus("All");
                  setFilterPack("All");
                }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {displayedStudents.map((student) => (
                <div
                  key={student.uid}
                  onClick={() => setSelectedStudent(student)}
                  className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center font-black text-blue-600 text-xs">
                        {(student.displayName || "S").charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-sm text-gray-900 dark:text-white truncate">{student.displayName}</p>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">{student.studentId}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase border ${
                      student.readinessStatus === "Green" ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : "bg-rose-50 text-rose-600 border-rose-200"
                    }`}>● {student.readinessStatus || "Gray"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Progress</p>
                      <p className="text-xs font-black dark:text-white">{student.learningProgress || 0}%</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Pack</p>
                      <p className="text-xs font-black dark:text-white truncate">{interviewPacks[student.uid]?.status || "Not Started"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Modals & Drawers ── */}
        {/* (Rest of the modals remain the same as previous implementation) */}

        {/* Add Student Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
             <div className="bg-white dark:bg-[#1E293B] w-full max-w-lg rounded-[40px] p-10 shadow-2xl animate-in zoom-in duration-200 border border-gray-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-8">
                   <div className="space-y-1">
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Register New Scholar</h2>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Manual database entry for student tracking.</p>
                   </div>
                   <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all"><X className="w-6 h-6 text-gray-400" /></button>
                </div>

                <form onSubmit={handleCreateStudent} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><User className="w-3 h-3" /> Full Name</label>
                      <input type="text" required value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0F172A] border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500" placeholder="John Doe" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Mail className="w-3 h-3" /> Email Address</label>
                      <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0F172A] border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500" placeholder="john@example.com" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Building className="w-3 h-3" /> Assigned Office</label>
                      <select value={formData.office} onChange={e => setFormData({...formData, office: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0F172A] border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500">
                         <option value="London HQ">London HQ</option>
                         <option value="Lagos">Lagos</option>
                         <option value="Abuja">Abuja</option>
                         <option value="Benin">Benin</option>
                      </select>
                   </div>

                   <button type="submit" disabled={isProcessing} className="w-full py-5 bg-[#1a73e8] text-white font-black rounded-3xl text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Finalize Entry
                   </button>
                </form>
             </div>
          </div>
        )}

        {/* Edit Student Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
             <div className="bg-white dark:bg-[#1E293B] w-full max-w-lg rounded-[40px] p-10 shadow-2xl animate-in zoom-in duration-200 border border-gray-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-8">
                   <div className="space-y-1">
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Edit Scholar Data</h2>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Update information for {formData.studentId}</p>
                   </div>
                   <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all"><X className="w-6 h-6 text-gray-400" /></button>
                </div>

                <form onSubmit={handleUpdateStudent} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><User className="w-3 h-3" /> Full Name</label>
                      <input type="text" required value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0F172A] border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500" />
                   </div>
                   <div className="space-y-2 opacity-50 cursor-not-allowed">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Mail className="w-3 h-3" /> Email Address (Read-Only)</label>
                      <input type="email" disabled value={formData.email} className="w-full bg-gray-100 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Building className="w-3 h-3" /> Assigned Office</label>
                      <select value={formData.office} onChange={e => setFormData({...formData, office: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0F172A] border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500">
                         <option value="London HQ">London HQ</option>
                         <option value="Lagos">Lagos</option>
                         <option value="Abuja">Abuja</option>
                         <option value="Benin">Benin</option>
                      </select>
                   </div>

                   <button type="submit" disabled={isProcessing} className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-3xl text-sm uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3">
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Save Updates
                   </button>
                </form>
             </div>
          </div>
        )}

        {/* Assignment Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex md:justify-end items-end md:items-stretch">
            <div className="w-full md:max-w-xl bg-white dark:bg-gray-800 md:h-full max-h-[92dvh] md:max-h-none rounded-t-3xl md:rounded-none p-5 md:p-6 overflow-y-auto space-y-5 shadow-2xl animate-slide-up md:animate-none">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white text-lg font-google">
                    Assign Question Packs: {selectedStudent.displayName}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedStudent.email}</p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  Select Question Packs available to this student:
                </p>

                {availablePacks.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                    No Question Packs available in the library yet. Create packs in the Question Packs Library first.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availablePacks.map((pack) => {
                      const isChecked = assignedIds.includes(pack.id);
                      return (
                        <div
                          key={pack.id}
                          onClick={() => togglePackAssignment(pack.id)}
                          className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                            isChecked
                              ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700"
                              : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          <div className="space-y-1 pr-4">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs text-gray-900 dark:text-white">{pack.title}</h4>
                              {pack.isDefault && (
                                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              Category: {pack.category || "General"} • {pack.questions ? pack.questions.length : 0} questions • Pass Mark {pack.passScore || 80}%
                            </p>
                          </div>

                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                              isChecked
                                ? "bg-[#1a73e8] border-[#1a73e8] text-white"
                                : "border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600"
                            }`}
                          >
                            {isChecked && <Check className="w-4 h-4" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {assignedIds.length} pack(s) selected
                </span>
                <button
                  onClick={handleSaveAssignments}
                  disabled={isSavingAssignments}
                  className="px-6 py-2.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Save Assignments
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
