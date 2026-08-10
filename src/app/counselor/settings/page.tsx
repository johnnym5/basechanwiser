"use client";

import React, { useState, useEffect, useRef } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { useSettings } from "@/context/SettingsContext";
import {
  Building,
  Shield,
  ClipboardList,
  Zap,
  Webhook,
  Save,
  Palette,
  Upload,
  Trash2,
  Plus,
  Loader2,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  X,
  ShieldAlert,
  Download,
  LayoutGrid
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RoleGuard from "@/components/layout/RoleGuard";
import { storage, db } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, getDocs, query, where } from "firebase/firestore";
import { RubricCriteria } from "@/types/settings";
import { UserProfile, AppRole, StaffPermissions } from "@/types";

type SettingsSection = 'branding' | 'security' | 'rubrics' | 'workflow' | 'integrations';

export default function EnterpriseSettingsPage() {
  const { user: currentUser, role, loading: authLoading } = useAuth();
  const { globalSettings, updateGlobalSettings, loading: settingsLoading } = useSettings();
  const [activeSection, setActiveSection] = useState<SettingsSection>('branding');

  const navItems = [
    { id: 'branding', label: 'Organization & Brand', icon: Building },
    { id: 'security', label: 'Staff & Security', icon: Shield },
    { id: 'rubrics', label: 'Evaluation & Rubrics', icon: ClipboardList },
    { id: 'workflow', label: 'Workflow & Automation', icon: Zap },
    { id: 'integrations', label: 'Integrations & API', icon: Webhook },
  ];

  if (authLoading || settingsLoading) {
    return (
      <AppShell>
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" /></div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <RoleGuard allowedRoles={["Admin", "Super Admin"]}>
        <div className="max-w-7xl mx-auto h-[85vh] flex bg-[#0F172A] rounded-[32px] border border-slate-800 overflow-hidden shadow-2xl">

          {/* LEFT SIDEBAR */}
          <div className="w-72 bg-slate-900/50 border-r border-slate-800 flex flex-col">
            <div className="p-8 border-b border-slate-800">
              <h2 className="text-xl font-black text-white tracking-tighter uppercase">Enterprise</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Platform Configuration</p>
            </div>
            <nav className="flex-1 overflow-y-auto py-6">
              <ul className="space-y-2 px-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveSection(item.id as SettingsSection)}
                        className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${
                          isActive
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="p-6 border-t border-slate-800 bg-slate-900/30">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                     <Shield className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-white uppercase tracking-tighter">Root Admin</p>
                     <p className="text-[9px] text-slate-500 font-bold uppercase">System Access Active</p>
                  </div>
               </div>
            </div>
          </div>

          {/* RIGHT CONTENT AREA */}
          <div className="flex-1 flex flex-col bg-[#0F172A] overflow-y-auto custom-scrollbar">
            <div className="p-10">
              {activeSection === 'branding' && <BrandingSection />}
              {activeSection === 'security' && <SecuritySection currentUser={currentUser} />}
              {activeSection === 'rubrics' && <RubricsSection />}
              {activeSection === 'workflow' && <WorkflowSection />}
              {activeSection === 'integrations' && <IntegrationsSection />}
            </div>
          </div>
        </div>
      </RoleGuard>
    </AppShell>
  );
}

// ==========================================
// SECTION COMPONENTS
// ==========================================

function BrandingSection() {
  const { globalSettings, updateGlobalSettings } = useSettings();
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      const logoRef = ref(storage, `branding/logo_${Date.now()}`);
      await uploadBytes(logoRef, file);
      const url = await getDownloadURL(logoRef);
      await updateGlobalSettings({ logoUrl: url });
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">B2B White-Labeling</h3>
          <p className="text-sm text-slate-400 font-medium">Customize the platform identity, colors, and assets.</p>
        </div>
        <button className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/20 active:scale-95">
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-slate-900/50 p-8 rounded-[32px] border border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
             <Palette className="text-indigo-400" size={20} />
             <h4 className="text-sm font-black text-white uppercase tracking-widest">Primary Brand Color</h4>
          </div>
          <div className="flex items-center gap-6">
             <input
               type="color"
               value={globalSettings?.primaryColor || "#1a73e8"}
               onChange={(e) => updateGlobalSettings({ primaryColor: e.target.value })}
               className="w-20 h-20 rounded-3xl cursor-pointer border-4 border-slate-800 bg-transparent"
             />
             <div className="space-y-1">
                <p className="text-lg font-black text-white font-mono uppercase tracking-tighter">{globalSettings?.primaryColor}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Dynamic CSS Injection</p>
             </div>
          </div>
        </div>

        <div className="bg-slate-900/50 p-8 rounded-[32px] border border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
             <Upload className="text-indigo-400" size={20} />
             <h4 className="text-sm font-black text-white uppercase tracking-widest">Enterprise Logo</h4>
          </div>
          <div className="relative group w-full max-w-[240px]">
             <input
               type="file"
               onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
             />
             <div className="border-2 border-dashed border-slate-700 rounded-3xl p-8 text-center hover:border-indigo-500 transition-all bg-slate-900/30">
                {globalSettings?.logoUrl ? (
                  <img src={globalSettings.logoUrl} alt="Logo" className="h-14 mx-auto object-contain" />
                ) : (
                  <Upload className="w-10 h-10 text-slate-600 mx-auto" />
                )}
                <p className="mt-3 text-[9px] font-black uppercase text-slate-500 tracking-widest">{uploading ? 'UPLOADING...' : 'Drop PNG/SVG Here'}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecuritySection({ currentUser }: { currentUser: any }) {
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (targetUid: string, updates: { role?: AppRole; permissions?: StaffPermissions }) => {
    const originalStaff = [...staff];
    setStaff(prev => prev.map(s => s.uid === targetUid ? { ...s, ...updates } : s));

    try {
      const token = await currentUser?.getIdToken();
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ targetUid, ...updates })
      });
      if (!res.ok) throw new Error("Update failed");
    } catch (err) {
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
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(inviteForm)
      });
      if (!res.ok) throw new Error("Invite failed");
      setShowInviteModal(false);
      fetchStaff();
    } catch (err) {
      console.error(err);
    } finally {
      setIsInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center">
        <Loader2 className="animate-spin mx-auto text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Staff & Security</h3>
          <p className="text-sm text-slate-400 font-medium">Manage team access, RBAC, and system permissions.</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-500 transition-all active:scale-95 flex items-center gap-2"
        >
          <UserPlus size={16} /> Invite Staff
        </button>
      </div>

      <div className="bg-slate-900/50 rounded-[32px] border border-slate-800 overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-800">
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Team Member</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Global Role</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Settings Access</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {staff.map((s) => (
              <tr key={s.uid} className="hover:bg-slate-800/30 transition-all">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center font-black text-indigo-400">
                        {s.displayName?.charAt(0)}
                     </div>
                     <div>
                        <p className="text-sm font-black text-white tracking-tight">{s.displayName}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{s.email}</p>
                     </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <select
                    value={s.role}
                    onChange={(e) => handleUpdateUser(s.uid, { role: e.target.value as AppRole })}
                    className="bg-transparent text-[10px] font-black uppercase text-indigo-400 focus:outline-none cursor-pointer border border-slate-700 rounded-lg px-3 py-1.5"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Counselor">Counselor</option>
                    <option value="Head of Compliance">Head of Compliance</option>
                  </select>
                </td>
                <td className="px-8 py-6 text-center">
                  <button onClick={() => handleUpdateUser(s.uid, { permissions: { ...s.permissions!, canEditSettings: !s.permissions?.canEditSettings } })}>
                     {s.permissions?.canEditSettings ? <ToggleRight className="text-emerald-500 mx-auto" /> : <ToggleLeft className="text-slate-600 mx-auto" />}
                  </button>
                </td>
                <td className="px-8 py-6 text-right">
                   <button className="p-2 text-slate-600 hover:text-rose-500 transition-colors">
                      <Trash2 size={18} />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 w-full max-w-md rounded-[40px] p-10 shadow-2xl border border-slate-800 space-y-8"
            >
              <div className="flex justify-between items-start">
                <div>
                   <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Invite Staff</h2>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Register a new system user.</p>
                </div>
                <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-all"><X size={24} className="text-slate-500" /></button>
              </div>

              <form onSubmit={handleInviteStaff} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Full Name</label>
                   <input
                     required
                     type="text"
                     value={inviteForm.displayName}
                     onChange={e => setInviteForm({...inviteForm, displayName: e.target.value})}
                     className="w-full bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Work Email</label>
                   <input
                     required
                     type="email"
                     value={inviteForm.email}
                     onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
                     className="w-full bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Initial Role</label>
                   <select
                     value={inviteForm.role}
                     onChange={e => setInviteForm({...inviteForm, role: e.target.value as AppRole})}
                     className="w-full bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-black text-indigo-400"
                   >
                      <option value="Counselor">Counselor</option>
                      <option value="Admin">Admin</option>
                      <option value="Head of Compliance">Head of Compliance</option>
                   </select>
                </div>

                <button
                  type="submit"
                  disabled={isInviting}
                  className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl text-xs uppercase tracking-widest shadow-xl shadow-indigo-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                   {isInviting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                   Confirm Registration
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RubricsSection() {
  const { globalSettings, updateGlobalSettings } = useSettings();

  const addRubricItem = () => {
    const newCriteria: RubricCriteria = { id: Date.now().toString(), label: "New Criteria", maxScore: 10 };
    updateGlobalSettings({ globalRubric: [...(globalSettings?.globalRubric || []), newCriteria] });
  };

  const updateRubricItem = (id: string, label: string, maxScore: number) => {
    const updated = globalSettings?.globalRubric.map(r => r.id === id ? { ...r, label, maxScore } : r) || [];
    updateGlobalSettings({ globalRubric: updated });
  };

  const deleteRubricItem = (id: string) => {
    const updated = globalSettings?.globalRubric.filter(r => r.id !== id) || [];
    updateGlobalSettings({ globalRubric: updated });
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-slate-800 pb-6">
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Evaluation & Rubrics</h3>
        <p className="text-sm text-slate-400 font-medium">Define standard criteria for Counselor evaluations and mock scoring.</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
           {globalSettings?.globalRubric.map((r) => (
             <div key={r.id} className="flex items-center gap-6 bg-slate-900/50 p-6 rounded-[32px] border border-slate-800 shadow-sm">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                   <LayoutGrid className="text-emerald-500" size={20} />
                </div>
                <input
                  type="text"
                  value={r.label}
                  onChange={(e) => updateRubricItem(r.id, e.target.value, r.maxScore)}
                  className="flex-1 bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="Criteria Label"
                />
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Max Score</span>
                   <input
                    type="number"
                    value={r.maxScore}
                    onChange={(e) => updateRubricItem(r.id, r.label, parseInt(e.target.value) || 0)}
                    className="w-20 bg-slate-800 border-none rounded-2xl px-2 py-3 text-sm font-black text-indigo-400 text-center focus:ring-2 focus:ring-indigo-500"
                   />
                </div>
                <button onClick={() => deleteRubricItem(r.id)} className="p-3 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all">
                   <Trash2 size={20} />
                </button>
             </div>
           ))}
        </div>

        <button onClick={addRubricItem} className="group flex items-center gap-3 text-indigo-400 text-xs font-black uppercase tracking-widest hover:text-indigo-300 transition-all pt-2">
           <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20"><Plus size={16} /></div>
           Add Evaluative Criteria
        </button>
      </div>
    </div>
  );
}

function WorkflowSection() {
  const { user } = useAuth();
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    if (!confirm("🚨 WARNING: This will overwrite or restore the 5 Core UKVI Modules. Continue?")) return;
    setSeeding(true);
    try {
      // Fetch token, but don't fail if it's missing (server now allows localhost bypass)
      const token = await user?.getIdToken().catch(() => "");

      const res = await fetch("/api/admin/seed-modules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Seeding failed");
      alert(data.message || "Success! Core modules restored.");
    } catch (e: any) {
      alert(`System Notice: ${e.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 py-10">
      <div className="flex justify-between items-start border-b border-slate-800 pb-6">
        <div>
           <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Workflow & Automation</h3>
           <p className="text-sm text-slate-400 font-medium">Manage systemic automation and data recovery tools.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Module Seeding Tool */}
        <div className="bg-slate-900/50 p-8 rounded-[40px] border border-slate-800 space-y-6">
           <div className="flex items-center gap-3">
              <Download className="text-blue-500" size={24} />
              <h4 className="text-lg font-black text-white uppercase tracking-tighter">UKVI Content Seeding</h4>
           </div>
           <p className="text-xs text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
             Populate or reset the 5 official progressive UKVI training modules and their question banks.
           </p>
           <button
             onClick={handleSeed}
             disabled={seeding}
             className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
           >
             {seeding ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
             {seeding ? "RESTORING..." : "Seed / Restore Core Modules"}
           </button>
        </div>

        {/* Placeholder for future workflow */}
        <div className="bg-slate-900/50 p-8 rounded-[40px] border border-dashed border-slate-800 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
           <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
              <Webhook className="text-slate-600" />
           </div>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Advanced Automation Hooks<br/>Coming Soon</p>
        </div>
      </div>
    </div>
  );
}

function IntegrationsSection() {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-20">
      <div className="max-w-md mx-auto space-y-8">
        <div className="w-24 h-24 bg-slate-800/50 rounded-[32px] border border-slate-700 flex items-center justify-center mx-auto shadow-2xl">
           <Webhook className="w-12 h-12 text-slate-600" />
        </div>
        <div className="space-y-2">
           <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Integrations & API</h3>
           <p className="text-sm text-slate-500 font-medium leading-relaxed uppercase tracking-widest">
             No active connections. Manage third-party webhooks and enterprise API keys here.
           </p>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-6">
           <div className="h-1 bg-slate-800 rounded-full" />
           <div className="h-1 bg-slate-800 rounded-full" />
           <div className="h-1 bg-slate-800 rounded-full" />
        </div>
      </div>
    </div>
  );
}
