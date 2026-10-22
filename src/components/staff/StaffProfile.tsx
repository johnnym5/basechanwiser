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
  UserCheck,
  Sparkles,
  Activity,
  ArrowUpRight,
  ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface StaffProfileProps {
  staffMember: UserProfile;
}

/**
 * StaffProfile: Executive Identity & Operational Dossier View/Edit
 * Redesigned with AWWWARDS-level glassmorphism aesthetics, responsive bento grid,
 * and high-contrast WCAG 2.1 accessible typography.
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

  const fetchOperationalData = async () => {
    try {
      // 1. Fetch Mock Interview History
      const mockQ = query(
        collection(db, "mock_interview_attempts"),
        where("counselorId", "==", staffMember.uid),
        orderBy("submittedAt", "desc"),
        limit(15)
      );
      const mockSnap = await getDocs(mockQ);
      setMockHistory(mockSnap.docs.map(d => ({ id: d.id, ...d.data() } as MockInterviewAttempt)));

      // 2. Fetch Interview Pack History
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
      console.warn("History fetch partial failure:", e);
    }
  };

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
    } catch (e) {
      console.error(e);
      alert("Failed to synchronize profile changes.");
    } finally {
      setSaving(false);
    }
  };

  const roleBadgeStyle = staffMember.role === "Super Admin"
    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
    : staffMember.role === "Admin"
      ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
      : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30";

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-28 animate-in fade-in duration-700 font-sans">

      {/* ── 1. ATTENTION: Panoramic Glass Identity Banner ── */}
      <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-indigo-900/30 via-slate-900/80 to-slate-950 p-8 sm:p-12 border border-slate-200/20 dark:border-slate-800 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 flex-1">

            {/* Avatar Ring */}
            <div className="relative group shrink-0">
              <div className="w-28 h-28 rounded-3xl bg-slate-950 border-2 border-indigo-500/40 p-1 shadow-2xl flex items-center justify-center overflow-hidden">
                {form.photoURL ? (
                  <img src={form.photoURL} alt={form.displayName} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <User className="w-12 h-12 text-slate-400" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-4 border-slate-950 flex items-center justify-center text-white" title="Active">
                <CheckCircle2 size={12} />
              </div>
            </div>

            {/* User Identity Details */}
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                {isEditing ? (
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    className="text-2xl font-black bg-slate-950 border border-indigo-500/50 rounded-2xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 max-w-sm"
                  />
                ) : (
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter font-google truncate">
                    {form.displayName}
                  </h1>
                )}

                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${roleBadgeStyle}`}>
                  {staffMember.role || "Staff Counselor"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-indigo-500 shrink-0" />
                  <span className="truncate">{staffMember.email}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-indigo-500 shrink-0" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.phoneNumber}
                      onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                      placeholder="Phone extension..."
                      className="bg-slate-950 border border-indigo-500/30 rounded-xl px-3 py-1 text-white text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  ) : (
                    <span>{form.phoneNumber || "No Phone Registered"}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Button Controls */}
          <div className="flex items-center gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3.5 text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest transition-colors rounded-2xl"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-xl flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Edit3 size={16} className="text-indigo-500" /> Edit Dossier
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. INTEREST: High-Density Bento KPI Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricBentoCard
          title="Mocks Finalized"
          val={stats.mockCount}
          subtitle="Evaluations conducted"
          icon={Video}
          accentColor="text-indigo-500"
          bgGlow="bg-indigo-500/10"
        />

        <MetricBentoCard
          title="Dossiers Processed"
          val={stats.packCount}
          subtitle="Audited student packs"
          icon={CheckCircle2}
          accentColor="text-emerald-500"
          bgGlow="bg-emerald-500/10"
        />

        <MetricBentoCard
          title="System Integrity"
          val="Elite"
          subtitle="Compliance Rating 100%"
          icon={ShieldCheck}
          accentColor="text-amber-500"
          bgGlow="bg-amber-500/10"
        />
      </div>

      {/* ── 3. DESIRE: Professional Bio Statement ── */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-8 sm:p-10 rounded-[32px] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
            <Award size={16} className="text-indigo-500" /> Professional Statement & Credentials
          </h3>
          <span className="text-[9px] font-black uppercase text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Verified Dossier
          </span>
        </div>

        {isEditing ? (
          <textarea
            rows={4}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="w-full bg-white dark:bg-slate-950 border border-indigo-500/30 rounded-2xl p-5 text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all resize-none"
            placeholder="Outline your credentials, domain focus, and counselor specialization..."
          />
        ) : (
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic max-w-4xl">
            "{form.bio || "No professional bio uploaded. Click 'Edit Dossier' above to specify your expertise and operational credentials."}"
          </p>
        )}
      </div>

      {/* ── 4. ACTION: Operational Audit Vault ── */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-[32px] border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden">

        {/* Tab Navigation Header */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 overflow-x-auto scrollbar-hide">
          <TabButton
            label="Conduct History (Mocks)"
            icon={Video}
            active={activeTab === 'mock'}
            count={mockHistory.length}
            onClick={() => setActiveTab('mock')}
          />
          <TabButton
            label="Audit History (Packs)"
            icon={FileText}
            active={activeTab === 'pack'}
            count={packHistory.length}
            onClick={() => setActiveTab('pack')}
          />
        </div>

        <div className="p-6 sm:p-8 min-h-[380px]">
          <AnimatePresence mode="wait">
            {activeTab === 'mock' ? (
              <motion.div
                key="mock"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {mockHistory.length === 0 ? (
                  <EmptyState text="No conducted mock interviews in audit trail." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800/80">
                          <th className="pb-4 px-4">Scholar Candidate</th>
                          <th className="pb-4 px-4">Timestamp</th>
                          <th className="pb-4 px-4">Protocol Status</th>
                          <th className="pb-4 px-4 text-right">Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {mockHistory.map((m) => (
                          <tr key={m.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                            <td className="py-4 px-4 font-bold text-sm text-slate-900 dark:text-white flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xs shrink-0">
                                {m.studentName?.charAt(0) || "S"}
                              </div>
                              <span className="truncate">{m.studentName || "Anonymous Candidate"}</span>
                            </td>

                            <td className="py-4 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider tabular-nums">
                              {m.submittedAt?.toDate ? format(m.submittedAt.toDate(), 'MMM dd, HH:mm') : "Recent"}
                            </td>

                            <td className="py-4 px-4">
                              <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                {m.status || "Evaluated"}
                              </span>
                            </td>

                            <td className="py-4 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => window.location.href = `/counselor/mock-interviews/playback?attemptId=${m.id}`}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 flex items-center gap-2 ml-auto transition-all active:scale-95"
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {packHistory.length === 0 ? (
                  <EmptyState text="No dossier reviews found in audit trail." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800/80">
                          <th className="pb-4 px-4">Scholar</th>
                          <th className="pb-4 px-4">Audit Date</th>
                          <th className="pb-4 px-4">Compliance Status</th>
                          <th className="pb-4 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {packHistory.map((p) => (
                          <tr key={p.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                            <td className="py-4 px-4 font-bold text-sm text-slate-900 dark:text-white flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-xs shrink-0">
                                {p.studentName?.charAt(0) || "S"}
                              </div>
                              <span className="truncate">{p.studentName || "Scholar File"}</span>
                            </td>

                            <td className="py-4 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider tabular-nums">
                              {p.updatedAt?.toDate ? format(p.updatedAt.toDate(), 'MMM dd, HH:mm') : "Recent"}
                            </td>

                            <td className="py-4 px-4">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                                p.status === 'Verified'
                                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                              }`}>
                                {p.status || "Under Audit"}
                              </span>
                            </td>

                            <td className="py-4 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => window.location.href = `/counselor/students/portfolio?id=${p.userId}`}
                                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors ml-auto block"
                                title="Open Dossier"
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

function MetricBentoCard({ title, val, subtitle, icon: Icon, accentColor, bgGlow }: { title: string, val: any, subtitle: string, icon: any, accentColor: string, bgGlow: string }) {
  return (
    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-8 rounded-[32px] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all duration-300">
      <div className="space-y-2">
        <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{val}</p>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">{title}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className={`w-14 h-14 rounded-2xl ${bgGlow} flex items-center justify-center ${accentColor} border border-slate-200/20 dark:border-slate-800 group-hover:scale-110 transition-transform shrink-0`}>
        <Icon size={26} />
      </div>
    </div>
  );
}

function TabButton({ label, icon: Icon, active, count, onClick }: { label: string, icon: any, active: boolean, count: number, onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
        active
          ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
          : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
      }`}
    >
      <Icon size={16} />
      <span className="whitespace-nowrap">{label}</span>
      {count > 0 && (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
          {count}
        </span>
      )}
      {active && (
        <motion.div
          layoutId="activeStaffTab"
          className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 dark:bg-indigo-500 rounded-t-full shadow-[0_-4px_10px_rgba(99,102,241,0.5)]"
        />
      )}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50">
      <Activity size={48} className="text-slate-400 animate-pulse" />
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">{text}</p>
    </div>
  );
}
