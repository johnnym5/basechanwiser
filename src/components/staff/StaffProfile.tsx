"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { db } from "@/lib/firebase/config";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from "firebase/firestore";
import { UserProfile, InterviewPack } from "@/types";
import { MockInterviewAttempt } from "@/types/mock";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Edit3,
  Save,
  X,
  Loader2,
  Video,
  FileText,
  Clock,
  CheckCircle2,
  Camera,
  TrendingUp,
  Award,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface StaffProfileProps {
  staffMember: UserProfile;
}

/**
 * StaffProfile: Unified View/Edit interface for platform staff.
 * Integrated with operational KPI engines and history tracking.
 * Adheres to high-density dark-mode aesthetic.
 */
export default function StaffProfile({ staffMember }: StaffProfileProps) {
  const { userProfile: currentUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'mock' | 'pack'>('mock');

  // Operational Data State
  const [mockHistory, setMockHistory] = useState<MockInterviewAttempt[]>([]);
  const [packHistory, setPackHistory] = useState<InterviewPack[]>([]);
  const [stats, setStats] = useState({ mockCount: 0, packCount: 0 });

  // Form State
  const [form, setForm] = useState({
    displayName: staffMember.displayName || "",
    phoneNumber: staffMember.phoneNumber || "",
    bio: staffMember.bio || "",
    photoURL: staffMember.photoURL || ""
  });

  useEffect(() => {
    fetchOperationalData();
  }, [staffMember.uid]);

  /**
   * Data Fetching: Queries operational collections to build staff history.
   * Matches counselorId to the current staff profile.
   */
  const fetchOperationalData = async () => {
    try {
      // 1. Fetch Mock Interview History (Reviews conducted by this staff)
      const mockQ = query(
        collection(db, "mock_interview_attempts"),
        where("counselorId", "==", staffMember.uid),
        orderBy("submittedAt", "desc"),
        limit(15)
      );
      const mockSnap = await getDocs(mockQ);
      setMockHistory(mockSnap.docs.map(d => ({ id: d.id, ...d.data() } as MockInterviewAttempt)));

      // 2. Fetch Interview Pack History (Dossiers reviewed)
      const packQ = query(
        collection(db, "interview_packs"),
        where("counselorId", "==", staffMember.uid),
        orderBy("updatedAt", "desc"),
        limit(15)
      );
      const packSnap = await getDocs(packQ);
      setPackHistory(packSnap.docs.map(d => ({ id: d.id, ...d.data() } as InterviewPack)));

      setStats({
        mockCount: mockSnap.size,
        packCount: packSnap.size
      });
    } catch (e) {
      console.warn("History fetch partial failure (check Firestore indexes):", e);
    }
  };

  /**
   * Save Payload Logic:
   * Updates only personal identity fields. Role and Permissions are guarded.
   */
  const handleSave = async () => {
    setSaving(true);
    try {
      const userRef = doc(db, "Users", staffMember.uid);
      const payload = {
        displayName: form.displayName,
        phoneNumber: form.phoneNumber,
        bio: form.bio,
        photoURL: form.photoURL,
        updatedAt: new Date()
      };

      await updateDoc(userRef, payload);
      setIsEditing(false);
      // Optimistic UI handled by state synchronization
    } catch (e) {
      console.error(e);
      alert("Failed to synchronize profile changes.");
    } finally {
      setSaving(false);
    }
  };

  const roleColor = staffMember.role === "Super Admin" ? "text-amber-500 bg-amber-500/10 border-amber-500/20" :
                    staffMember.role === "Admin" ? "text-purple-500 bg-purple-500/10 border-purple-500/20" :
                    "text-blue-500 bg-blue-500/10 border-blue-500/20";

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500">

      {/* ── TOP BAR: Identity & Toggleable State ── */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-8">
         <div className="flex items-center gap-6 flex-1">
            <div className="relative group">
               <div className="w-24 h-24 rounded-[32px] bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl">
                  {form.photoURL ? (
                    <img src={form.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-slate-400" />
                  )}
               </div>
               {isEditing && (
                  <button className="absolute inset-0 bg-black/40 flex items-center justify-center text-white rounded-[32px] transition-opacity">
                     <Camera size={20} />
                  </button>
               )}
            </div>

            <div className="space-y-2 flex-1">
               <div className="flex items-center gap-3 flex-wrap">
                  {isEditing ? (
                    <input
                      value={form.displayName}
                      onChange={e => setForm({...form, displayName: e.target.value})}
                      className="text-2xl font-black bg-slate-50 dark:bg-slate-900 border-2 border-blue-500/30 rounded-xl px-4 py-1 focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  ) : (
                    <h1 className="text-3xl font-black dark:text-white uppercase tracking-tighter">{form.displayName}</h1>
                  )}
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${roleColor}`}>
                     {staffMember.role}
                  </span>
               </div>
               <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <div className="flex items-center gap-2"><Mail size={14} /> {staffMember.email}</div>
                  <div className="flex items-center gap-2">
                     <Phone size={14} />
                     {isEditing ? (
                       <input
                         value={form.phoneNumber}
                         onChange={e => setForm({...form, phoneNumber: e.target.value})}
                         placeholder="Phone Extension"
                         className="bg-slate-50 dark:bg-slate-900 border-2 border-blue-500/20 rounded-lg px-2 py-0.5 focus:ring-1 focus:ring-blue-500 dark:text-white"
                       />
                     ) : (
                       form.phoneNumber || "No Phone Registered"
                     )}
                  </div>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                 <button onClick={() => setIsEditing(false)} className="px-6 py-3 text-gray-500 font-black text-xs uppercase tracking-widest">Discard</button>
                 <button onClick={handleSave} disabled={saving} className="px-8 py-3 bg-blue-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center gap-2 active:scale-95 transition-all">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
                 </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95">
                 <Edit3 size={16} /> Edit Dossier
              </button>
            )}
         </div>
      </div>

      {/* ── KPI METRICS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <MetricCard label="Mocks Finalized" val={stats.mockCount} icon={Video} color="text-blue-500" />
         <MetricCard label="Dossiers Processed" val={stats.packCount} icon={CheckCircle2} color="text-emerald-500" />
         <MetricCard label="System Integrity" val="Elite" icon={ShieldCheck} color="text-indigo-500" />
      </div>

      {/* Bio / Professional Statement */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 space-y-4">
         <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Award size={14} /> Professional Bio
         </h3>
         {isEditing ? (
           <textarea
             rows={4}
             value={form.bio}
             onChange={e => setForm({...form, bio: e.target.value})}
             className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-3xl p-6 text-sm font-medium leading-relaxed dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
             placeholder="Outline your credentials and operational focus..."
           />
         ) : (
           <p className="text-sm font-medium text-gray-600 dark:text-slate-300 leading-relaxed italic">
             "{form.bio || "No professional statement provided. Update your profile to display your expertise."}"
           </p>
         )}
      </div>

      {/* ── UNIFIED HISTORY TRACKER ── */}
      <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
         <div className="flex border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 overflow-x-auto scrollbar-hide">
            <TabButton
              label="Conduct History (Mocks)"
              icon={Video}
              active={activeTab === 'mock'}
              onClick={() => setActiveTab('mock')}
            />
            <TabButton
              label="Audit History (Packs)"
              icon={FileText}
              active={activeTab === 'pack'}
              onClick={() => setActiveTab('pack')}
            />
         </div>

         <div className="p-4 sm:p-8 min-h-[400px]">
            <AnimatePresence mode="wait">
               {activeTab === 'mock' ? (
                 <motion.div
                   key="mock"
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 10 }}
                   className="space-y-4"
                 >
                    {mockHistory.length === 0 ? (
                      <EmptyState text="No conducted mock interviews found." />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                 <th className="pb-4 px-4">Subject (Student)</th>
                                 <th className="pb-4 px-4">Timestamp</th>
                                 <th className="pb-4 px-4">Protocol Status</th>
                                 <th className="pb-4 px-4 text-right">Verification</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                              {mockHistory.map(m => (
                                <tr key={m.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                   <td className="py-5 px-4 font-bold text-sm dark:text-white flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-black text-[10px]">
                                         {m.studentName?.charAt(0)}
                                      </div>
                                      {m.studentName}
                                   </td>
                                   <td className="py-5 px-4 text-xs text-gray-500 uppercase tabular-nums">
                                      {m.submittedAt?.toDate ? format(m.submittedAt.toDate(), 'MMM dd, HH:mm') : "Recent"}
                                   </td>
                                   <td className="py-5 px-4">
                                      <span className="text-[9px] font-black uppercase px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 border border-blue-100 dark:border-blue-800">
                                         {m.status}
                                      </span>
                                   </td>
                                   <td className="py-5 px-4 text-right">
                                      <button
                                        onClick={() => window.location.href = `/counselor/mock-interviews/playback?attemptId=${m.id}`}
                                        className="px-4 py-2 rounded-xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center gap-2 ml-auto hover:bg-blue-700 transition-all"
                                      >
                                         <Video size={14} /> Review
                                      </button>
                                   </td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                      </div>
                    )}
                 </motion.div>
               ) : (
                 <motion.div
                   key="pack"
                   initial={{ opacity: 0, x: 10 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -10 }}
                   className="space-y-4"
                 >
                    {packHistory.length === 0 ? (
                      <EmptyState text="No dossier reviews found in audit trail." />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                 <th className="pb-4 px-4">Scholar</th>
                                 <th className="pb-4 px-4">Audit Date</th>
                                 <th className="pb-4 px-4">Compliance</th>
                                 <th className="pb-4 px-4 text-right">Dossier Link</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                              {packHistory.map(p => (
                                <tr key={p.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                   <td className="py-5 px-4 font-bold text-sm dark:text-white flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 font-black text-[10px]">
                                         {p.studentName?.charAt(0)}
                                      </div>
                                      {p.studentName}
                                   </td>
                                   <td className="py-5 px-4 text-xs text-gray-500 uppercase tabular-nums">
                                      {p.updatedAt?.toDate ? format(p.updatedAt.toDate(), 'MMM dd, HH:mm') : "Recent"}
                                   </td>
                                   <td className="py-5 px-4">
                                      <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${
                                        p.status === 'Verified' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100'
                                      }`}>
                                         {p.status}
                                      </span>
                                   </td>
                                   <td className="py-5 px-4 text-right">
                                      <button
                                        onClick={() => window.location.href = `/counselor/students/portfolio?id=${p.userId}`}
                                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-400 hover:text-emerald-600 transition-all ml-auto block"
                                      >
                                         <FileText size={18} />
                                      </button>
                                   </td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                      </div>
                    )}
                 </motion.div>
               )}
            </AnimatePresence>
         </div>
      </div>
    </div>
  );
}

function MetricCard({ label, val, icon: Icon, color }: { label: string, val: any, icon: any, color: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between group hover:shadow-md transition-all">
       <div className="space-y-1">
          <p className="text-3xl font-black dark:text-white tracking-tighter">{val}</p>
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{label}</p>
       </div>
       <div className={`w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center ${color} shadow-inner group-hover:scale-110 transition-transform`}>
          <Icon size={24} />
       </div>
    </div>
  );
}

function TabButton({ label, icon: Icon, active, onClick }: { label: string, icon: any, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${active ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600'}`}
    >
       <Icon size={16} />
       <span className="whitespace-nowrap">{label}</span>
       {active && <motion.div layoutId="activeStaffTab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full shadow-[0_-4px_10px_rgba(37,99,235,0.5)]" />}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
       <TrendingUp size={48} className="text-slate-400" />
       <p className="text-xs font-black uppercase tracking-widest">{text}</p>
    </div>
  );
}
