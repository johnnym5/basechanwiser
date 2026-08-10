"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from '@/lib/auth/auth-context';
import InterviewEvaluationModal from '@/components/counselor/InterviewEvaluationModal';
import StudentDossierEditor from "@/components/counselor/StudentDossierEditor";
import AppShell from "@/components/layout/app-shell";
import { useSearchParams, useRouter } from "next/navigation";
import SetReminderModal from "@/components/counselor/SetReminderModal";
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
  AlertTriangle
} from "lucide-react";
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserProfile, InterviewPack, LearningModule } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "@/components/common/EmptyState";

/**
 * StudentPortfolioPage: Deep-dive view of a single scholar.
 * Feature: Auto-Status Upgrade Engine & Sleek Empty States.
 * Pattern: Progressive Disclosure UX.
 */
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

function PortfolioContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();

  const [student, setStudent] = useState<UserProfile | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [mockAttempts, setMockAttempts] = useState<any[]>([]);
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
    async function fetchPortfolio() {
      if (!id) return;
      try {
        const studentSnap = await getDoc(doc(db, "Users", id));
        if (studentSnap.exists()) {
          const loadedStudent = { uid: studentSnap.id, ...studentSnap.data() } as UserProfile;
          setStudent(loadedStudent);
        }

        const attemptsQ = query(collection(db, "quiz_attempts"), where("userId", "==", id), orderBy("createdAt", "desc"));
        const attemptsSnap = await getDocs(attemptsQ);
        setAttempts(attemptsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const mockQ = query(collection(db, "mock_interview_attempts"), where("studentId", "==", id), orderBy("submittedAt", "desc"));
        const mockSnap = await getDocs(mockQ);
        setMockAttempts(mockSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const packSnap = await getDoc(doc(db, "Interview_Packs", id));
        if (packSnap.exists()) {
          const packData = packSnap.data() as InterviewPack;
          setInterviewPack(packData);
          setFormData(packData);
        }

        const modulesSnap = await getDocs(collection(db, "learning_modules"));
        setAllModules(modulesSnap.docs.map(d => ({ id: d.id, ...d.data() } as LearningModule)));

      } catch (err) {
        console.error("Portfolio fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPortfolio();
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
               <button onClick={() => router.push("/counselor/students")} className="text-[10px] font-black uppercase text-blue-500 flex items-center gap-1 hover:underline mb-1"><ArrowLeft className="w-3 h-3" /> Back to Cohort</button>
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
            { label: 'Academy Depth', val: `${student.learningProgress || 0}%`, icon: TrendingUp, c: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10' },
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
            <Tab label="Curriculum Tracking" icon={BookOpen} active={activeTab === 'engagement'} onClick={() => setActiveTab('engagement')} />
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
                                       <ViewField label="CAS Number" value={interviewPack.casNumber} />
                                       <ViewField label="Tuition Fee" value={`£${interviewPack.tuitionAmount?.toLocaleString()}`} />
                                       <ViewField label="Deposit Paid" value={`£${interviewPack.depositPaid?.toLocaleString()}`} />
                                       <ViewField label="University Ranking" value={interviewPack.universityRanking} />
                                    </div>
                                 </div>
                                 <div className="space-y-6">
                                    <p className="text-[10px] font-black uppercase text-purple-500 tracking-[0.2em]">Financials & Logistics</p>
                                    <div className="space-y-4">
                                       <ViewField label="Sponsor Name" value={interviewPack.sponsorName} />
                                       <ViewField label="Sponsor Income" value={`£${interviewPack.sponsorIncome?.toLocaleString()}`} />
                                       <ViewField label="Accommodation" value={interviewPack.accommodationDetails} />
                                       <ViewField label="Target Date" value={interviewPack.timeline} />
                                    </div>
                                 </div>
                              </div>

                              <div className="space-y-8 pt-10 border-t border-gray-50 dark:border-slate-800">
                                 <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Future Career Plans</p>
                                    <p className="text-sm font-medium leading-relaxed dark:text-slate-300 italic bg-gray-50 dark:bg-[#0F172A] p-6 rounded-[32px] border border-gray-100 dark:border-slate-800">"{interviewPack.careerPlans || "No plans provided."}"</p>
                                 </div>
                                 <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Reason for University Choice</p>
                                    <p className="text-sm font-medium leading-relaxed dark:text-slate-300 italic bg-gray-50 dark:bg-[#0F172A] p-6 rounded-[32px] border border-gray-100 dark:border-slate-800">"{interviewPack.reasonsForUniversity || interviewPack.whyUniversity || "No reasons provided."}"</p>
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

            {activeTab === 'mock' && (
               <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Mock Interview Logs</h3>
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Session Vault</span>
                  </div>
                  {mockAttempts.length === 0 ? (
                    <EmptyState
                        icon={VideoOff}
                        title="No Mock Interviews Logged"
                        description="Student has not completed any video interviews yet. You can conduct a live session now."
                        actionText="Conduct Live Session"
                        onAction={() => setEvalOpen(true)}
                    />
                  ) : (
                    <div className="space-y-4">
                        {mockAttempts.map(ma => (
                           <div key={ma.id} className="p-6 rounded-3xl bg-gray-50 dark:bg-[#0F172A] border border-gray-100 dark:border-slate-800 flex items-center justify-between group hover:border-blue-500/50 transition-all">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-blue-500 shadow-sm"><Video size={24} /></div>
                                 <div>
                                    <p className="text-sm font-black dark:text-white uppercase tracking-tighter">Recorded Session Archive</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Submitted {ma.submittedAt?.toDate ? ma.submittedAt.toDate().toLocaleDateString() : 'Recently'}</p>
                                 </div>
                              </div>
                              <button onClick={() => router.push(`/counselor/mock-interviews/${ma.id}`)} className="px-6 py-2 rounded-xl bg-white dark:bg-slate-800 text-xs font-black uppercase border border-gray-200 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:text-white">Playback</button>
                           </div>
                        ))}
                    </div>
                  )}
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
                              </div>
                           );
                        })}
                    </div>
                  )}
               </div>
            )}

            {activeTab === 'engagement' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in duration-300">
                  <div className="space-y-8">
                     <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Curriculum Assignments</h3>
                     <div className="space-y-4">
                        {allModules.filter(m => (student.assignedPackIds || []).includes(m.id)).length === 0 ? (
                           <div className="p-10 bg-gray-50 dark:bg-[#0F172A] rounded-[32px] border border-dashed border-gray-200 dark:border-slate-800 text-center">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No active modules assigned.</p>
                           </div>
                        ) : allModules.filter(m => (student.assignedPackIds || []).includes(m.id)).map(m => {
                           const score = student.moduleScores?.[m.id];
                           const isPassed = score !== undefined && score >= 80;
                           return (
                              <div key={m.id} className="flex items-center justify-between p-6 bg-white dark:bg-[#1E293B] rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                                 <div className="flex items-center gap-4 overflow-hidden">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isPassed ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-500 shadow-inner'}`}>
                                       <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div className="truncate">
                                       <p className="text-xs font-black dark:text-white uppercase tracking-tighter truncate">{m.title}</p>
                                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Track Priority #{m.order || 'N/A'}</p>
                                    </div>
                                 </div>
                                 {score !== undefined && <span className={`text-xs font-black ${isPassed ? 'text-emerald-500' : 'text-blue-500'}`}>{score}%</span>}
                              </div>
                           );
                        })}
                     </div>
                  </div>

                  <div className="space-y-8">
                     <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Gamification Index</h3>
                     <div className="bg-gradient-to-br from-[#1a73e8] to-indigo-700 rounded-[40px] p-10 text-white shadow-2xl space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 text-white/5"><Zap size={150} /></div>
                        <div className="flex items-center gap-4 relative z-10">
                           <div className="w-14 h-14 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl"><Zap className="w-8 h-8 fill-current" /></div>
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Status Rank</p>
                              <p className="text-3xl font-black tracking-tighter italic">Active Candidate</p>
                           </div>
                        </div>
                        <div className="space-y-5 relative z-10">
                           <div className="flex justify-between items-end">
                              <span className="text-[10px] font-black uppercase text-blue-100 tracking-widest">Consistency Streak</span>
                              <span className="text-2xl font-black">{student.dayStreak || 0} Days</span>
                           </div>
                           <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden shadow-inner">
                              <motion.div className="h-full bg-white rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (student.dayStreak || 0) * 10)}%` }} transition={{ duration: 1.5, ease: "easeOut" }} />
                           </div>
                        </div>
                     </div>
                  </div>
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
