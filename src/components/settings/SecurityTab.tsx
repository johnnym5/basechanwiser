"use client";

import React, { useState, useEffect } from "react";
import { useSettings } from "@/context/SettingsContext";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { Shield, Trash2, Download, Save, Loader2, ToggleLeft, ToggleRight, User, Key } from "lucide-react";
import { UserProfile } from "@/types";

export default function SecurityTab() {
  const { globalSettings, updateGlobalSettings } = useSettings();
  const [counselors, setCounselors] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchCounselors();
  }, []);

  const fetchCounselors = async () => {
    const q = query(collection(db, "Users"), where("role", "in", ["Counselor", "Admin"]));
    const snap = await getDocs(q);
    setCounselors(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
    setLoading(false);
  };

  const togglePermission = async (uid: string, permission: string, current: boolean) => {
    const userRef = doc(db, "Users", uid);
    await updateDoc(userRef, {
      [`rbac.${permission}`]: !current
    });
    fetchCounselors();
  };

  const exportAuditLogs = async () => {
    setExporting(true);
    // Stub for audit logs CSV export
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
    setExporting(false);
  };

  return (
    <div className="space-y-8">
      {/* GDPR Data Retention */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
           <Trash2 className="text-rose-500" size={24} />
           <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">Data Retention Policy</h2>
        </div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Auto-purge records and storage blobs after the set period.</p>

        <div className="flex items-center gap-4">
           <div className="flex-1 max-w-xs">
              <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Retention Period (Days)</label>
              <input
                type="number"
                value={globalSettings?.dataRetentionDays || 90}
                onChange={(e) => updateGlobalSettings({ dataRetentionDays: parseInt(e.target.value) })}
                className="w-full bg-gray-50 dark:bg-slate-900 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500"
              />
           </div>
           <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex-1">
              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed uppercase">
                Note: Purge script runs daily via Cloud Functions. Ensure legal compliance before lowering this limit.
              </p>
           </div>
        </div>
      </div>

      {/* RBAC Manager */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
           <Key className="text-blue-500" size={24} />
           <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">Granular Access Control (RBAC)</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50 dark:border-slate-700">
                <th className="py-4 text-[10px] font-black uppercase text-gray-400">Staff Member</th>
                <th className="py-4 text-[10px] font-black uppercase text-gray-400 text-center">Download Docs</th>
                <th className="py-4 text-[10px] font-black uppercase text-gray-400 text-center">Edit Settings</th>
                <th className="py-4 text-[10px] font-black uppercase text-gray-400 text-center">Manage Modules</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {counselors.map((c) => (
                <tr key={c.uid}>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-900 flex items-center justify-center font-black text-blue-500 text-xs">{c.displayName?.charAt(0)}</div>
                       <span className="text-xs font-bold dark:text-slate-300">{c.displayName}</span>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <button onClick={() => togglePermission(c.uid, 'canDownloadDocuments', (c as any).rbac?.canDownloadDocuments)}>
                       {(c as any).rbac?.canDownloadDocuments ? <ToggleRight className="text-emerald-500 mx-auto" /> : <ToggleLeft className="text-gray-300 mx-auto" />}
                    </button>
                  </td>
                  <td className="py-4 text-center">
                    <button onClick={() => togglePermission(c.uid, 'canEditSettings', (c as any).rbac?.canEditSettings)}>
                       {(c as any).rbac?.canEditSettings ? <ToggleRight className="text-emerald-500 mx-auto" /> : <ToggleLeft className="text-gray-300 mx-auto" />}
                    </button>
                  </td>
                  <td className="py-4 text-center">
                    <button onClick={() => togglePermission(c.uid, 'canManageModules', (c as any).rbac?.canManageModules)}>
                       {(c as any).rbac?.canManageModules ? <ToggleRight className="text-emerald-500 mx-auto" /> : <ToggleLeft className="text-gray-300 mx-auto" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-gray-900 rounded-[40px] p-8 text-white flex items-center justify-between shadow-2xl">
         <div className="space-y-1">
            <h3 className="text-lg font-black uppercase tracking-tighter">System Audit Trails</h3>
            <p className="text-xs text-gray-400 font-bold">Download comprehensive logs of all administrative actions.</p>
         </div>
         <button
           onClick={exportAuditLogs}
           disabled={exporting}
           className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all active:scale-95"
          >
            {exporting ? <Loader2 className="animate-spin" /> : <Download size={18} />}
            Export Logs (CSV)
         </button>
      </div>
    </div>
  );
}
