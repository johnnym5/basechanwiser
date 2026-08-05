"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Building,
  Calendar,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ShieldCheck,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Timer,
  Zap,
  BookOpen,
  ExternalLink,
  Target,
  GraduationCap
} from "lucide-react";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserProfile, InterviewPack, LearningModule } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export default function StudentPortfolioPage() {
  const { id } = useParams();
  const router = useRouter();

  const [student, setStudent] = useState<UserProfile | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [interviewPack, setInterviewPack] = useState<InterviewPack | null>(null);
  const [allModules, setAllModules] = useState<LearningModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPortfolio() {
      if (!id) return;
      try {
        // 1. Fetch Student Profile
        const studentSnap = await getDoc(doc(db, "Users", id as string));
        if (studentSnap.exists()) {
          setStudent({ uid: studentSnap.id, ...studentSnap.data() } as UserProfile);
        }

        // 2. Fetch Quiz Attempts
        const attemptsQ = query(
          collection(db, "quiz_attempts"),
          where("userId", "==", id),
          orderBy("createdAt", "desc")
        );
        const attemptsSnap = await getDocs(attemptsQ);
        setAttempts(attemptsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 3. Fetch Interview Pack
        const packSnap = await getDoc(doc(db, "Interview_Packs", id as string));
        if (packSnap.exists()) {
          setInterviewPack(packSnap.data() as InterviewPack);
        }

        // 4. Fetch All Modules for assigned list
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

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Gathering Dossier...</p>
        </div>
      </AppShell>
    );
  }

  if (!student) {
    return (
      <AppShell>
        <div className="p-20 text-center">
          <p className="text-gray-500 font-bold">Student not found in database.</p>
          <button onClick={() => router.back()} className="mt-4 text-blue-500 font-black uppercase text-xs hover:underline flex items-center gap-2 mx-auto">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </AppShell>
    );
  }

  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((acc, a) => acc + (a.score || a.scorePercentage || 0), 0) / attempts.length)
    : 0;

  const statusColor = student.readinessStatus === "Green" ? "text-emerald-500" : student.readinessStatus === "Yellow" ? "text-amber-500" : "text-rose-500";

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-[28px] bg-white dark:bg-[#1E293B] shadow-xl border border-gray-100 dark:border-slate-800 flex items-center justify-center text-3xl font-black text-[#1a73e8]">
                 {(student.displayName || "S").charAt(0)}
              </div>
              <div className="space-y-1">
                 <button onClick={() => router.push("/counselor/students")} className="text-[10px] font-black uppercase text-blue-500 flex items-center gap-1 hover:underline mb-1">
                    <ArrowLeft className="w-3 h-3" /> Back to Directory
                 </button>
                 <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{student.displayName}</h1>
                 <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span className="text-blue-500 font-black">{student.studentId || "ID-PENDING"}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {student.email}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {student.office || "London HQ"}</span>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="px-6 py-3 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
                 <div className={`w-3 h-3 rounded-full bg-current ${statusColor} animate-pulse`} />
                 <span className={`text-xs font-black uppercase tracking-widest ${statusColor}`}>
                    {student.readinessStatus || "Red"} Status
                 </span>
              </div>
           </div>
        </div>

        {/* ── KPI GRID ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
           {[
              { label: 'Avg Accuracy', val: `${avgScore}%`, icon: Award, c: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
              { label: 'Quiz Missions', val: attempts.length, icon: Target, c: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
              { label: 'Progress', val: `${student.learningProgress}%`, icon: TrendingUp, c: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10' },
              { label: 'Pack Status', val: interviewPack?.status || 'Not Started', icon: FileText, c: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' },
           ].map((stat, i) => (
              <div key={i} className="bg-white dark:bg-[#1E293B] p-6 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                 <div className={`w-10 h-10 rounded-2xl ${stat.bg} ${stat.c} flex items-center justify-center mb-2`}><stat.icon className="w-5 h-5" /></div>
                 <p className="text-2xl font-black dark:text-white leading-none">{stat.val}</p>
                 <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{stat.label}</p>
              </div>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

           {/* ── LEFT COL: INTERVIEW PACK ── */}
           <div className="lg:col-span-2 space-y-8">
              <div className="bg-white dark:bg-[#1E293B] rounded-[40px] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                 <div className="p-8 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-[#0F172A]/50">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4 text-emerald-500" /> Compliance Dossier (Interview Pack)
                    </h3>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase border ${interviewPack?.status === 'Verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-100 text-gray-400'}`}>
                       {interviewPack?.status || "Pending"}
                    </span>
                 </div>

                 <div className="p-10 space-y-10">
                    {!interviewPack ? (
                       <div className="text-center py-10 opacity-40">
                          <FileText className="w-12 h-12 mx-auto mb-3" />
                          <p className="text-xs font-bold uppercase">No data submitted yet.</p>
                       </div>
                    ) : (
                       <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Academic & Admission</p>
                                <div className="space-y-3">
                                   <div className="flex justify-between items-center text-xs"><span className="text-gray-400 font-bold uppercase">CAS Number</span> <span className="font-black dark:text-white">{interviewPack.casNumber || "N/A"}</span></div>
                                   <div className="flex justify-between items-center text-xs"><span className="text-gray-400 font-bold uppercase">Tuition Fee</span> <span className="font-black dark:text-white">£{interviewPack.tuitionAmount?.toLocaleString()}</span></div>
                                   <div className="flex justify-between items-center text-xs"><span className="text-gray-400 font-bold uppercase">Deposit Paid</span> <span className="font-black dark:text-white">£{interviewPack.depositPaid?.toLocaleString()}</span></div>
                                   <div className="flex justify-between items-center text-xs"><span className="text-gray-400 font-bold uppercase">University Ranking</span> <span className="font-black dark:text-white">{interviewPack.universityRanking || "N/A"}</span></div>
                                </div>
                             </div>
                             <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase text-purple-500 tracking-widest">Financials & Logistics</p>
                                <div className="space-y-3">
                                   <div className="flex justify-between items-center text-xs"><span className="text-gray-400 font-bold uppercase">Sponsor Name</span> <span className="font-black dark:text-white">{interviewPack.sponsorName || "N/A"}</span></div>
                                   <div className="flex justify-between items-center text-xs"><span className="text-gray-400 font-bold uppercase">Sponsor Income</span> <span className="font-black dark:text-white">£{interviewPack.sponsorIncome?.toLocaleString()}</span></div>
                                   <div className="flex justify-between items-center text-xs"><span className="text-gray-400 font-bold uppercase">Accommodation</span> <span className="font-black dark:text-white truncate max-w-[150px]">{interviewPack.accommodationDetails || "N/A"}</span></div>
                                   <div className="flex justify-between items-center text-xs"><span className="text-gray-400 font-bold uppercase">Target Date</span> <span className="font-black dark:text-white">{interviewPack.timeline || "N/A"}</span></div>
                                </div>
                             </div>
                          </div>

                          <div className="space-y-6 pt-6 border-t border-gray-50 dark:border-slate-800">
                             <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Future Career Plans</p>
                                <p className="text-xs font-medium leading-relaxed dark:text-slate-300 italic bg-gray-50 dark:bg-[#0F172A] p-5 rounded-3xl border border-gray-100 dark:border-slate-800">"{interviewPack.careerPlans || "No plans provided."}"</p>
                             </div>
                             <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Reason for University Choice</p>
                                <p className="text-xs font-medium leading-relaxed dark:text-slate-300 italic bg-gray-50 dark:bg-[#0F172A] p-5 rounded-3xl border border-gray-100 dark:border-slate-800">"{interviewPack.reasonsForUniversity || interviewPack.whyUniversity || "No reasons provided."}"</p>
                             </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                <div className="flex items-center gap-3 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                                   <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></div>
                                   <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">Statement of Purpose Verified</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                                   <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></div>
                                   <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-400">Financial Docs Confirmed</span>
                                </div>
                             </div>
                          </div>
                       </>
                    )}
                 </div>
              </div>

              {/* ── ACTIVITY HISTORY ── */}
              <div className="space-y-4">
                 <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-500" /> Quiz Audit Trail
                 </h3>
                 <div className="space-y-3">
                    {attempts.length === 0 ? (
                       <div className="p-12 text-center bg-white dark:bg-[#1E293B] rounded-[32px] border border-dashed border-gray-200">
                          <p className="text-xs font-bold text-gray-400 uppercase">No mission history logged.</p>
                       </div>
                    ) : (
                       attempts.map((a) => {
                          const isExpanded = expandedAttemptId === a.id;
                          const isPass = (a.score || a.scorePercentage || 0) >= 80;
                          return (
                             <div key={a.id} className="bg-white dark:bg-[#1E293B] rounded-[32px] border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all">
                                <div onClick={() => setExpandedAttemptId(isExpanded ? null : a.id)} className="p-6 cursor-pointer flex items-center justify-between gap-4">
                                   <div className="flex items-center gap-4">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPass ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                         {isPass ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                      </div>
                                      <div>
                                         <h4 className="text-sm font-black dark:text-white uppercase tracking-tighter">{a.packTitle}</h4>
                                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Calendar className="w-3 h-3" /> {a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}
                                            <span>•</span>
                                            <Timer className="w-3 h-3" /> {a.totalTimeSpentSeconds || 'N/A'}s
                                         </p>
                                      </div>
                                   </div>
                                   <div className="flex items-center gap-6">
                                      <div className="text-right">
                                         <p className={`text-sm font-black ${isPass ? 'text-emerald-500' : 'text-rose-500'}`}>{a.score || a.scorePercentage}%</p>
                                         <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Accuracy</p>
                                      </div>
                                      {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-300" /> : <ChevronDown className="w-5 h-5 text-gray-300" />}
                                   </div>
                                </div>

                                <AnimatePresence>
                                   {isExpanded && (
                                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t border-gray-50 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-900/30 p-8 space-y-6">
                                         <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100 dark:border-slate-800 pb-3">Question Level Audit</p>
                                         <div className="space-y-4">
                                            {(a.details || a.historyDetails || []).map((log: any, idx: number) => (
                                               <div key={idx} className={`p-5 rounded-3xl border-2 space-y-3 ${log.isCorrect ? 'bg-emerald-50/50 border-emerald-100/50' : 'bg-rose-50/50 border-rose-100/50'}`}>
                                                  <div className="flex items-start justify-between gap-4">
                                                     <p className="text-xs font-black dark:text-white"><span className="text-gray-400 mr-2">{idx + 1}.</span> {log.questionText}</p>
                                                     <span className="text-[9px] font-black text-gray-400 uppercase whitespace-nowrap bg-white px-2 py-1 rounded-lg border border-inherit">{log.timeTakenSeconds}s</span>
                                                  </div>
                                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                     <div className="space-y-1">
                                                        <p className="text-[8px] font-black text-gray-400 uppercase">Answered</p>
                                                        <p className={`text-[11px] font-bold ${log.isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>{log.selectedOption}</p>
                                                     </div>
                                                     {!log.isCorrect && (
                                                        <div className="space-y-1">
                                                           <p className="text-[8px] font-black text-gray-400 uppercase">Correct</p>
                                                           <p className="text-[11px] font-bold text-gray-900 dark:text-white">{log.correctOption}</p>
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
                       })
                    )}
                 </div>
              </div>
           </div>

           {/* ── RIGHT COL: SIDEBAR ── */}
           <div className="space-y-8">

              {/* Assigned Curriculum */}
              <div className="bg-white dark:bg-[#1E293B] rounded-[40px] p-8 border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
                 <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#1a73e8]" /> Curriculum Assigned
                 </h3>
                 <div className="space-y-3">
                    {allModules.filter(m => (student.assignedPackIds || []).includes(m.id)).length === 0 ? (
                       <p className="text-[10px] font-bold text-gray-400 text-center py-4">No specific packs assigned.</p>
                    ) : allModules.filter(m => (student.assignedPackIds || []).includes(m.id)).map(m => {
                       const score = student.moduleScores?.[m.id];
                       const isPassed = score !== undefined && score >= (m.passScore || 80);
                       return (
                          <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0F172A] rounded-2xl border border-gray-100 dark:border-slate-800">
                             <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isPassed ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
                                   <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <div className="truncate">
                                   <p className="text-[11px] font-black dark:text-white truncate">{m.title}</p>
                                   <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Order #{m.order}</p>
                                </div>
                             </div>
                             {score !== undefined && <span className={`text-[10px] font-black ${isPassed ? 'text-emerald-500' : 'text-blue-500'}`}>{score}%</span>}
                          </div>
                       );
                    })}
                 </div>
              </div>

              {/* Engagement Insight */}
              <div className="bg-gradient-to-br from-[#1a73e8] to-indigo-700 rounded-[40px] p-8 text-white shadow-xl space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center"><Zap className="w-5 h-5 fill-current" /></div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">Engagement Score</p>
                       <p className="text-xl font-black tracking-tight">Active Scholar</p>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-end">
                       <span className="text-[10px] font-black uppercase text-blue-100">Daily Streak</span>
                       <span className="text-lg font-black">{student.dayStreak || 0} Days</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${(student.dayStreak || 0) * 10}%` }} />
                    </div>
                    <p className="text-[10px] font-bold text-blue-50 leading-relaxed">Student has taken {attempts.length} quizzes in total with an average speed of 6.2s per question.</p>
                 </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-[#1E293B] rounded-[40px] p-8 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
                 <button onClick={() => window.print()} className="w-full py-4 bg-gray-50 dark:bg-[#0F172A] hover:bg-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white rounded-2xl transition-all border border-gray-100 dark:border-slate-800">Export Student Audit</button>
                 <button className="w-full py-4 bg-gray-50 dark:bg-[#0F172A] hover:bg-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white rounded-2xl transition-all border border-gray-100 dark:border-slate-800">Email Readiness Summary</button>
              </div>

           </div>
        </div>

      </div>
    </AppShell>
  );
}
