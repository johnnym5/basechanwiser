"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Search,
  FileText,
  X,
  CheckCircle2,
} from "lucide-react";
import { collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { TrafficLightStatus, EvaluationDecision, InterviewPack, JuniorEvaluation } from "@/types";

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
  const [evalSuccessToast, setEvalSuccessToast] = useState(false);

  const [students, setStudents] = useState<StudentTableRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function fetchRealData() {
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
                location: uData.office || "Head Office",
                learningProgress: pack ? 100 : 0,
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
    }
    fetchRealData();
  }, []);

  const filteredStudents = students.filter((s) => {
    const matchesFilter = filter === "All" || s.status === filter;
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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

      setEvalSuccessToast(true);
      setTimeout(() => setEvalSuccessToast(false), 3000);
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
          <div className="fixed bottom-6 right-6 bg-emerald-600 text-white font-bold px-4 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2 border border-emerald-400">
            <CheckCircle2 className="w-5 h-5 fill-white text-emerald-600" />
            <span className="text-xs">Junior Evaluation & Traffic Light Status Saved!</span>
          </div>
        )}

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 font-google">
            <ShieldCheck className="w-6 h-6 text-[#1a73e8] dark:text-blue-400" /> Counselor Traffic Light Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Review student preparation packs, conduct Junior Interviews, and set Traffic Light readiness statuses.
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

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Office Location</th>
                  <th className="p-4">Learning Progress</th>
                  <th className="p-4">Pack Status</th>
                  <th className="p-4">Readiness Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-medium text-gray-800 dark:text-gray-200">
                {dataLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                      Loading registered students...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No students found matching current criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr
                      key={s.uid}
                      onClick={() => {
                        setSelectedStudent(s);
                        setEvalTrafficLight(s.status);
                      }}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                    >
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
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                            s.status === "Green"
                              ? "bg-[#e6f4ea] dark:bg-emerald-900/30 text-[#1e8e3e] dark:text-emerald-300 border-[#ceead6] dark:border-emerald-800"
                              : s.status === "Yellow"
                              ? "bg-[#fef7e0] dark:bg-amber-900/30 text-[#b06000] dark:text-amber-300 border-[#feefc3] dark:border-amber-800"
                              : "bg-[#fce8e6] dark:bg-red-900/30 text-[#d93025] dark:text-red-300 border-[#fad2cf] dark:border-red-800"
                          }`}
                        >
                          {s.status === "Green" ? "● Green (Ready)" : s.status === "Yellow" ? "● Yellow (Needs Work)" : "● Red (Urgent)"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Drawer */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-800 h-full p-6 overflow-y-auto space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white text-lg font-google">{selectedStudent.name}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedStudent.email} • {selectedStudent.location}</p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Pack Details */}
              <div className="space-y-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl border border-gray-200 dark:border-gray-600">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#1a73e8] dark:text-blue-400" /> Interview Pack Data
                </h3>

                {selectedStudent.pack ? (
                  <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300">
                    <div className="grid grid-cols-2 gap-2">
                      <p><strong className="text-gray-900 dark:text-white">Passport:</strong> {selectedStudent.pack.passportNo}</p>
                      <p><strong className="text-gray-900 dark:text-white">CAS Ref:</strong> {selectedStudent.pack.casNumber}</p>
                      <p><strong className="text-gray-900 dark:text-white">Tuition Amount:</strong> £{selectedStudent.pack.tuitionAmount}</p>
                      <p><strong className="text-gray-900 dark:text-white">Deposit Paid:</strong> £{selectedStudent.pack.depositPaid}</p>
                    </div>

                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <p className="font-semibold text-gray-900 dark:text-white">Career Goals & University Justification:</p>
                      <p className="italic text-gray-600 dark:text-gray-400 mt-0.5">{selectedStudent.pack.whyUniversity}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">Interview pack not yet submitted by student.</p>
                )}
              </div>

              {/* Evaluation Form */}
              <form onSubmit={handleSaveEvaluation} className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white font-google">Junior Interview Evaluation</h3>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-2">Evaluation Outcome</label>
                  <div className="flex items-center gap-4">
                    {[
                      { label: "Pass (Proceed)", value: "Pass", color: "text-emerald-600 dark:text-emerald-400" },
                      { label: "Retry (Needs Work)", value: "Retry", color: "text-amber-600 dark:text-amber-400" },
                      { label: "Escalate (High Risk)", value: "Escalate", color: "text-rose-600 dark:text-rose-400" },
                    ].map((dec) => (
                      <label key={dec.value} className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="decision"
                          value={dec.value}
                          checked={decision === dec.value}
                          onChange={(e) => setDecision(e.target.value as EvaluationDecision)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className={dec.color}>{dec.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-2">Traffic Light Status</label>
                  <div className="flex items-center gap-3">
                    {[
                      { label: "Green (Ready)", value: "Green", bg: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200" },
                      { label: "Yellow (Warning)", value: "Yellow", bg: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200" },
                      { label: "Red (Urgent)", value: "Red", bg: "bg-rose-100 dark:bg-red-900/40 text-rose-800 dark:text-red-200" },
                    ].map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setEvalTrafficLight(t.value as TrafficLightStatus)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border border-transparent transition-all ${t.bg} ${
                          evalTrafficLight === t.value ? "ring-2 ring-blue-600 font-extrabold" : "opacity-70"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">Interview Assessment Notes</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Enter notes on student communication, financial documentation status..."
                    value={evalNotes}
                    onChange={(e) => setEvalNotes(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl p-3 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:border-[#1a73e8]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingEval}
                    className="w-full py-3 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                  >
                    Save Evaluation & Update Traffic Light
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
