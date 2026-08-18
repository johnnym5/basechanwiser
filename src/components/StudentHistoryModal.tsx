"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Award,
  HelpCircle,
  Clock,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import TestReviewDashboard from "./academy/TestReviewDashboard";
import { AskedQuestion, TestAttempt } from "@/types/academy";
import { TrafficLightStatus } from "@/types";
import EmptyState from "@/components/common/EmptyState";

import { withTimeout } from "@/lib/utils/promise-timeout";

interface StudentHistoryModalProps {
  student: {
    uid: string;
    name: string;
    email: string;
    location: string;
    learningProgress: number;
    status: TrafficLightStatus;
  } | null;
  onClose: () => void;
  onRefreshParent?: () => void;
}

// ── Status Badge Renderers ──

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

export default function StudentHistoryModal({ student, onClose, onRefreshParent }: StudentHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<"quizzes" | "pack" | "evaluations">("quizzes");
  const [loading, setLoading] = useState(true);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [interviewPack, setInterviewPack] = useState<any | null>(null);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<TestAttempt | null>(null);
  const [actionProcessing, setActionProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!student) return;
    let isMounted = true;

    async function fetchHistory() {
      if (!student) return;
      setLoading(true);
      try {
        const studentId = student.uid;
        // 1. Fetch Quiz Attempts with 10s timeout
        const quizQ = query(
          collection(db, "quiz_attempts"),
          where("userId", "==", studentId),
          orderBy("createdAt", "desc")
        );
        const quizSnap = await withTimeout(getDocs(quizQ), 10000);

        if (isMounted) {
          const quizList: any[] = [];
          quizSnap.forEach((d) => quizList.push({ id: d.id, ...d.data() }));
          setQuizAttempts(quizList);
        }

        // 2. Fetch Interview Pack with 10s timeout
        const packQ = query(collection(db, "interview_packs"), where("userId", "==", studentId));
        const packSnap = await withTimeout(getDocs(packQ), 10000);

        if (isMounted) {
          if (!packSnap.empty) {
            setInterviewPack({ id: packSnap.docs[0].id, ...packSnap.docs[0].data() });
          } else {
            setInterviewPack(null);
          }
        }

        // 3. Fetch Evaluations with 10s timeout
        const evalQ = query(collection(db, "evaluations"), where("studentId", "==", studentId));
        const evalSnap = await withTimeout(getDocs(evalQ), 10000);

        if (isMounted) {
          const evalList: any[] = [];
          evalSnap.forEach((d) => evalList.push({ id: d.id, ...d.data() }));
          setEvaluations(evalList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
        }

      } catch (err) {
        console.error("Error fetching student history:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [student]);

  if (!student) return null;

  // Purge single quiz attempt
  const handlePurgeQuizAttempt = async (attemptId: string) => {
    if (!confirm("Are you sure you want to reset and purge this specific quiz attempt?")) return;
    setActionProcessing(attemptId);
    try {
      await deleteDoc(doc(db, "quiz_attempts", attemptId));
      setQuizAttempts((prev) => prev.filter((q) => q.id !== attemptId));
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      alert(`Failed to delete attempt: ${err.message}`);
    } finally {
      setActionProcessing(null);
    }
  };

  // Print Compliance Record
  const handlePrintRecord = () => {
    window.print();
  };

  if (selectedAttempt) {
    return (
      <div className="fixed inset-0 z-[60] bg-white dark:bg-gray-900 overflow-y-auto">
        <div className="p-6">
          <TestReviewDashboard
            attempt={selectedAttempt}
            onBack={() => setSelectedAttempt(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90dvh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-[#1a73e8] p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-lg shrink-0">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-lg sm:text-xl font-google truncate">{student.name}</h2>
                {renderOverallStatus(student.status)}
              </div>
              <p className="text-xs text-blue-100 truncate">{student.email} • Office: {student.location}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintRecord}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Export / Print Compliance Record"
            >
              <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Export Record</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 px-6 shrink-0 gap-4">
          <button
            onClick={() => setActiveTab("quizzes")}
            className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "quizzes"
                ? "border-[#1a73e8] text-[#1a73e8] dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            <HelpCircle className="w-4 h-4" /> Quiz Attempt History ({quizAttempts.length})
          </button>
          <button
            onClick={() => setActiveTab("pack")}
            className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "pack"
                ? "border-[#1a73e8] text-[#1a73e8] dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            <FileText className="w-4 h-4" /> Interview Pack Snapshot
          </button>
          <button
            onClick={() => setActiveTab("evaluations")}
            className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "evaluations"
                ? "border-[#1a73e8] text-[#1a73e8] dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Compliance Audit Logs ({evaluations.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-gray-500 dark:text-gray-400">Loading student history logs...</div>
          ) : activeTab === "quizzes" ? (
            quizAttempts.length === 0 ? (
              <EmptyState
                icon={Award}
                title="No Missions Logged"
                description="This student hasn't completed any learning module quizzes yet."
              />
            ) : (
              <div className="space-y-3">
                {quizAttempts.map((attempt) => {
                  const isExpanded = expandedQuizId === attempt.id;
                  const isPass = attempt.score >= (attempt.passScore || 80);

                  return (
                    <div
                      key={attempt.id}
                      className="bg-white dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-xs text-gray-900 dark:text-white">
                            {attempt.packTitle || attempt.packId || "Compliance Quiz Drill"}
                          </h4>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {attempt.createdAt?.seconds
                              ? new Date(attempt.createdAt.seconds * 1000).toLocaleDateString()
                              : "Recent Attempt"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${
                              isPass
                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                : "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                            }`}
                          >
                            Score: {attempt.score}% ({isPass ? "Passed" : "Failed"})
                          </span>

                          <button
                            onClick={() => setSelectedAttempt(attempt as TestAttempt)}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                            title="Review Graded Attempt"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handlePurgeQuizAttempt(attempt.id)}
                            disabled={actionProcessing === attempt.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Reset & Purge this Attempt"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setExpandedQuizId(isExpanded ? null : attempt.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Detailed Breakdown */}
                      {isExpanded && attempt.answers && (
                        <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                          <h5 className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Question Breakdown
                          </h5>
                          <div className="space-y-2">
                            {Object.entries(attempt.answers).map(([qId, ans]: [string, any], idx) => (
                              <div key={qId} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl text-xs space-y-1">
                                <p className="font-bold text-gray-800 dark:text-gray-200">
                                  {idx + 1}. {ans.questionText || `Question #${idx + 1}`}
                                </p>
                                <p className="text-[11px] text-gray-600 dark:text-gray-400">
                                  Selected Answer: <span className="font-semibold text-gray-900 dark:text-white">{ans.selectedOptionText || ans.selectedOptionId}</span>
                                </p>
                                {ans.explanation && (
                                  <p className="text-[10px] text-blue-600 dark:text-blue-400 italic">
                                    Explanation: {ans.explanation}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : activeTab === "pack" ? (
            !interviewPack ? (
              <EmptyState
                icon={FileText}
                title="Dossier Not Started"
                description="The student has not yet filled out or submitted their digital interview pack."
              />
            ) : (
              <div className="bg-white dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white font-google">
                    UKVI Credibility Submission Details
                  </h3>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-[#1a73e8] dark:text-blue-300">
                    Status: {interviewPack.status || "Submitted"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div><span className="text-gray-500">Passport Number:</span> <strong className="text-gray-900 dark:text-white">{interviewPack.passportNo || "N/A"}</strong></div>
                  <div><span className="text-gray-500">CAS Number:</span> <strong className="text-gray-900 dark:text-white">{interviewPack.casNumber || "N/A"}</strong></div>
                  <div><span className="text-gray-500">Tuition Fee Amount:</span> <strong className="text-gray-900 dark:text-white">£{interviewPack.tuitionAmount || 0}</strong></div>
                  <div><span className="text-gray-500">Deposit Paid:</span> <strong className="text-gray-900 dark:text-white">£{interviewPack.depositPaid || 0}</strong></div>
                  <div><span className="text-gray-500">Sponsor Name:</span> <strong className="text-gray-900 dark:text-white">{interviewPack.sponsorName || "N/A"}</strong></div>
                  <div><span className="text-gray-500">Sponsor Income:</span> <strong className="text-gray-900 dark:text-white">£{interviewPack.sponsorIncome || 0}</strong></div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs">
                  <div>
                    <span className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Reason for Study Gap:</span>
                    <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-800 dark:text-gray-200">{interviewPack.studyGapReason || "None provided."}</p>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Career & Future Plans:</span>
                    <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-800 dark:text-gray-200">{interviewPack.careerPlans || "None provided."}</p>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Why This University / Course:</span>
                    <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-800 dark:text-gray-200">{interviewPack.whyUniversity || "None provided."}</p>
                  </div>
                </div>
              </div>
            )
          ) : (
            evaluations.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="No Audit Logs"
                description="No official counselor evaluations or readiness notes have been recorded for this scholar."
              />
            ) : (
              <div className="space-y-3">
                {evaluations.map((ev) => (
                  <div key={ev.id} className="bg-white dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 dark:text-white">
                        Evaluated Status: <span className="text-[#1a73e8]">{ev.trafficLight}</span>
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {ev.createdAt?.seconds ? new Date(ev.createdAt.seconds * 1000).toLocaleString() : "Audit Log"}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">{ev.notes || "No notes entered."}</p>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
}
