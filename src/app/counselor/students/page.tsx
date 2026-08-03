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
} from "lucide-react";
import { collection, onSnapshot, doc, setDoc, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserProfile, QuestionPack } from "@/types";

export default function CounselorStudentsPage() {
  const { role, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && role !== "Counselor" && role !== "Admin") {
      router.push("/dashboard");
    }
  }, [role, authLoading, router]);

  const [students, setStudents] = useState<UserProfile[]>([]);
  const [availablePacks, setAvailablePacks] = useState<QuestionPack[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Assignment Modal State
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);

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
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#1a73e8] dark:text-blue-400" /> Student Directory
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Manage student accounts and assign compliance Question Packs in real time.
            </p>
          </div>
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
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Office</th>
                  <th className="p-4">Assigned Packs</th>
                  <th className="p-4">Readiness</th>
                  <th className="p-4 text-right">Actions</th>
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
                      <tr key={student.uid} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-gray-900 dark:text-white">{student.displayName || "Student User"}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">{student.email}</p>
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-300">{student.office || "London HQ"}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <FolderKanban className="w-3.5 h-3.5" /> {assignedCount} Packs
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                            student.readinessStatus === "Green" ? "bg-[#e6f4ea] dark:bg-emerald-900/30 text-[#1e8e3e] dark:text-emerald-300 border-[#ceead6] dark:border-emerald-800"
                            : student.readinessStatus === "Yellow" ? "bg-[#fef7e0] dark:bg-amber-900/30 text-[#b06000] dark:text-amber-300 border-[#feefc3] dark:border-amber-800"
                            : "bg-[#fce8e6] dark:bg-red-900/30 text-[#d93025] dark:text-red-300 border-[#fad2cf] dark:border-red-800"
                          }`}>● {student.readinessStatus || "Red"}</span>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => openAssignmentModal(student)}
                            className="px-3.5 py-2 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold transition-all shadow-xs active:scale-95">
                            Assign Packs
                          </button>
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
                <div key={student.uid} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {(student.displayName || "S").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-gray-900 dark:text-white truncate">{student.displayName || "Student User"}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{student.email}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                      status === "Green" ? "bg-[#e6f4ea] text-[#1e8e3e] border-[#ceead6]"
                      : status === "Yellow" ? "bg-[#fef7e0] text-[#b06000] border-[#feefc3]"
                      : "bg-[#fce8e6] text-[#d93025] border-[#fad2cf]"
                    }`}>● {status || "Red"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">{student.office || "London HQ"} · <span className="text-[#1a73e8] font-bold">{assignedCount} packs</span></span>
                    <button onClick={() => openAssignmentModal(student)}
                      className="px-3.5 py-2 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold active:scale-95 touch-target">
                      Assign Packs
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

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
