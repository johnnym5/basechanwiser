"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import StudentHistoryModal from "@/components/StudentHistoryModal";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Search,
  FileText,
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
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { TrafficLightStatus, EvaluationDecision, InterviewPack, JuniorEvaluation, QuestionPack } from "@/types";

interface StudentTableRow {
  uid: string;
  name: string;
  email: string;
  location: string;
  learningProgress: number;
  status: TrafficLightStatus;
  pack?: InterviewPack;
}

export default function CounselorTrafficLightDashboardPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role !== "Counselor" && role !== "Admin") {
      router.push("/dashboard");
    }
  }, [role, loading, router]);

  const [filter, setFilter] = useState<"All" | TrafficLightStatus>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentTableRow | null>(null);

  const [decision, setDecision] = useState<EvaluationDecision>("Pass");
  const [evalTrafficLight, setEvalTrafficLight] = useState<TrafficLightStatus>("Green");
  const [evalNotes, setEvalNotes] = useState("");
  const [isSavingEval, setIsSavingEval] = useState(false);
  const [evalSuccessToast, setEvalSuccessToast] = useState<string | null>(null);

  const [students, setStudents] = useState<StudentTableRow[]>([]);
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

  const fetchRealData = async () => {
    try {
      const usersSnap = await getDocs(collection(db, "Users"));
      const packsSnap = await getDocs(collection(db, "Interview_Packs"));

      const packMap: Record<string, InterviewPack> = {};
      if (!packsSnap.empty) {
        packsSnap.docs.forEach((d) => {
          packMap[d.id] = d.data() as InterviewPack;
        });
      }

      if (!usersSnap.empty) {
        const fetchedRows: StudentTableRow[] = usersSnap.docs
          .filter((d) => d.data().role === "Student" || !d.data().role)
          .map((d) => {
            const uData = d.data();
            const pack = packMap[d.id];
            let status: TrafficLightStatus = uData.readinessStatus || "Red";
            if (!uData.readinessStatus && pack) {
              status = "Yellow";
            }
            return {
              uid: d.id,
              name: uData.displayName || "Student",
              email: uData.email || "N/A",
              location: uData.office || uData.officeLocation || "Head Office",
              learningProgress: uData.learningProgress ?? (pack ? 100 : 0),
              status,
              pack,
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

    // Fetch Question Packs for bulk assignment modal
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

  const filteredStudents = students.filter((s) => {
    const matchesFilter = filter === "All" || s.status === filter;
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // ── Multi-select Header Controls ──────────────────────────────
  const isAllSelected =
    filteredStudents.length > 0 && filteredStudents.every((s) => selectedUids.includes(s.uid));

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      setSelectedUids([]);
    } else {
      setSelectedUids(filteredStudents.map((s) => s.uid));
    }
  };

  const handleRowSelectToggle = (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedUids.includes(uid)) {
      setSelectedUids(selectedUids.filter((id) => id !== uid));
    } else {
      setSelectedUids([...selectedUids, uid]);
    }
  };

  const showToast = (message: string) => {
    setEvalSuccessToast(message);
    setTimeout(() => setEvalSuccessToast(null), 4000);
  };

  // ── Bulk Status Update ────────────────────────────────────────
  const handleBulkStatusUpdate = async (newStatus: TrafficLightStatus) => {
    if (selectedUids.length === 0) return;
    try {
      const batch = writeBatch(db);
      selectedUids.forEach((uid) => {
        batch.set(doc(db, "Users", uid), { readinessStatus: newStatus }, { merge: true });
      });
      await batch.commit();
      setStudents((prev) =>
        prev.map((s) => (selectedUids.includes(s.uid) ? { ...s, status: newStatus } : s))
      );
      showToast(`Mass updated readiness status to ${newStatus} for ${selectedUids.length} student(s).`);
    } catch (err: any) {
      alert(`Bulk update error: ${err.message}`);
    }
  };

  // ── Bulk Assign Question Pack ──────────────────────────────────
  const handleBulkAssignPack = async () => {
    if (!bulkPackId || selectedUids.length === 0) return;
    try {
      const batch = writeBatch(db);
      for (const uid of selectedUids) {
        const uDoc = doc(db, "Users", uid);
        const uSnap = students.find((s) => s.uid === uid);
        batch.set(
          uDoc,
          {
            assignedPackIds: [...new Set([...(uSnap?.pack ? [uSnap.pack.id] : []), bulkPackId])],
          },
          { merge: true }
        );
      }
      await batch.commit();
      setShowBulkPackModal(false);
      showToast(`Assigned Question Pack to ${selectedUids.length} student(s).`);
    } catch (err: any) {
      alert(`Pack assignment error: ${err.message}`);
    }
  };

  // ── Cascade Delete Accounts ───────────────────────────────────
  const handleCascadeDeleteUsers = async () => {
    if (!showDeleteConfirm) return;
    if (deleteInputText.trim().toUpperCase() !== "DELETE") {
      alert("Please type DELETE to confirm permanent account removal.");
      return;
    }

    try {
      for (const uid of showDeleteConfirm.uids) {
        // 1. Delete user doc
        await deleteDoc(doc(db, "Users", uid));

        // 2. Delete quiz attempts
        const qSnap = await getDocs(query(collection(db, "quiz_attempts"), where("userId", "==", uid)));
        qSnap.forEach(async (d) => await deleteDoc(d.ref));

        // 3. Delete interview packs
        const pSnap = await getDocs(query(collection(db, "interview_packs"), where("userId", "==", uid)));
        pSnap.forEach(async (d) => await deleteDoc(d.ref));

        // 4. Delete evaluations
        const eSnap = await getDocs(query(collection(db, "evaluations"), where("studentId", "==", uid)));
        eSnap.forEach(async (d) => await deleteDoc(d.ref));
      }

      setStudents((prev) => prev.filter((s) => !showDeleteConfirm.uids.includes(s.uid)));
      setSelectedUids((prev) => prev.filter((id) => !showDeleteConfirm.uids.includes(id)));
      setShowDeleteConfirm(null);
      setDeleteInputText("");
      showToast("Student account(s) and all linked compliance records deleted.");
    } catch (err: any) {
      alert(`Cascade delete error: ${err.message}`);
    }
  };

  // ── Cascade Reset User History ────────────────────────────────
  const handleCascadeResetHistory = async () => {
    if (!showResetConfirm) return;
    try {
      for (const uid of showResetConfirm.uids) {
        // 1. Delete quiz attempts
        const qSnap = await getDocs(query(collection(db, "quiz_attempts"), where("userId", "==", uid)));
        qSnap.forEach(async (d) => await deleteDoc(d.ref));

        // 2. Reset user profile fields
        await setDoc(
          doc(db, "Users", uid),
          {
            completedPackIds: [],
            learningProgress: 0,
            readinessStatus: "Red",
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      setStudents((prev) =>
        prev.map((s) =>
          showResetConfirm.uids.includes(s.uid) ? { ...s, learningProgress: 0, status: "Red" } : s
        )
      );
      setShowResetConfirm(null);
      showToast("Quiz history and overall progress reset to 0% for selected student(s).");
    } catch (err: any) {
      alert(`Reset history error: ${err.message}`);
    }
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !user) return;

    setIsSavingEval(true);
    try {
      const evalData: JuniorEvaluation = {
        studentId: selectedStudent.uid,
        counselorId: user.uid,
        decision,
        trafficLight: evalTrafficLight,
        notes: evalNotes,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "Junior_Evaluations", selectedStudent.uid), evalData, { merge: true });

      // Update student readiness status in user profile as well
      await setDoc(
        doc(db, "Users", selectedStudent.uid),
        { readinessStatus: evalTrafficLight },
        { merge: true }
      );

      setStudents((prev) =>
        prev.map((s) => (s.uid === selectedStudent.uid ? { ...s, status: evalTrafficLight } : s))
      );

      showToast("Junior Evaluation & Traffic Light Status Saved!");
      setSelectedStudent(null);
      setEvalNotes("");
    } catch (err) {
      console.error("Evaluation save error:", err);
    } finally {
      setIsSavingEval(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Toast */}
        {evalSuccessToast && (
          <div className="fixed bottom-6 right-6 bg-emerald-600 text-white font-bold px-4 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2 border border-emerald-400 animate-fade-up">
            <CheckCircle2 className="w-5 h-5 fill-white text-emerald-600" />
            <span className="text-xs">{evalSuccessToast}</span>
          </div>
        )}

        {/* Title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 font-google">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#1a73e8] dark:text-blue-400" /> Traffic Light Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Review student packs, conduct Junior Interviews, manage bulk actions, and evaluate readiness.
          </p>
        </div>

        {/* Filter Chips + Search */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { label: "All", value: "All", color: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600" },
              { label: "Green (Ready)", value: "Green", color: "bg-[#e6f4ea] dark:bg-emerald-900/30 text-[#1e8e3e] dark:text-emerald-300 border-[#ceead6] dark:border-emerald-800" },
              { label: "Yellow (Needs Work)", value: "Yellow", color: "bg-[#fef7e0] dark:bg-amber-900/30 text-[#b06000] dark:text-amber-300 border-[#feefc3] dark:border-amber-800" },
              { label: "Red (Urgent / Not Ready)", value: "Red", color: "bg-[#fce8e6] dark:bg-red-900/30 text-[#d93025] dark:text-red-300 border-[#fad2cf] dark:border-red-800" },
            ].map((chip) => {
              const isSelected = filter === chip.value;
              return (
                <button
                  key={chip.value}
                  onClick={() => setFilter(chip.value as any)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${chip.color} ${
                    isSelected ? "ring-2 ring-blue-500 shadow-xs font-extrabold" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by student name..."
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full pl-9 pr-4 py-1.5 text-xs text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* ── STICKY BULK ACTIONS TOOLBAR ─────────────────────────── */}
        {selectedUids.length > 0 && (
          <div className="sticky top-16 z-30 bg-[#1a73e8] text-white p-3.5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-fade-down">
            <div className="flex items-center gap-2 font-bold text-xs">
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                {selectedUids.length}
              </span>
              <span>Student(s) Selected</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <button
                onClick={() => handleBulkStatusUpdate("Green")}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
              >
                ● Mark Ready (Green)
              </button>
              <button
                onClick={() => handleBulkStatusUpdate("Yellow")}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors"
              >
                ● Needs Work (Yellow)
              </button>
              <button
                onClick={() => handleBulkStatusUpdate("Red")}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                ● Urgent (Red)
              </button>

              <button
                onClick={() => setShowBulkPackModal(true)}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors flex items-center gap-1"
              >
                <FolderKanban className="w-3.5 h-3.5" /> Assign Pack
              </button>

              <button
                onClick={() =>
                  setShowResetConfirm({
                    uids: selectedUids,
                    names: students.filter((s) => selectedUids.includes(s.uid)).map((s) => s.name),
                  })
                }
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset History
              </button>

              <button
                onClick={() =>
                  setShowDeleteConfirm({
                    uids: selectedUids,
                    names: students.filter((s) => selectedUids.includes(s.uid)).map((s) => s.name),
                  })
                }
                className="px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Selected
              </button>

              <button
                onClick={() => setSelectedUids([])}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white/80"
                title="Clear Selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Click-outside backdrop for action dropdown */}
        {activeMenuUid && (
          <div className="fixed inset-0 z-[90]" onClick={() => setActiveMenuUid(null)} />
        )}

        {/* ── Table: md+ ───────────────────────────────────────── */}
        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xs relative">
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="p-4 w-10 text-center">
                    <button onClick={handleSelectAllToggle} className="text-gray-500 hover:text-blue-600">
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#1a73e8]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Office</th>
                  <th className="p-4">Learning Progress</th>
                  <th className="p-4">Pack</th>
                  <th className="p-4">Readiness</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-medium text-gray-800 dark:text-gray-200">
                {dataLoading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">Loading registered students...</td></tr>
                ) : filteredStudents.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">No students found matching current criteria.</td></tr>
                ) : (
                  filteredStudents.map((s) => {
                    const isSelected = selectedUids.includes(s.uid);

                    return (
                      <tr
                        key={s.uid}
                        onClick={() => { setSelectedStudent(s); setEvalTrafficLight(s.status); }}
                        className={`hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors ${
                          isSelected ? "bg-blue-50/80 dark:bg-blue-950/40" : ""
                        }`}
                      >
                        <td className="p-4 text-center" onClick={(e) => handleRowSelectToggle(s.uid, e)}>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#1a73e8]" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-gray-900 dark:text-white">{s.name}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">{s.email}</p>
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-300">{s.location}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                              <div className="bg-[#1a73e8] h-full rounded-full" style={{ width: `${s.learningProgress}%` }} />
                            </div>
                            <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{s.learningProgress}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
                            {s.pack ? "Submitted" : "Pending"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                            s.status === "Green" ? "bg-[#e6f4ea] dark:bg-emerald-900/30 text-[#1e8e3e] dark:text-emerald-300 border-[#ceead6] dark:border-emerald-800"
                            : s.status === "Yellow" ? "bg-[#fef7e0] dark:bg-amber-900/30 text-[#b06000] dark:text-amber-300 border-[#feefc3] dark:border-amber-800"
                            : "bg-[#fce8e6] dark:bg-red-900/30 text-[#d93025] dark:text-red-300 border-[#fad2cf] dark:border-red-800"
                          }`}>
                            {s.status === "Green" ? "● Green" : s.status === "Yellow" ? "● Yellow" : "● Red (Urgent)"}
                          </span>
                        </td>
                        <td className="p-4 text-right relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setActiveMenuUid(activeMenuUid === s.uid ? null : s.uid)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Row Actions Dropdown */}
                          {activeMenuUid === s.uid && (
                            <div className="absolute right-4 mt-1 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-[100] text-left text-xs font-semibold animate-fade-down" style={{ top: '100%' }}>
                              <button
                                onClick={() => { setHistoryStudent(s); setActiveMenuUid(null); }}
                                className="w-full px-3.5 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-gray-800 dark:text-gray-200 flex items-center gap-2"
                              >
                                <History className="w-4 h-4 text-[#1a73e8]" /> View Past Results & History
                              </button>
                              <button
                                onClick={() => { setSelectedStudent(s); setActiveMenuUid(null); }}
                                className="w-full px-3.5 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-gray-800 dark:text-gray-200 flex items-center gap-2"
                              >
                                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Change Readiness Status
                              </button>
                              <button
                                onClick={() => { setShowResetConfirm({ uids: [s.uid], names: [s.name] }); setActiveMenuUid(null); }}
                                className="w-full px-3.5 py-2 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center gap-2"
                              >
                                <RotateCcw className="w-4 h-4" /> Reset Quiz & Progress History
                              </button>
                              <button
                                onClick={() => { setShowDeleteConfirm({ uids: [s.uid], names: [s.name] }); setActiveMenuUid(null); }}
                                className="w-full px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700 mt-1 pt-2"
                              >
                                <Trash2 className="w-4 h-4" /> Delete Student Account
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Cards: mobile (< md) ─────────────────────────────── */}
        <div className="md:hidden space-y-3">
          {dataLoading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading students...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">No students found.</div>
          ) : (
            filteredStudents.map((s) => {
              const isSelected = selectedUids.includes(s.uid);
              return (
                <div
                  key={s.uid}
                  onClick={() => { setSelectedStudent(s); setEvalTrafficLight(s.status); }}
                  className={`bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-xs cursor-pointer active:scale-[0.99] transition-all space-y-3 ${
                    isSelected ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={(e) => handleRowSelectToggle(s.uid, e)}
                        className="text-gray-400"
                      >
                        {isSelected ? <CheckSquare className="w-5 h-5 text-[#1a73e8]" /> : <Square className="w-5 h-5" />}
                      </button>
                      <div className="w-10 h-10 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-gray-900 dark:text-white truncate">{s.name}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{s.email}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                      s.status === "Green" ? "bg-[#e6f4ea] text-[#1e8e3e] border-[#ceead6]"
                      : s.status === "Yellow" ? "bg-[#fef7e0] text-[#b06000] border-[#feefc3]"
                      : "bg-[#fce8e6] text-[#d93025] border-[#fad2cf]"
                    }`}>● {s.status || "Red"}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={(e) => { e.stopPropagation(); setHistoryStudent(s); }}
                      className="text-xs font-bold text-[#1a73e8] flex items-center gap-1"
                    >
                      <History className="w-3.5 h-3.5" /> History
                    </button>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      Pack: {s.pack ? "✓ Submitted" : "Pending"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Student History Modal Component ────────────────────── */}
        {historyStudent && (
          <StudentHistoryModal
            student={historyStudent}
            onClose={() => setHistoryStudent(null)}
            onRefreshParent={fetchRealData}
          />
        )}

        {/* ── Bulk Question Pack Assignment Modal ────────────────── */}
        {showBulkPackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-base font-google flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-[#1a73e8]" /> Assign Question Pack
                </h3>
                <button onClick={() => setShowBulkPackModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select a Question Pack to assign to <strong className="text-gray-900 dark:text-white">{selectedUids.length}</strong> selected student(s):
              </p>

              <select
                value={bulkPackId}
                onChange={(e) => setBulkPackId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:text-white"
              >
                <option value="">Select Question Pack...</option>
                {availablePacks.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.title} ({pack.category || "General"})
                  </option>
                ))}
              </select>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => setShowBulkPackModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAssignPack}
                  disabled={!bulkPackId}
                  className="px-5 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  Assign to {selectedUids.length} Student(s)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Cascade Delete Confirmation Modal ──────────────────── */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-rose-200 dark:border-rose-900 space-y-4">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-7 h-7 shrink-0" />
                <h3 className="font-extrabold text-lg font-google">Permanent Cascade Delete</h3>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                This action will permanently delete <strong className="text-rose-600 dark:text-rose-400">{showDeleteConfirm.names.length}</strong> student account(s) (<strong>{showDeleteConfirm.names.join(", ")}</strong>) and purge all linked quiz attempt history, interview pack submissions, and evaluation logs.
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Type <span className="text-rose-600 font-extrabold">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteInputText}
                  onChange={(e) => setDeleteInputText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3.5 py-2 text-xs font-mono text-gray-900 dark:text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setShowDeleteConfirm(null); setDeleteInputText(""); }}
                  className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCascadeDeleteUsers}
                  disabled={deleteInputText.trim().toUpperCase() !== "DELETE"}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  Permanently Delete Account(s)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Cascade Reset Confirmation Modal ───────────────────── */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-amber-200 dark:border-amber-800 space-y-4">
              <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                <RotateCcw className="w-6 h-6 shrink-0" />
                <h3 className="font-extrabold text-base font-google">Reset Student Progress & Attempts</h3>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Are you sure you want to reset quiz attempt history and learning progress to <strong className="text-amber-600 dark:text-amber-400">0% (Red)</strong> for <strong className="text-gray-900 dark:text-white">{showResetConfirm.names.join(", ")}</strong>?
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowResetConfirm(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCascadeResetHistory}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Reset History to 0%
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Drawer — side panel md+, bottom sheet on mobile */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex md:justify-end items-end md:items-stretch">
            <div className="w-full md:max-w-2xl bg-white dark:bg-gray-800 md:h-full max-h-[92dvh] md:max-h-none rounded-t-3xl md:rounded-none p-5 md:p-6 overflow-y-auto space-y-5 shadow-2xl animate-slide-up md:animate-none">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white text-lg font-google">{selectedStudent.name}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedStudent.email}</p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Evaluation Form */}
              <form onSubmit={handleSaveEvaluation} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Evaluation Decision</label>
                  <select
                    value={decision}
                    onChange={(e) => setDecision(e.target.value as any)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-gray-900 dark:text-white font-semibold"
                  >
                    <option value="Pass">Pass Interview</option>
                    <option value="Retry">Needs Retry / Further Prep</option>
                    <option value="Escalate">Escalate to Senior Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Set Readiness Traffic Light</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "Green", label: "Green (Ready)", color: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-300" },
                      { value: "Yellow", label: "Yellow (Needs Work)", color: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300" },
                      { value: "Red", label: "Red (Urgent)", color: "bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border-rose-300" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setEvalTrafficLight(opt.value as any)}
                        className={`p-2.5 rounded-xl font-bold border text-center transition-all ${opt.color} ${
                          evalTrafficLight === opt.value ? "ring-2 ring-blue-500 shadow-xs scale-105" : "opacity-70"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Counselor Notes & Evaluation Rubric</label>
                  <textarea
                    rows={4}
                    value={evalNotes}
                    onChange={(e) => setEvalNotes(e.target.value)}
                    placeholder="Enter notes on financial credibility, course knowledge depth, and interview readiness..."
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingEval}
                  className="w-full py-3 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold rounded-2xl shadow-md transition-all disabled:opacity-50"
                >
                  {isSavingEval ? "Saving Evaluation..." : "Save & Update Readiness Status"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
