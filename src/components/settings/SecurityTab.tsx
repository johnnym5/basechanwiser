"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSettings } from "@/context/SettingsContext";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Shield, Trash2, Download, Save, Loader2, ToggleLeft, ToggleRight, User, Key, UserPlus, X, ShieldAlert } from "lucide-react";
import { UserProfile, AppRole, StaffPermissions } from "@/types";
import { useAuth } from "@/lib/auth/auth-context";

export default function SecurityTab() {
  const { user: currentUser } = useAuth();
  const { globalSettings, updateGlobalSettings } = useSettings();
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Modal States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ displayName: "", email: "", role: "Counselor" as AppRole });
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const q = query(collection(db, "Users"), where("role", "in", ["Counselor", "Admin", "Super Admin", "Head of Compliance"]));
      const snap = await getDocs(q);
      setStaff(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
    } catch (err) {
      console.error("Failed to fetch staff:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Secure Permission / Role Update:
   * 1. Optimistic Update: Reflect change in UI immediately.
   * 2. API Call: PATCH /api/admin/users to update Custom Claims + Firestore.
   * 3. Rollback: If API fails, revert local state.
   */
  const handleUpdateUser = async (targetUid: string, updates: { role?: AppRole; permissions?: StaffPermissions }) => {
    const originalStaff = [...staff];
    const target = staff.find(s => s.uid === targetUid);
    if (!target) return;

    // 1. Optimistic Update
    setStaff(prev => prev.map(s => s.uid === targetUid ? { ...s, ...updates } : s));

    try {
      const token = await currentUser?.getIdToken();
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          targetUid,
          role: updates.role || target.role,
          permissions: updates.permissions || target.permissions || {
            canDownloadDocs: false,
            canEditSettings: false,
            canManageModules: false
          }
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Update failed");
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      // 3. Rollback
      setStaff(originalStaff);
    }
  };

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      const token = await currentUser?.getIdToken();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(inviteForm)
      });

      if (!res.ok) throw new Error("Invitation failed");

      alert("Staff member pre-registered successfully!");
      setShowInviteModal(false);
      fetchStaff();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsInviting(false);
    }
  };

  const exportAuditLogs = async () => {
    setExporting(true);
    try {
      const snap = await getDocs(collection(db, "audit_logs"));
      const data = snap.docs.map(d => d.data());
      const csvContent = "data:text/csv;charset=utf-8,"
        + ["Timestamp,User,Action,Details"].join(",") + "\n"
        + data.map(row => `${row.timestamp?.toDate().toISOString()},${row.userId},${row.action},${row.details}`).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `audit_logs_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Staff Management Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">Staff Access Control</h2>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Manage global roles and granular feature permissions.</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-6 py-3 bg-[#1a73e8] text-white font-black rounded-full text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <UserPlus size={14} /> Invite Staff Member
        </button>
      </div>

      {/* RBAC Table */}
      <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-50 dark:border-slate-700">
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Staff Member</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Global Role</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 text-center">Download Docs</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 text-center">Edit Settings</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 text-center">Manage Modules</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {staff.map((s) => (
                <tr key={s.uid} className="hover:bg-gray-50/30 dark:hover:bg-slate-900/30 transition-all">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center font-black text-blue-500 text-xs">
                          {s.displayName?.charAt(0)}
                       </div>
                       <div className="min-w-0">
                          <p className="text-sm font-black dark:text-white truncate">{s.displayName}</p>
                          <p className="text-[10px] text-gray-400 font-bold truncate">{s.email}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <select
                      value={s.role}
                      onChange={(e) => handleUpdateUser(s.uid, { role: e.target.value as AppRole })}
                      className="bg-transparent text-[10px] font-black uppercase text-[#1a73e8] focus:outline-none cursor-pointer"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Counselor">Counselor</option>
                      <option value="Head of Compliance">Head of Compliance</option>
                    </select>
                  </td>
                  <td className="px-8 py-4 text-center">
                    <button onClick={() => handleUpdateUser(s.uid, { permissions: { ...s.permissions!, canDownloadDocs: !s.permissions?.canDownloadDocs } })}>
                       {s.permissions?.canDownloadDocs ? <ToggleRight className="text-emerald-500 mx-auto" /> : <ToggleLeft className="text-gray-300 mx-auto" />}
                    </button>
                  </td>
                  <td className="px-8 py-4 text-center">
                    <button onClick={() => handleUpdateUser(s.uid, { permissions: { ...s.permissions!, canEditSettings: !s.permissions?.canEditSettings } })}>
                       {s.permissions?.canEditSettings ? <ToggleRight className="text-emerald-500 mx-auto" /> : <ToggleLeft className="text-gray-300 mx-auto" />}
                    </button>
                  </td>
                  <td className="px-8 py-4 text-center">
                    <button onClick={() => handleUpdateUser(s.uid, { permissions: { ...s.permissions!, canManageModules: !s.permissions?.canManageModules } })}>
                       {s.permissions?.canManageModules ? <ToggleRight className="text-emerald-500 mx-auto" /> : <ToggleLeft className="text-gray-300 mx-auto" />}
                    </button>
                  </td>
                  <td className="px-8 py-4 text-right">
                     <button className="p-2 text-gray-400 hover:text-rose-500 transition-colors">
                        <Trash2 size={16} />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit & Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 space-y-4">
           <div className="flex items-center gap-3">
              <ShieldAlert className="text-amber-500" size={24} />
              <h3 className="text-lg font-black dark:text-white uppercase tracking-tighter">Security Failsafe</h3>
           </div>
           <p className="text-xs text-gray-500 font-bold leading-relaxed">
             System administrators cannot demote themselves or remove their own settings permission.
             Contact a Super Admin for ownership transfers.
           </p>
        </div>
        <div className="bg-gray-900 rounded-[40px] p-8 text-white flex items-center justify-between shadow-2xl">
           <div className="space-y-1">
              <h3 className="text-lg font-black uppercase tracking-tighter">Audit Trails</h3>
              <button
                onClick={exportAuditLogs}
                disabled={exporting}
                className="mt-2 text-[10px] font-black uppercase text-blue-400 hover:underline flex items-center gap-2"
              >
                {exporting ? <Loader2 className="animate-spin size={12}" /> : <Download size={12} />}
                Export Action Logs (CSV)
              </button>
           </div>
           <Shield size={40} className="text-blue-500/20" />
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[40px] p-10 shadow-2xl border border-gray-100 dark:border-slate-700 animate-in zoom-in duration-200">
             <div className="flex justify-between items-start mb-8">
                <div>
                   <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Invite Staff</h2>
                   <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Register a new counselor or admin.</p>
                </div>
                <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-900 rounded-xl transition-all"><X size={24} className="text-gray-400" /></button>
             </div>

             <form onSubmit={handleInviteStaff} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Full Name</label>
                   <input
                     required
                     type="text"
                     value={inviteForm.displayName}
                     onChange={e => setInviteForm({...inviteForm, displayName: e.target.value})}
                     className="w-full bg-gray-50 dark:bg-slate-900 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Work Email</label>
                   <input
                     required
                     type="email"
                     value={inviteForm.email}
                     onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
                     className="w-full bg-gray-50 dark:bg-slate-900 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Initial Role</label>
                   <select
                     value={inviteForm.role}
                     onChange={e => setInviteForm({...inviteForm, role: e.target.value as AppRole})}
                     className="w-full bg-gray-50 dark:bg-slate-900 border-none rounded-2xl px-5 py-4 text-sm font-black text-[#1a73e8]"
                   >
                      <option value="Counselor">Counselor</option>
                      <option value="Admin">Admin</option>
                      <option value="Head of Compliance">Head of Compliance</option>
                   </select>
                </div>

                <button
                  type="submit"
                  disabled={isInviting}
                  className="w-full py-5 bg-[#1a73e8] text-white font-black rounded-3xl text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                   {isInviting ? <Loader2 className="animate-spin size={18}" /> : <Save size={18} />}
                   Confirm Registration
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
