"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
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
  Loader2
} from "lucide-react";
import { collection, onSnapshot, doc, setDoc, query, deleteDoc, serverTimestamp, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserProfile, QuestionPack } from "@/types";
import Link from "next/link";

const generateStudentId = () => {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `BW-${randomNum}`;
};

export default function CounselorStudentsPage() {
  const { role, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && role !== "Counselor" && role !== "Admin" && role !== "Super Admin") {
      router.push("/dashboard");
    }
  }, [role, authLoading, router]);

  const [students, setStudents] = useState<UserProfile[]>([]);
  const [availablePacks, setAvailablePacks] = useState<QuestionPack[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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

  const [activeMenuUid, setActiveMenuUid] = useState<string | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Real-time listener for Users and Question Packs
  useEffect(() => {
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

    // 2. Real-time question packs listener
    const packsQuery = query(collection(db, "question_packs"));
    const unsubscribePacks = onSnapshot(
      packsQuery,
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
    };
  }, []);

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

  const filteredStudents = students.filter(
    (s) =>
      (s.displayName && s.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.office && s.office.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Toast */}
        {toast && (
          <div
            className={`fixed top-16 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border transition-all ${
              toast.type === "success"
                ? "bg-emerald-600 text-white border-emerald-500"
                : "bg-rose-600 text-white border-rose-500"
            }`}
          >
            {toast.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 font-google">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#1a73e8] dark:text-blue-400" /> Student CRM Directory
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Manage student accounts, track portfolio data, and assign compliance Question Packs.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-black rounded-full text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> Add Student
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full pl-9 pr-4 py-2.5 text-xs text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* ── Table: md+ screens ────────────────────────────────── */}
        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="p-4">Student Identity</th>
                  <th className="p-4">Office</th>
                  <th className="p-4">Assigned Packs</th>
                  <th className="p-4">Readiness</th>
                  <th className="p-4 text-right">Portfolio Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-medium text-gray-800 dark:text-gray-200">
                {dataLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Sparkles className="w-5 h-5 animate-spin mx-auto text-[#1a73e8] mb-2" /> Loading...
                  </td></tr>
                ) : filteredStudents.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">No registered students found.</td></tr>
                ) : (
                  filteredStudents.map((student) => {
                    const assignedCount = student.assignedPackIds ? student.assignedPackIds.length : availablePacks.filter((p) => p.isDefault).length;
                    return (
                      <tr key={student.uid} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center font-black text-[#1a73e8] text-xs">
                              {(student.displayName || "S").charAt(0).toUpperCase()}
                            </div>
                            <div>
                               <p className="font-black text-gray-900 dark:text-white leading-none mb-1">{student.displayName || "Student User"}</p>
                               <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                  <span className="text-blue-500">{student.studentId || "NO-ID"}</span>
                                  <span>•</span>
                                  <span>{student.email}</span>
                               </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-300 font-bold">{student.office || "London HQ"}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-50 dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <FolderKanban className="w-3 h-3" /> {assignedCount} Packs
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                            student.readinessStatus === "Green" ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : student.readinessStatus === "Yellow" ? "bg-amber-50 text-amber-600 border-amber-200"
                            : "bg-rose-50 text-rose-600 border-rose-200"
                          }`}>● {student.readinessStatus || "Red"}</span>
                        </td>
                        <td className="p-4 text-right">
                           <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/counselor/students/${student.uid}`}
                                className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                title="View Portfolio"
                              >
                                 <Eye className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleEditStudent(student)}
                                className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm"
                                title="Edit Info"
                              >
                                 <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openAssignmentModal(student)}
                                className="px-4 py-2.5 rounded-xl bg-[#1a73e8] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#1557b0] transition-all shadow-md active:scale-95"
                              >
                                Assign
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student.uid, student.displayName || "")}
                                className="p-2.5 rounded-xl text-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-all"
                                title="Purge Account"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Cards: mobile-only (< md) ─────────────────────────── */}
        <div className="md:hidden space-y-3">
          {dataLoading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Sparkles className="w-5 h-5 animate-spin mx-auto text-[#1a73e8] mb-2" /> Loading students...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">
              No registered students found.
            </div>
          ) : (
            filteredStudents.map((student) => {
              const assignedCount = student.assignedPackIds ? student.assignedPackIds.length : availablePacks.filter((p) => p.isDefault).length;
              const status = student.readinessStatus;
              return (
                <div key={student.uid} className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-[#1a73e8] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-lg shadow-blue-500/10">
                        {(student.displayName || "S").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-sm text-gray-900 dark:text-white truncate">{student.displayName || "Student User"}</p>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">{student.studentId || "NO-ID"}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                      status === "Green" ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : status === "Yellow" ? "bg-amber-50 text-amber-600 border-amber-200"
                      : "bg-rose-50 text-rose-600 border-rose-200"
                    }`}>● {status || "Red"}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-50 dark:border-slate-800 pt-4">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{student.office || "London HQ"}</span>
                     <div className="flex items-center gap-2">
                        <Link href={`/counselor/students/${student.uid}`} className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><Eye className="w-4 h-4" /></Link>
                        <button onClick={() => handleEditStudent(student)} className="p-2.5 rounded-xl bg-gray-50 text-gray-400"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => openAssignmentModal(student)} className="p-2.5 rounded-xl bg-gray-50 text-gray-900 dark:text-white"><FolderKanban className="w-4 h-4" /></button>
                     </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── MODAL: Add Student ── */}
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

        {/* ── MODAL: Edit Student ── */}
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

        {/* Pack Assignment Panel — side drawer on md+, bottom sheet on mobile */}
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
