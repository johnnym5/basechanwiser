"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from '@/lib/auth/auth-context';
import InterviewEvaluationModal from '@/components/counselor/InterviewEvaluationModal';
import StudentDossierEditor from "@/components/counselor/StudentDossierEditor";
import AppShell from "@/components/layout/app-shell";
import { useSearchParams, useRouter } from "next/navigation";
import SetReminderModal from "@/components/counselor/SetReminderModal";
import StudentProfileView from "@/components/student/StudentProfileView";
import {
  ArrowLeft,
  Mail,
  Building,
  Calendar,
  Award,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldCheck,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Timer,
  Zap,
  BookOpen,
  Target,
  Loader2,
  CalendarPlus,
  X,
  History as HistoryIcon,
  Edit3,
  Save,
  Video,
  VideoOff,
  ClipboardList,
  FileQuestion,
  AlertTriangle,
  Clock,
  CheckCircle,
  MessageSquare,
  Unlock,
  User,
  Activity
} from "lucide-react";
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc, serverTimestamp, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserProfile, InterviewPack, LearningModule } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "@/components/common/EmptyState";
import { withTimeout } from "@/lib/utils/promise-timeout";
import { format, formatDistanceToNow } from "date-fns";

/**
 * StudentPortfolioPage: Deep-dive view of a single scholar.
 * Feature: Auto-Status Upgrade Engine & Sleek Empty States.
 * Pattern: Progressive Disclosure UX.
 */
// ── Status Badge Renderers ──

const getActivityVisuals = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'quiz':
    case 'academy_module': return { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/50' };
    case 'mock':
    case 'mock_interview': return { icon: Video, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/50' };
    case 'message': return { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/50' };
    case 'unlock': return { icon: Unlock, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/50' };
    case 'profile': return { icon: User, color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/50' };
    default: return { icon: Clock, color: 'text-indigo-400', bg: 'bg-indigo-500/20', border: 'border-indigo-500/50' };
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

function PortfolioContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();

  const [student, setStudent] = useState<UserProfile | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [mockAttempts, setMockAttempts] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [interviewPack, setInterviewPack] = useState<InterviewPack | null>(null);
  const [allModules, setAllModules] = useState<LearningModule[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();
  const [evalOpen, setEvalOpen] = useState(false);
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

  // ── DEFAULT TAB: Student Details ──
  const [activeTab, setActiveTab] = useState<'dossier' | 'mock' | 'quiz' | 'engagement'>('dossier');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<InterviewPack>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const canEdit = userProfile?.role === 'Admin' || userProfile?.role === 'Super Admin' || userProfile?.role === 'Head of Compliance' || student?.assignedCounselorId === user?.uid;
  const [reminderModalOpen, setReminderModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function fetchPortfolio() {
      setLoading(true);
      try {
        const studentSnap = await withTimeout(getDoc(doc(db, "Users", id!)), 10000);
        if (isMounted && studentSnap.exists()) {
          const loadedStudent = { uid: studentSnap.id, ...studentSnap.data() } as UserProfile;
          setStudent(loadedStudent);
        }

        const attemptsQ = query(collection(db, "quiz_attempts"), where("userId", "==", id), orderBy("createdAt", "desc"));
        const attemptsSnap = await withTimeout(getDocs(attemptsQ), 10000);
        if (isMounted) {
          setAttempts(attemptsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }

        // ── RESILIENT MOCK FETCH ──
        const fetchFromCollection = async (collName: string, fieldName: string) => {
          try {
            const q = query(collection(db, collName), where(fieldName, "==", id));
            const snap = await withTimeout(getDocs(q), 10000);
            return snap.docs.map(d => ({ id: d.id, ...d.data(), sourceCollection: collName }));
          } catch (e) {
            console.warn(`Fetch from ${collName} via ${fieldName} failed:`, e);
            return [];
          }
        };

        const [attemptsA, attemptsB, attemptsC] = await Promise.all([
          fetchFromCollection("mock_interview_attempts", "studentId"),
          fetchFromCollection("mock_interview_attempts", "userId"),
          fetchFromCollection("ai_mock_sessions", "userId")
        ]);

        if (isMounted) {
          // Merge and deduplicate by document ID
          const seenIds = new Set();
          const mocks: any[] = [];
          [...attemptsA, ...attemptsB, ...attemptsC].forEach(m => {
            if (!seenIds.has(m.id)) {
              mocks.push(m);
              seenIds.add(m.id);
            }
          });

          // Client-side sort by submission time
          mocks.sort((a, b) => {
            const timeA = a.submittedAt?.seconds || a.createdAt?.seconds || 0;
            const timeB = b.submittedAt?.seconds || b.createdAt?.seconds || 0;
            return timeB - timeA;
          });

          setMockAttempts(mocks);
        }

        // ── SYNC WITH STUDENT PORTFOLIO (NEW) ──
        const guideSnap = await withTimeout(getDoc(doc(db, "Users", id!, "portfolio", "study_guide")), 10000);
        const packSnap = await withTimeout(getDoc(doc(db, "Interview_Packs", id!)), 10000);

        if (isMounted) {
          let combinedPack: Partial<InterviewPack> = {};
          if (packSnap.exists()) combinedPack = { ...packSnap.data() };
          if (guideSnap.exists()) combinedPack = { ...combinedPack, ...guideSnap.data() };

          if (Object.keys(combinedPack).length > 0) {
            setInterviewPack(combinedPack as InterviewPack);
            setFormData(combinedPack);
          }
        }

        // ── FETCH ACTIVITY LOGS ──
        const logsQ = query(
          collection(db, "activity_logs"),
          where("studentId", "==", id),
          orderBy("createdAt", "desc"),
          limit(20)
        );
        const logsSnap = await withTimeout(getDocs(logsQ), 10000);
        if (isMounted) {
          setActivityLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }

        const modulesSnap = await withTimeout(getDocs(collection(db, "learning_modules")), 10000);
        if (isMounted) {
          setAllModules(modulesSnap.docs.map(d => ({ id: d.id, ...d.data() } as LearningModule)));
        }

      } catch (err) {
        console.error("Portfolio fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchPortfolio();

    return () => {
      isMounted = false;
    };
  }, [id]);

  /**
   * handleSaveChanges: Core logic for the Auto-Status Upgrade Engine.
   * Promotes students through GRAY -> AMBER -> GREEN based on detail completion.
   */
  const handleSaveChanges = async () => {
    if (!id || !canEdit) return;
    setIsSaving(true);
    try {
      // ── AUTO-STATUS UPGRADE CALCULATION ──
      const mandatoryFields = [
        'casNumber', 'tuitionAmount', 'depositPaid', 'universityRanking',
        'sponsorName', 'sponsorIncome', 'accommodationDetails', 'timeline',
        'careerPlans', 'reasonsForUniversity'
      ];

      const filledCount = mandatoryFields.filter(field => {
        const val = (formData as any)[field];
        return val !== undefined && val !== null && val !== "" && val !== 0;
      }).length;

      const completionPercentage = (filledCount / mandatoryFields.length) * 100;

      let calculatedStatus: 'Gray' | 'Yellow' | 'Green' = 'Gray';

      if (completionPercentage <= 30) {
        calculatedStatus = 'Gray';
      } else if (completionPercentage < 100 || !formData.docsVerified) {
        calculatedStatus = 'Yellow'; // Representing AMBER in UI logic
      } else if (completionPercentage === 100 && formData.docsVerified) {
        calculatedStatus = 'Green';
      }

      await updateDoc(doc(db, "Interview_Packs", id), {
        ...formData,
        updatedAt: serverTimestamp()
      });

      await updateDoc(doc(db, "Users", id), {
        readinessStatus: calculatedStatus,
        updatedAt: serverTimestamp()
      });

      setStudent(prev => prev ? { ...prev, readinessStatus: calculatedStatus } : null);
      setInterviewPack({ ...interviewPack, ...formData } as InterviewPack);
      setIsEditing(false);
      setToast({ message: `Data Synced. Readiness: ${calculatedStatus.toUpperCase()}`, type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: "Sync Failure", type: 'error' });
      setFormData(interviewPack || {});
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (loading) return <div className="flex flex-col items-center justify-center p-20 gap-4"><Loader2 className="animate-spin text-blue-500" size={40} /><p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Establishing Uplink...</p></div>;
  if (!student) return <div className="p-20 text-center"><p className="text-gray-500 font-bold">Scholar not found.</p></div>;

  const avgScore = attempts.length > 0 ? Math.round(attempts.reduce((acc, a) => acc + (a.score || a.scorePercentage || 0), 0) / attempts.length) : 0;
  const statusColor = student.readinessStatus === "Green" ? "text-emerald-500" : student.readinessStatus === "Yellow" ? "text-amber-500" : student.readinessStatus === 'Orange' ? 'text-orange-600' : "text-rose-500";

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 relative">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className={`fixed top-24 right-10 z-[300] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 font-bold text-xs uppercase tracking-widest ${toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Identity Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-[28px] bg-white dark:bg-[#1E293B] shadow-xl border border-gray-100 dark:border-slate-800 flex items-center justify-center text-3xl font-black text-[#1a73e8]">{(student.displayName || "S").charAt(0)}</div>
            <div className="space-y-1">
               <button onClick={() => router.push("/counselor/students")} className="text-[10px] font-black uppercase text-blue-500 flex items-center gap-1 hover:underline mb-1"><ArrowLeft className="w-3 h-3" /> Back to Student Directory</button>
               <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{student.displayName}</h1>
               <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span className="text-blue-500 font-black">{student.studentId || "ID-PENDING"}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {student.email}</span>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-4">
            {renderOverallStatus(student.readinessStatus || "Gray")}
            {canEdit && (
               <button onClick={() => isEditing ? handleSaveChanges() : setIsEditing(true)} disabled={isSaving} className={`py-3 px-6 rounded-2xl font-black text-sm flex items-center gap-2 transition-all ${isEditing ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-white dark:bg-[#1E293B] text-gray-700 dark:text-white border border-gray-200 dark:border-slate-700'}`}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  {isEditing ? 'Sync Data' : 'Edit Student Details'}
               </button>
            )}
         </div>
      </div>

      {/* Dashboard KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         {[
            { label: 'Avg Accuracy', val: `${avgScore}%`, icon: Award, c: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
            { label: 'Quiz Missions', val: attempts.length, icon: Target, c: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
            { label: 'ACTIVITY HISTORY', val: `${student.learningProgress || 0}%`, icon: TrendingUp, c: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10' },
            { label: 'Pack Status', val: interviewPack?.status || 'Not Started', icon: FileText, c: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' },
         ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-[#1E293B] p-6 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm space-y-2 group transition-all hover:shadow-md">
               <div className={`w-10 h-10 rounded-2xl ${stat.bg} ${stat.c} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}><stat.icon className="w-5 h-5" /></div>
               <p className="text-2xl font-black dark:text-white leading-none">{stat.val}</p>
               <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{stat.label}</p>
            </div>
         ))}
      </div>

      {/* Main Tab Interface */}
      <div className="bg-white dark:bg-[#1E293B] rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
         <div className="flex border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-[#0F172A]/50 overflow-x-auto scrollbar-hide">
            <Tab label="Student Details" icon={ShieldCheck} active={activeTab === 'dossier'} onClick={() => setActiveTab('dossier')} />
            <Tab label="Mock Interviews" icon={Video} active={activeTab === 'mock'} onClick={() => setActiveTab('mock')} />
            <Tab label="Quiz Audit Trail" icon={HistoryIcon} active={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')} />
            <Tab label="Timeline" icon={Activity} active={activeTab === 'engagement'} onClick={() => setActiveTab('engagement')} />
         </div>

         <div className="p-8 md:p-12">
            {activeTab === 'dossier' && (
               <div className="space-y-8">
                  {isEditing ? (
                     <StudentDossierEditor formData={formData} onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))} />
                  ) : (
                     <div className="space-y-10 animate-in fade-in duration-300">
                        {!interviewPack ? (
                           <EmptyState
                              icon={FileQuestion}
                              title="Student Details Pending"
                              description="Click 'Edit Student Details' to begin tracking compliance and academic data."
                              actionText="Initialize Details"
                              onAction={() => setIsEditing(true)}
                           />
                        ) : (
                           <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                 <div className="space-y-6">
                                    <p className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em]">Academic & Admission</p>
                                    <div className="space-y-4">
                                       <ViewField label="University" value={interviewPack.universityName} />
                                       <ViewField label="Course" value={interviewPack.courseName} />
                                       <ViewField label="Start Date" value={interviewPack.courseStartDate} />
                                       <ViewField label="CAS Number" value={interviewPack.casNumber} />
                                       <ViewField label="Tuition Fee" value={interviewPack.tuitionFee || `£${interviewPack.tuitionAmount?.toLocaleString()}`} />
                                       <ViewField label="Deposit Paid" value={`£${interviewPack.depositPaid?.toLocaleString()}`} />
                                       <ViewField label="Ranking" value={interviewPack.universityRanking} />
                                    </div>
                                 </div>
                                 <div className="space-y-6">
                                    <p className="text-[10px] font-black uppercase text-purple-500 tracking-[0.2em]">Financials & Logistics</p>
                                    <div className="space-y-4">
                                       <ViewField label="Sponsor" value={interviewPack.sponsorName} />
                                       <ViewField label="Relationship" value={interviewPack.sponsorRelationship} />
                                       <ViewField label="Occupation" value={interviewPack.sponsorOccupation} />
                                       <ViewField label="Monthly Income" value={interviewPack.sponsorMonthlyIncome} />
                                       <ViewField label="Living Costs" value={interviewPack.monthlyLivingCosts} />
                                       <ViewField label="Total Savings" value={interviewPack.totalSavings} />
                                       <ViewField label="Accommodation" value={interviewPack.accommodationDetails} />
                                    </div>
                                 </div>
                              </div>

                              <div className="space-y-8 pt-10 border-t border-gray-50 dark:border-slate-800">
                                 <div className="grid grid-cols-1 gap-8">
                                    <div className="space-y-3">
                                       <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Alternative Universities Considered</p>
                                       <p className="text-sm font-medium leading-relaxed dark:text-slate-300 italic bg-gray-50 dark:bg-[#0F172A] p-6 rounded-[32px] border border-gray-100 dark:border-slate-800">"{interviewPack.alternativeUniversities || "N/A"}"</p>
                                    </div>
                                    <div className="space-y-3">
                                       <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Why This University?</p>
                                       <p className="text-sm font-medium leading-relaxed dark:text-slate-300 italic bg-gray-50 dark:bg-[#0F172A] p-6 rounded-[32px] border border-gray-100 dark:border-slate-800">"{interviewPack.whyThisUniversity || interviewPack.reasonsForUniversity || "N/A"}"</p>
                                    </div>
                                    <div className="space-y-3">
                                       <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Core Modules & Learning Outcomes</p>
                                       <p className="text-sm font-medium leading-relaxed dark:text-slate-300 italic bg-gray-50 dark:bg-[#0F172A] p-6 rounded-[32px] border border-gray-100 dark:border-slate-800">"{interviewPack.coreModules || "N/A"}"</p>
                                    </div>
                                    <div className="space-y-3">
                                       <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Future Career Plans</p>
                                       <p className="text-sm font-medium leading-relaxed dark:text-slate-300 italic bg-gray-50 dark:bg-[#0F172A] p-6 rounded-[32px] border border-gray-100 dark:border-slate-800">"{interviewPack.careerPlans || "N/A"}"</p>
                                    </div>
                                    <div className="space-y-3">
                                       <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Career Justification</p>
                                       <p className="text-sm font-medium leading-relaxed dark:text-slate-300 italic bg-gray-50 dark:bg-[#0F172A] p-6 rounded-[32px] border border-gray-100 dark:border-slate-800">"{interviewPack.careerJustification || "N/A"}"</p>
                                    </div>
                                    <div className="space-y-3">
                                       <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Intent to Return & Ties</p>
                                       <p className="text-sm font-medium leading-relaxed dark:text-slate-300 italic bg-gray-50 dark:bg-[#0F172A] p-6 rounded-[32px] border border-gray-100 dark:border-slate-800">"{interviewPack.intentToReturn || "N/A"}"</p>
                                    </div>
                                 </div>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                    <div className="flex items-center gap-3 p-5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-3xl">
                                       <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg"><CheckCircle2 className="w-5 h-5" /></div>
                                       <span className="text-[11px] font-black uppercase text-blue-700 dark:text-blue-400 tracking-widest">{interviewPack.docsVerified ? 'Documents Verified' : 'Docs Awaiting Audit'}</span>
                                    </div>
                                 </div>
                              </div>
                           </>
                        )}
                     </div>
                  )}
               </div>
            )}

            {activeTab === 'mock' && id && (
               <div className="animate-in fade-in duration-500">
                  <StudentProfileView
                    studentId={id}
                    hideHeader
                  />
               </div>
            )}

            {activeTab === 'quiz' && (
               <div className="space-y-6 animate-in fade-in duration-300">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Full Quiz Audit Trail</h3>
                  {attempts.length === 0 ? (
                    <EmptyState
                       icon={ClipboardList}
                       title="No Missions Completed"
                       description="Student has not taken any curriculum quizzes or compliance drills yet."
                    />
                  ) : (
                    <div className="space-y-4">
                        {attempts.map((a) => {
                           const isExpanded = expandedAttemptId === a.id;
                           const isPass = (a.scorePercentage || a.score || 0) >= 80;
                           return (
                              <div key={a.id} className="bg-white dark:bg-[#1E293B] rounded-3xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm">
                                 <div onClick={() => setExpandedAttemptId(isExpanded ? null : a.id)} className="p-6 cursor-pointer flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-[#0F172A]/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isPass ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                          {isPass ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                       </div>
                                       <div>
                                          <h4 className="text-sm font-black dark:text-white uppercase tracking-tighter">{a.packTitle || 'Learning Test'}</h4>
                                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                             <Calendar className="w-3.5 h-3.5" /> {a.submittedAt?.seconds ? new Date(a.submittedAt.seconds * 1000).toLocaleDateString() : 'Recent Session'}
                                          </p>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                       <div className="text-right">
                                          <p className={`text-xl font-black ${isPass ? 'text-emerald-500' : 'text-rose-500'}`}>{a.scorePercentage || a.score}%</p>
                                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Accuracy</p>
                                       </div>
                                       {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-300" /> : <ChevronDown className="w-5 h-5 text-gray-300" />}
                                    </div>
                                 </div>

                                 <AnimatePresence>
                                    {isExpanded && (
                                       <motion.div
                                         initial={{ height: 0, opacity: 0 }}
                                         animate={{ height: "auto", opacity: 1 }}
                                         exit={{ height: 0, opacity: 0 }}
                                         className="border-t border-gray-50 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-900/30 p-8 space-y-6"
                                       >
                                          <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100 dark:border-slate-800 pb-3">Question Breakdown</h4>

                                          <div className="space-y-4">
                                            {(a.historyDetails || a.details || []).map((q: any, qIdx: number) => (
                                              <div key={qIdx} className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
                                                <p className="text-sm font-black dark:text-white leading-tight">
                                                  <span className="text-blue-500 mr-2">Q{qIdx + 1}.</span> {q.questionText}
                                                </p>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] font-bold">
                                                  <div className="space-y-1">
                                                     <p className="text-[9px] uppercase text-gray-400 tracking-widest">Their Answer</p>
                                                     <p className={`p-3 rounded-xl border ${q.isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800 text-rose-600'}`}>
                                                        {q.selectedOption || "Timeout"}
                                                     </p>
                                                  </div>
                                                  {!q.isCorrect && (
                                                     <div className="space-y-1">
                                                        <p className="text-[9px] uppercase text-gray-400 tracking-widest">Correct Solution</p>
                                                        <p className="p-3 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
                                                           {q.correctOption}
                                                        </p>
                                                     </div>
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                       </motion.div>
                                    )}
                                 </AnimatePresence>
                              </div>
                           );
                        })}
                    </div>
                  )}
               </div>
            )}

            {activeTab === 'engagement' && (
               <div className="space-y-8 animate-in fade-in duration-300">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white flex items-center gap-2">
                     <HistoryIcon className="text-blue-500" size={18} /> Student Operational Timeline
                  </h3>

                  {activityLogs && activityLogs.length > 0 ? (
                     <div className="relative border-l-2 border-slate-800 ml-4 space-y-8 pb-4">
                        {activityLogs.map((activity, idx) => {
                           const visual = getActivityVisuals(activity.type);
                           const Icon = visual.icon;

                           return (
                              <div key={activity.id || idx} className="relative pl-8">
                                 {/* Timeline Node */}
                                 <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 ${visual.bg} ${visual.border}`}>
                                    <Icon className={`w-4 h-4 ${visual.color}`} />
                                 </div>

                                 {/* Content */}
                                 <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 hover:bg-slate-800/50 transition-all group">
                                    <div className="flex justify-between items-start mb-1">
                                       <h4 className="font-bold text-slate-200 text-sm uppercase tracking-tight">{activity.action || activity.title}</h4>
                                       <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                                          {activity.createdAt?.seconds
                                             ? format(activity.createdAt.toDate(), 'MMM dd, HH:mm')
                                             : 'Just now'}
                                       </span>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                       {activity.description || activity.message || `Automated log for ${activity.type?.replace('_', ' ')} event.`}
                                    </p>
                                    <p className="text-[10px] text-slate-600 font-black uppercase mt-3 tracking-widest group-hover:text-blue-500 transition-colors">
                                       Authenticated: {activity.studentName || student.displayName}
                                    </p>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  ) : (
                     <div className="text-center py-20 bg-slate-800/10 rounded-[40px] border border-dashed border-slate-800">
                        <HistoryIcon size={48} className="mx-auto text-slate-700 mb-4 opacity-20" />
                        <p className="text-slate-500 text-xs font-black uppercase tracking-widest">No timeline events recorded yet.</p>
                     </div>
                  )}
               </div>
            )}
         </div>
      </div>

      {evalOpen && student && (
         <InterviewEvaluationModal studentId={student.uid} studentName={student.displayName || student.uid} open={evalOpen} onClose={() => setEvalOpen(false)} counselorId={user?.uid || ''} counselorName={userProfile?.displayName || user?.displayName || 'Counselor'} />
      )}

      {reminderModalOpen && student && (
        <SetReminderModal student={{ uid: student.uid, studentId: student.studentId, displayName: student.displayName }} onClose={() => setReminderModalOpen(false)} onSuccess={() => alert("Reminder set.")} />
      )}
    </div>
  );
}

function Tab({ label, icon: Icon, active, onClick }: { label: string; icon: any; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 px-8 py-6 text-[10px] font-black uppercase tracking-widest transition-all relative ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white'}`}>
       <Icon size={18} />
       <span className="whitespace-nowrap">{label}</span>
       {active && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full shadow-[0_-4px_10px_rgba(37,99,235,0.5)]" />}
    </button>
  );
}

function ViewField({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between items-center text-xs border-b border-gray-50 dark:border-slate-800 pb-3">
       <span className="text-gray-400 font-bold uppercase tracking-widest">{label}</span>
       <span className="font-black dark:text-white text-right ml-4">{value || "N/A"}</span>
    </div>
  );
}

export default function StudentPortfolioPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" /></div>}>
        <PortfolioContent />
      </Suspense>
    </AppShell>
  );
}
