"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { UserProfile } from "@/types";
import { MockInterviewAttempt } from "@/types/mock";
import {
  User,
  Mail,
  Building,
  ShieldCheck,
  Edit3,
  Save,
  X,
  Loader2,
  CheckCircle2,
  Clock,
  FileText,
  History,
  MessageSquare,
  ArrowLeft,
  Trash2,
  LayoutGrid,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import InterviewPackReview from "@/components/interview-pack/InterviewPackReview";
import MockInterviewPlayback from "@/components/mock-interview/MockInterviewPlayback";

type TabType = 'overview' | 'pack' | 'mock' | 'history';

export default function StudentDeepDivePage() {
  const { id } = useParams();
  const router = useRouter();
  const { effectiveRole } = useAuth();

  const [student, setStudent] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const isAdmin = effectiveRole === 'Admin' || effectiveRole === 'Super Admin';

  useEffect(() => {
    if (id) {
      const fetchStudent = async () => {
        const snap = await getDoc(doc(db, "Users", id as string));
        if (snap.exists()) {
          setStudent({ uid: snap.id, ...snap.data() } as UserProfile);
        }
        setLoading(false);
      };
      fetchStudent();
    }
  }, [id]);

  const handleEdit = (field: string, current: string) => {
    if (field === 'office' && !isAdmin) return;
    setEditingField(field);
    setEditValue(current);
  };

  const saveField = async () => {
    if (!editingField || !student) return;
    try {
      await updateDoc(doc(db, "Users", student.uid), {
        [editingField]: editValue
      });
      setStudent({ ...student, [editingField]: editValue });
      setEditingField(null);
    } catch (e) {
      alert("Update failed");
    }
  };

  if (loading) return <AppShell><div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" /></div></AppShell>;
  if (!student) return <AppShell><div className="p-20 text-center">Student not found</div></AppShell>;

  const statusColor = student.readinessStatus === "Green" ? "bg-emerald-500" : student.readinessStatus === "Yellow" ? "bg-amber-500" : "bg-rose-500";

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-8 pb-32">
        <button onClick={() => router.back()} className="text-[10px] font-black uppercase text-gray-400 hover:text-blue-500 flex items-center gap-2 mb-4">
           <ArrowLeft size={14} /> Back to Directory
        </button>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-[32px] bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-3xl font-black text-blue-600 shadow-inner">
                 {student.displayName?.charAt(0)}
              </div>
              <div className="space-y-2">
                 <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-black dark:text-white uppercase tracking-tighter">{student.displayName}</h1>
                    <div className={`w-3 h-3 rounded-full ${statusColor} animate-pulse`} />
                 </div>
                 <div className="flex flex-wrap gap-2">
                    <Pill icon={User} label={student.studentId || 'ID-PENDING'} />
                    <Pill icon={Mail} label={student.email || ''} />
                    <Pill icon={Building} label={student.office || 'Unassigned'} canEdit={isAdmin} onEdit={() => handleEdit('office', student.office || '')} />
                 </div>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <button className="px-6 py-3 bg-blue-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20">Send Notification</button>
           </div>
        </div>

        <AnimatePresence>
          {editingField && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-2xl w-full max-w-md border border-gray-100 dark:border-slate-700 space-y-6">
                  <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Edit {editingField}</h3>
                  <input value={editValue} onChange={e => setEditValue(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-900 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500" />
                  <div className="flex gap-3">
                     <button onClick={() => setEditingField(null)} className="flex-1 py-4 text-xs font-black uppercase text-gray-500">Cancel</button>
                     <button onClick={saveField} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Save Change</button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
           <div className="flex border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 overflow-x-auto scrollbar-hide">
              <Tab label="Overview" icon={LayoutGrid} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
              <Tab label="Student Pack" icon={FileText} active={activeTab === 'pack'} onClick={() => setActiveTab('pack')} />
              <Tab label="Mock Interview" icon={MessageSquare} active={activeTab === 'mock'} onClick={() => setActiveTab('mock')} />
              <Tab label="History" icon={History} active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
           </div>
           <div className="p-8">
              {activeTab === 'overview' && <OverviewTab student={student} />}
              {activeTab === 'pack' && <InterviewPackReview studentId={student.uid} />}
              {activeTab === 'mock' && <MockTab studentId={student.uid} />}
              {activeTab === 'history' && <HistoryTab studentId={student.uid} />}
           </div>
        </div>
      </div>
    </AppShell>
  );
}

function Pill({ icon: Icon, label, canEdit, onEdit }: { icon: any, label: string, canEdit?: boolean, onEdit?: () => void }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 group">
       <Icon size={14} className="shrink-0" />
       <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
       {canEdit && (
         <button onClick={onEdit} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-blue-500">
           <Edit3 size={12} />
         </button>
       )}
    </div>
  );
}

function Tab({ label, icon: Icon, active, onClick }: { label: string, icon: any, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all relative ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white'}`}>
       <Icon size={16} />
       {label}
       {active && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />}
    </button>
  );
}

function OverviewTab({ student }: { student: UserProfile }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Academy Progress" val={`${student.learningProgress || 0}%`} icon={CheckCircle2} color="text-emerald-500" />
          <StatCard label="Academy Score" val={student.gamifiedScore?.toLocaleString() || '0'} icon={Save} color="text-blue-500" />
          <StatCard label="Current Level" val={`Lvl ${student.currentModuleLevel || 1}`} icon={ShieldCheck} color="text-indigo-500" />
       </div>
       <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
             <Edit3 size={14} /> Counselor Internal Notes
          </h3>
          <textarea rows={6} placeholder="Document student readiness, red flags, or specific feedback here..." className="w-full bg-gray-50 dark:bg-slate-900 border-none rounded-[32px] p-8 text-sm font-medium leading-relaxed dark:text-slate-300 focus:ring-2 focus:ring-blue-500 resize-none" />
       </div>
    </div>
  );
}

function StatCard({ label, val, icon: Icon, color }: { label: string, val: string, icon: any, color: string }) {
  return (
    <div className="bg-gray-50 dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 space-y-2">
       <Icon className={`${color} opacity-40`} size={24} />
       <p className="text-2xl font-black dark:text-white">{val}</p>
       <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{label}</p>
    </div>
  );
}

function MockTab({ studentId }: { studentId: string }) {
  const [attempts, setAttempts] = useState<MockInterviewAttempt[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttempts = async () => {
      const q = query(collection(db, "mock_interview_attempts"), where("studentId", "==", studentId), orderBy("submittedAt", "desc"));
      const snap = await getDocs(q);
      setAttempts(snap.docs.map(d => ({ id: d.id, ...d.data() } as MockInterviewAttempt)));
    };
    fetchAttempts();
  }, [studentId]);

  if (selectedId) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedId(null)} className="text-[10px] font-black uppercase text-blue-500 flex items-center gap-1 hover:underline">
          <ArrowLeft size={14} /> Back to Session List
        </button>
        <MockInterviewPlayback attemptId={selectedId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <h3 className="text-sm font-black dark:text-white uppercase tracking-tighter">Recorded Interview Sessions</h3>
       <div className="grid grid-cols-1 gap-4">
          {attempts.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs font-bold uppercase border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-3xl italic">No recorded sessions found.</div>
          ) : attempts.map(a => (
            <div key={a.id} className="flex items-center justify-between p-6 rounded-3xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-blue-500/50 transition-all group">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-blue-500">
                     <Clock size={20} />
                  </div>
                  <div>
                     <p className="text-sm font-black dark:text-white uppercase tracking-tighter">Session Archive - {a.submittedAt?.toDate().toLocaleDateString()}</p>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{a.status} • {Math.floor(a.timeTakenSeconds / 60)}m duration</p>
                  </div>
               </div>
               <button onClick={() => setSelectedId(a.id!)} className="px-6 py-2 rounded-xl bg-white dark:bg-slate-800 text-xs font-black uppercase border border-gray-200 dark:border-slate-700 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:text-white">Watch Replay</button>
            </div>
          ))}
       </div>
    </div>
  );
}

function HistoryTab({ studentId }: { studentId: string }) {
  return (
    <div className="space-y-8">
       <div className="relative pl-10 space-y-12">
          <div className="absolute left-4 top-2 bottom-0 w-0.5 bg-gray-100 dark:bg-slate-800" />
          {[
            { action: 'Digital Interview Pack Submitted', time: 'Aug 07, 10:45 AM', icon: FileText, color: 'bg-emerald-500' },
            { action: 'Mock Interview Session Completed', time: 'Aug 06, 02:15 PM', icon: MessageSquare, color: 'bg-blue-500' },
            { action: 'Academy Level 4 Conquered', time: 'Aug 05, 11:30 AM', icon: CheckCircle2, color: 'bg-amber-500' },
            { action: 'Counselor Onboarding Notification Sent', time: 'Aug 04, 09:00 AM', icon: Send, color: 'bg-indigo-500' },
          ].map((h, i) => (
            <div key={i} className="relative">
               <div className={`absolute -left-[30px] top-1 w-10 h-10 rounded-2xl ${h.color} flex items-center justify-center text-white shadow-lg`}>
                  <h.icon size={18} />
               </div>
               <div className="space-y-1">
                  <p className="text-sm font-black dark:text-white uppercase tracking-tighter">{h.action}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h.time}</p>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
}
