"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Resource, SystemSettings } from "@/types/resource";
import { UserProfile } from "@/types";
import { Settings, Video, FileText, ExternalLink, Trash2, Edit, Plus, X, Loader2, CheckCircle2, Monitor, Shield, Mail, Tag, Calendar, Download, Lock, Sparkles, AlertCircle, LayoutGrid } from "lucide-react";

function Tab({ isActive, label, onClick }: { isActive: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`px-6 py-3 font-bold text-sm transition-all relative ${
        isActive
          ? "text-[#1a73e8] dark:text-blue-400"
          : "text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white"
      }`}
      onClick={onClick}
    >
      {label}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1a73e8] dark:bg-blue-400 rounded-t-full animate-in fade-in slide-in-from-bottom-1" />
      )}
    </button>
  );
}

const generateStudentId = () => {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `BW-${randomNum}`;
};

export default function SettingsPage() {
  const { userProfile, userId, role, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && role !== "Counselor" && role !== "Admin" && role !== "Super Admin") {
      router.push("/dashboard");
    }
  }, [role, authLoading, router]);

  const [activeTab, setActiveTab] = useState<number>(0);
  const [settings, setSettings] = useState<SystemSettings>({});
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resourceForm, setResourceForm] = useState<Partial<Resource>>({});
  const [editResourceId, setEditResourceId] = useState<string | null>(null);

  // New State for Advanced Options
  const [showMaintenanceConfirm, setShowMaintenanceConfirm] = useState(false);
  const [activeTemplateEvent, setActiveTemplateEvent] = useState<"welcome" | "quizFailed" | "formVerified">("welcome");
  const [isImportingCSV, setIsImportingCSV] = useState(false);

  const [staffList, setStaffList] = useState<any[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState<string>("All");
  const [userSearchTerm, setUserSearchTerm] = useState<string>("");
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [newUserForm, setNewUserForm] = useState({ displayName: "", email: "", role: "Counselor", office: "Lagos" });
  const [isCreatingUser, setIsCreatingUser] = useState<boolean>(false);

  const fetchStaff = async () => {
    const usersSnap = await getDocs(collection(db, "Users"));
    const studentList: any[] = [];
    const allStaff: any[] = [];
    usersSnap.forEach((d) => {
      const data = d.data() as any;
      if (data.role === "Student") studentList.push({ uid: d.id, ...data });
      else allStaff.push({ uid: d.id, ...data });
    });
    setStudents(studentList);
    setStaffList(allStaff);
  };

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;
      try {
        const settingsRef = doc(db, "system_settings", "global");
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
          setSettings(snap.data() as SystemSettings);
        } else {
          setSettings({
            globalDriveFolderUrl: "https://drive.google.com/drive/folders/1Wp7SweOk4_wZAVjpOpicYiQdVYR1EKNb?usp=sharing",
            defaultPassMark: 80,
            offices: ["Lagos", "Abuja", "Benin"],
          });
        }

        const resSnap = await getDocs(collection(db, "resources"));
        const list: Resource[] = [];
        resSnap.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            title: data.title || "",
            type: data.type || "video",
            driveUrl: data.driveUrl || "",
            embedUrl: data.embedUrl || "",
            attachedPackId: data.attachedPackId,
            tags: data.tags,
            validUntil: data.validUntil,
            clicks: data.clicks,
            views: data.views,
            addedBy: data.addedBy || "",
            authorName: data.authorName || "",
            createdAt: data.createdAt,
          });
        });
        setResources(list);
        await fetchStaff();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId]);

  const [profileInfo, setProfileInfo] = useState({
    name: userProfile?.displayName || "",
    email: userProfile?.email || "",
    office: userProfile?.office || "",
    availability: "",
    notifyInterview: false,
    notifyFail: false,
    dailySummary: false,
  });

  // Sync profileInfo with userProfile once it loads
  useEffect(() => {
    if (userProfile) {
      setProfileInfo({
        name: userProfile.displayName || "",
        email: userProfile.email || "",
        office: userProfile.office || "",
        availability: (userProfile as any).preferences?.interviewAvailability || "",
        notifyInterview: (userProfile as any).preferences?.notifyInterview || false,
        notifyFail: (userProfile as any).preferences?.notifyFail || false,
        dailySummary: (userProfile as any).preferences?.dailySummary || false,
      });
    }
  }, [userProfile]);

  const handleProfileSave = async () => {
    if (!userId) return;
    const userRef = doc(db, "Users", userId);
    await setDoc(
      userRef,
      {
        displayName: profileInfo.name,
        email: profileInfo.email,
        office: profileInfo.office,
        preferences: {
          interviewAvailability: profileInfo.availability,
          notifyInterview: profileInfo.notifyInterview,
          notifyFail: profileInfo.notifyFail,
          dailySummary: profileInfo.dailySummary,
        },
      },
      { merge: true }
    );
    alert("Profile saved successfully!");
  };

  const handleAdvancedProfileSave = async (updates: Partial<UserProfile>) => {
    if (!userId) return;
    const userRef = doc(db, "Users", userId);
    await updateDoc(userRef, updates);
    alert("Preferences updated!");
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("drive.google.com") && url.includes("/view")) {
      return url.replace(/\/view.*$/, "/preview");
    }
    return url;
  };

  const handleResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const driveUrl = resourceForm.driveUrl || "";
    const embedUrl = getEmbedUrl(driveUrl);

    const payload = {
      title: resourceForm.title || "Untitled",
      type: (resourceForm.type as any) || "video",
      driveUrl,
      embedUrl,
      attachedPackId: resourceForm.attachedPackId || "",
      tags: resourceForm.tags || [],
      validUntil: resourceForm.validUntil || null,
      addedBy: userId,
      authorName: userProfile?.displayName || "Staff",
      createdAt: serverTimestamp(),
    };

    if (editResourceId) {
      const docRef = doc(db, "resources", editResourceId);
      await updateDoc(docRef, payload);
    } else {
      await addDoc(collection(db, "resources"), { ...payload, clicks: 0, views: 0 });
    }

    const resSnap = await getDocs(collection(db, "resources"));
    const list: Resource[] = [];
    resSnap.forEach((d) => {
      const data = d.data();
      list.push({
        id: d.id,
        title: data.title || "",
        type: data.type || "video",
        driveUrl: data.driveUrl || "",
        embedUrl: data.embedUrl || "",
        attachedPackId: data.attachedPackId,
        tags: data.tags,
        validUntil: data.validUntil,
        clicks: data.clicks,
        views: data.views,
        addedBy: data.addedBy || "",
        authorName: data.authorName || "",
        createdAt: data.createdAt,
      });
    });
    setResources(list);
    setShowResourceModal(false);
    setResourceForm({});
    setEditResourceId(null);
  };

  const handleEditResource = (res: Resource) => {
    setResourceForm(res);
    setEditResourceId(res.id);
    setShowResourceModal(true);
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    await deleteDoc(doc(db, "resources", id));
    setResources(resources.filter((r) => r.id !== id));
  };

  const filteredStaffList = staffList.filter((userItem) => {
    const matchesRole = userRoleFilter === "All" || (userItem.role || "Student") === userRoleFilter;
    const matchesSearch =
      !userSearchTerm ||
      (userItem.displayName && userItem.displayName.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
      (userItem.email && userItem.email.toLowerCase().includes(userSearchTerm.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  const handleRoleChange = async (uid: string, newRole: string) => {
    await updateDoc(doc(db, "Users", uid), { role: newRole });
    fetchStaff();
  };

  const handleToggleSuspend = async (uid: string, currentSuspendedState?: boolean) => {
    await updateDoc(doc(db, "Users", uid), { suspended: !currentSuspendedState });
    fetchStaff();
  };

  const handleDeleteAccount = async (uid: string) => {
    if (!confirm("Delete account permanently from database?")) return;
    await deleteDoc(doc(db, "Users", uid));
    fetchStaff();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.email || !newUserForm.displayName) return;
    setIsCreatingUser(true);
    try {
      const dummyUid = `user_created_${Date.now()}`;
      const studentId = generateStudentId();
      await setDoc(doc(db, "Users", dummyUid), {
        uid: dummyUid,
        studentId,
        displayName: newUserForm.displayName,
        email: newUserForm.email,
        role: newUserForm.role,
        office: newUserForm.office,
        suspended: false,
        createdAt: serverTimestamp(),
      });

      alert(`User profile for ${newUserForm.displayName} created successfully! ID: ${studentId}`);
      setNewUserForm({ displayName: "", email: "", role: "Counselor", office: "Lagos" });
      setShowAddUserModal(false);
      fetchStaff();
    } catch (err: any) {
      console.error("Create User Error:", err);
      alert(`Failed to create user: ${err.message}`);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleSystemSave = async () => {
    const sysRef = doc(db, "system_settings", "global");
    await setDoc(sysRef, settings, { merge: true });
    alert("System settings saved!");
  };

  const inputClasses = "mt-1 block w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] px-4 py-3 text-sm text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all";
  const labelClasses = "block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-slate-500 mb-1";

  if (loading) return <div className="p-8 text-gray-500 dark:text-gray-400">Loading Settings...</div>;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto w-full space-y-8 pb-20">
        <div className="flex flex-col gap-1 border-l-4 border-[#1a73e8] pl-6 py-2">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3 font-google">
            <Settings className="w-8 h-8 text-[#1a73e8]" /> Settings & System Manager
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-widest">
            Manage staff profile, resource library, and platform defaults
          </p>
        </div>

        <div className="border-b border-gray-200 dark:border-slate-800 flex gap-2 overflow-x-auto scrollbar-hide">
          {[
            { label: "Profile & Preferences", idx: 0, roles: ["Admin", "Counselor", "Super Admin"] },
            { label: "Resource Library", idx: 1, roles: ["Admin", "Counselor", "Super Admin"] },
            { label: "User Management", idx: 2, roles: ["Admin", "Counselor", "Super Admin"] },
            { label: "System & Compliance", idx: 3, roles: ["Admin", "Counselor", "Super Admin"] },
          ]
            .filter((tab) => role && tab.roles.includes(role))
            .map((tab) => (
              <Tab key={tab.label} label={tab.label} isActive={activeTab === tab.idx} onClick={() => setActiveTab(tab.idx)} />
            ))}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 0 && (
            <section className="space-y-8 bg-white dark:bg-[#1E293B] p-8 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xl shadow-gray-200/20 dark:shadow-none">
              <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
                 <h2 className="text-xl font-black text-gray-900 dark:text-white font-google">Staff Profile & Notifications</h2>
                 <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Configure your professional identity and alert settings.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className={labelClasses}>Full Name</label>
                    <input type="text" value={profileInfo.name} onChange={(e) => setProfileInfo({ ...profileInfo, name: e.target.value })} className={inputClasses} />
                  </div>
                  <div>
                    <label className={labelClasses}>Designated Office Location</label>
                    <select value={profileInfo.office} onChange={(e) => setProfileInfo({ ...profileInfo, office: e.target.value })} className={inputClasses}>
                      <option value="">Select Office</option>
                      {(settings.offices || ["Abuja", "Lagos", "Benin"]).map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={labelClasses}>Staff Email (Read-only)</label>
                    <input type="email" value={profileInfo.email} readOnly className={`${inputClasses} opacity-60 cursor-not-allowed`} />
                  </div>
                  <div>
                    <label className={labelClasses}>Interview Availability URL (Calendly/Google)</label>
                    <input type="url" placeholder="https://..." value={profileInfo.availability} onChange={(e) => setProfileInfo({ ...profileInfo, availability: e.target.value })} className={inputClasses} />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Automated Alert Subscriptions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'notifyInterview', label: 'Student Pack Submissions' },
                    { key: 'notifyFail', label: 'Quiz Failure Alerts (<80%)' },
                    { key: 'dailySummary', label: 'Daily Activity Recap Email' },
                  ].map((pref) => (
                    <label key={pref.key} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] cursor-pointer hover:border-blue-500/50 transition-all group">
                      <input
                        type="checkbox"
                        checked={(profileInfo as any)[pref.key]}
                        onChange={(e) => setProfileInfo({ ...profileInfo, [pref.key]: e.target.checked })}
                        className="w-5 h-5 rounded-md text-[#1a73e8] focus:ring-[#1a73e8] border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-[#0F172A]"
                      />
                      <span className="text-xs font-bold text-gray-700 dark:text-slate-300 group-hover:text-[#1a73e8] transition-colors">{pref.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button onClick={handleProfileSave} className="px-8 py-3 bg-[#1a73e8] text-white font-black rounded-full hover:bg-[#1557b0] transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                  Save Preferences
                </button>
              </div>

              {/* ── Advanced Individual Preferences ── */}
              <div className="pt-8 border-t border-gray-100 dark:border-slate-800 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-blue-500" /> UI & Experience
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className={labelClasses}>Interface Theme</label>
                        <select
                          value={userProfile?.themePreference || "dark"}
                          onChange={(e) => handleAdvancedProfileSave({ themePreference: e.target.value as any })}
                          className={inputClasses}
                        >
                          <option value="dark">Dark Mode (Default)</option>
                          <option value="light">Light Mode</option>
                          <option value="system">Match System</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClasses}>Default Dashboard View</label>
                        <select
                          value={userProfile?.defaultDashboard || "analytics"}
                          onChange={(e) => handleAdvancedProfileSave({ defaultDashboard: e.target.value as any })}
                          className={inputClasses}
                        >
                          <option value="analytics">Visual Analytics</option>
                          <option value="table">Student Data Table</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-500" /> Security & Access
                    </h3>
                    <div className="p-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-[#0F172A] flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">Two-Factor Authentication (2FA)</p>
                        <p className="text-[10px] text-gray-500">Add an extra layer of security to your staff account.</p>
                      </div>
                      <button
                        onClick={() => handleAdvancedProfileSave({ twoFactorEnabled: !userProfile?.twoFactorEnabled })}
                        className={`w-12 h-6 rounded-full p-1 transition-all ${userProfile?.twoFactorEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-700'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-all ${userProfile?.twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-500" /> Professional Email Signature
                  </h3>
                  <textarea
                    rows={4}
                    value={userProfile?.emailSignature || ""}
                    onChange={(e) => handleAdvancedProfileSave({ emailSignature: e.target.value })}
                    placeholder="E.g. Kind Regards, [Name] | Senior Counselor | basechaninternational.com"
                    className={`${inputClasses} font-mono text-xs`}
                  />
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Automatically appended to student notifications.</p>
                </div>
              </div>
            </section>
          )}

          {activeTab === 1 && (
            <section className="space-y-6 bg-white dark:bg-[#1E293B] p-8 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white font-google">Resource Library</h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Manage external document vault and video lesson library.</p>
                </div>
                <button
                  onClick={() => { setShowResourceModal(true); setEditResourceId(null); setResourceForm({}); }}
                  className="px-6 py-2.5 bg-[#1a73e8] text-white font-bold rounded-full hover:bg-[#1557b0] transition-all shadow-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Resource
                </button>
              </div>

              {(role === "Admin" || role === "Super Admin") && (
                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex flex-col sm:flex-row items-end gap-4">
                  <div className="flex-1 w-full">
                    <label className={labelClasses}>Global Google Drive Vault URL (Student Access)</label>
                    <input type="url" value={settings.globalDriveFolderUrl || ""} onChange={(e) => setSettings({ ...settings, globalDriveFolderUrl: e.target.value })} className={inputClasses} />
                  </div>
                  <button onClick={handleSystemSave} className="px-6 py-3 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition-all uppercase tracking-widest shadow-sm shadow-blue-500/10 shrink-0">
                    Update Vault
                  </button>
                </div>
              )}

              <div className="overflow-x-auto mt-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800">
                      <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Type</th>
                      <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Title & Tags</th>
                      <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Validity</th>
                      <th className="px-4 py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Stats</th>
                      <th className="px-4 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                    {resources.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-sm font-medium text-gray-400">Library is empty.</td></tr>
                    ) : (
                      resources.map((res) => (
                        <tr key={res.id} className="group hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300">
                              {res.type === "video" && <Video className="w-3 h-3 text-red-500" />}
                              {res.type === "pdf" && <FileText className="w-3 h-3 text-blue-500" />}
                              {res.type}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <a href={res.driveUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-gray-900 dark:text-white hover:text-[#1a73e8] flex items-center gap-1.5">
                                {res.title} <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                              <div className="flex flex-wrap gap-1">
                                {res.tags?.map(t => (
                                  <span key={t} className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-[8px] font-black uppercase text-blue-600 border border-blue-100 dark:border-blue-800 flex items-center gap-1">
                                    <Tag className="w-2 h-2" /> {t}
                                  </span>
                                ))}
                                {res.attachedPackId && <span className="px-1.5 py-0.5 rounded bg-gray-50 dark:bg-gray-700 text-[8px] font-black uppercase text-gray-500 border border-gray-200 dark:border-gray-600">{res.attachedPackId}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {res.validUntil ? (
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                                <Calendar className="w-3 h-3" />
                                {new Date(res.validUntil.seconds * 1000).toLocaleDateString()}
                              </div>
                            ) : (
                               <span className="text-[10px] font-black uppercase text-gray-300">Permanent</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black dark:text-white">{res.views || 0}</span>
                                <span className="text-[8px] font-bold text-gray-400 uppercase">Views</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black dark:text-white">{res.clicks || 0}</span>
                                <span className="text-[8px] font-bold text-gray-400 uppercase">Clicks</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right space-x-3">
                            <button onClick={() => handleEditResource(res)} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline">Edit</button>
                            <button onClick={() => handleDeleteResource(res.id)} className="text-[10px] font-black uppercase tracking-widest text-rose-600 hover:underline">Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 2 && (role === "Admin" || role === "Counselor" || role === "Super Admin") && (
            <section className="space-y-6 bg-white dark:bg-[#1E293B] p-8 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-100 dark:border-slate-800 pb-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white font-google">User Management</h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Manage database profiles, roles, and account access.</p>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => setShowAddUserModal(true)} className="px-6 py-2.5 bg-[#1a73e8] text-white font-black rounded-full text-xs shadow-md whitespace-nowrap">+ Add User</button>
                </div>
              </div>

              {/* Account Linking Warning Alert */}
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 flex items-start gap-4">
                 <Shield className="w-6 h-6 text-blue-500 shrink-0" />
                 <div className="space-y-1">
                    <p className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-tighter">Required: Firebase Auth Configuration</p>
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-bold leading-relaxed">
                       To prevent future duplication, please ensure that "Link accounts that use the same email" is ENABLED in your
                       Firebase Console (Authentication &gt; Settings &gt; User account linking).
                    </p>
                 </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {["All", "Counselor", "Admin", "Student"].map((f) => (
                  <button key={f} onClick={() => setUserRoleFilter(f)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border transition-all ${userRoleFilter === f ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white" : "border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-500"}`}>{f}s</button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800">
                      <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-gray-400">User</th>
                      <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-gray-400">Role</th>
                      <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-gray-400">Status</th>
                      <th className="px-4 py-4 text-right text-[10px] font-black uppercase text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                    {filteredStaffList.map((staff) => (
                      <tr key={staff.uid} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-4">
                          <p className="text-sm font-black text-gray-900 dark:text-white leading-none mb-1">{staff.displayName}</p>
                          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-tighter">
                             <span className="text-blue-500">{staff.studentId || "SYSTEM-ID"}</span>
                             <span className="text-gray-400">•</span>
                             <span className="text-gray-400">{staff.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <select value={staff.role || "Student"} onChange={(e) => handleRoleChange(staff.uid, e.target.value)} className="bg-transparent text-xs font-black text-[#1a73e8] cursor-pointer focus:outline-none">
                            <option value="Student">Student</option>
                            <option value="Counselor">Counselor</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${staff.suspended ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}>{staff.suspended ? "Suspended" : "Active"}</span>
                        </td>
                        <td className="px-4 py-4 text-right space-x-3">
                           <button onClick={() => handleToggleSuspend(staff.uid, staff.suspended)} className="text-[10px] font-black uppercase text-amber-600 hover:underline">{staff.suspended ? "Unsuspend" : "Suspend"}</button>
                           <button onClick={() => handleDeleteAccount(staff.uid)} className="text-[10px] font-black uppercase text-rose-600 hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Advanced Admin User Tools ── */}
              <div className="pt-8 border-t border-gray-100 dark:border-slate-800 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Bulk Import */}
                    <div className="space-y-4">
                       <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                          <Download className="w-4 h-4 text-blue-500" /> Bulk Student Import
                       </h3>
                       <div
                         className={`border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-2 transition-all hover:border-blue-500/50 cursor-pointer ${isImportingCSV ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                         onClick={() => setIsImportingCSV(true)}
                       >
                          <FileText className="w-8 h-8 text-gray-300 mx-auto" />
                          <p className="text-xs font-bold text-gray-500">Drop CSV file here or click to upload</p>
                          <p className="text-[10px] text-gray-400">Required: Name, Email, Target University</p>
                       </div>
                    </div>

                    {/* Counselor Workload */}
                    <div className="space-y-4">
                       <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                          <LayoutGrid className="w-4 h-4 text-purple-500" /> Counselor Workload
                       </h3>
                       <div className="space-y-2">
                          {staffList.filter(s => s.role === 'Counselor').map(c => (
                            <div key={c.uid} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#0F172A] border border-gray-100 dark:border-slate-800">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1E293B] flex items-center justify-center text-xs font-black text-purple-500 border border-gray-100 dark:border-slate-800">{c.displayName?.charAt(0)}</div>
                                  <span className="text-xs font-bold dark:text-slate-200">{c.displayName}</span>
                               </div>
                               <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-[10px] font-black text-purple-600 border border-purple-100 dark:border-purple-800">
                                  {students.filter(s => s.location === c.office).length} Students
                               </span>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Password Policy */}
                 <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                       <Lock className="w-4 h-4 text-rose-500" /> Platform Security Policy
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] cursor-pointer hover:border-rose-500/50 transition-all">
                          <input
                            type="checkbox"
                            checked={settings.passwordPolicyStrict}
                            onChange={(e) => setSettings({ ...settings, passwordPolicyStrict: e.target.checked })}
                            className="w-5 h-5 rounded-md text-rose-500 focus:ring-rose-500 border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-[#0F172A]"
                          />
                          <div className="flex flex-col">
                             <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Enforce Strict Password Policy</span>
                             <span className="text-[10px] text-gray-400">Min 8 chars, 1 special, 1 number</span>
                          </div>
                       </label>
                    </div>
                 </div>
              </div>
            </section>
          )}

          {activeTab === 3 && (role === "Admin" || role === "Counselor" || role === "Super Admin") && (
            <section className="space-y-10 bg-white dark:bg-[#1E293B] p-8 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <div className="border-b border-gray-100 dark:border-slate-800 pb-6">
                <h2 className="text-xl font-black text-gray-900 dark:text-white font-google">System & Compliance Configuration</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Platform-wide logic parameters and developer seed tools.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className={labelClasses}>Default Quiz Pass Threshold (%)</label>
                  <input type="number" min={0} max={100} value={settings.defaultPassMark ?? 80} onChange={(e) => setSettings({ ...settings, defaultPassMark: Number(e.target.value) })} className={inputClasses} />
                  <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Applied to all new question packs by default.</p>
                </div>
                <div>
                  <label className={labelClasses}>Regional Branch Offices (CSV)</label>
                  <input type="text" placeholder="Lagos, Abuja, Benin" value={settings.offices?.join(", ") || ""} onChange={(e) => setSettings({ ...settings, offices: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })} className={inputClasses} />
                  <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Comma-separated list for profile dropdowns.</p>
                </div>
                <div>
                  <label className={labelClasses}>Quiz Retake Cooldown (Hours)</label>
                  <input type="number" min={0} value={settings.quizRetakeCooldownHours ?? 24} onChange={(e) => setSettings({ ...settings, quizRetakeCooldownHours: Number(e.target.value) })} className={inputClasses} />
                  <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Mandatory wait time after a failed attempt.</p>
                </div>
                <div>
                  <label className={labelClasses}>Max Retakes Allowed</label>
                  <input type="number" min={1} value={settings.maxRetakes ?? 3} onChange={(e) => setSettings({ ...settings, maxRetakes: Number(e.target.value) })} className={inputClasses} />
                  <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Attempts allowed before counselor unlock required.</p>
                </div>
              </div>

              {/* ── Advanced Admin System Tools ── */}
              <div className="pt-10 border-t border-gray-100 dark:border-slate-800 space-y-10">
                 {/* Email Template Editor */}
                 <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                       <Mail className="w-4 h-4 text-amber-500" /> Automated Communication Templates
                    </h3>
                    <div className="flex gap-2">
                       {([
                         { id: "welcome", label: "Welcome" },
                         { id: "quizFailed", label: "Quiz Failed" },
                         { id: "formVerified", label: "Form Verified" }
                       ] as const).map(t => (
                         <button
                           key={t.id}
                           onClick={() => setActiveTemplateEvent(t.id)}
                           className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${activeTemplateEvent === t.id ? 'bg-amber-50 text-amber-600 border-amber-200' : 'text-gray-400 border-gray-100 dark:border-slate-800'}`}
                         >
                           {t.label}
                         </button>
                       ))}
                    </div>
                    <textarea
                      rows={6}
                      value={settings.emailTemplates?.[activeTemplateEvent] || ""}
                      onChange={(e) => setSettings({ ...settings, emailTemplates: { ...settings.emailTemplates, [activeTemplateEvent]: e.target.value } })}
                      className={`${inputClasses} font-mono text-xs`}
                      placeholder={`Edit template for ${activeTemplateEvent}... Use {{student_name}} as variable.`}
                    />
                 </div>

                 {/* Global AI Prompt Tweak */}
                 <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                       <Sparkles className="w-4 h-4 text-indigo-500" /> Global AI Logic Overrides
                    </h3>
                    <textarea
                      rows={4}
                      value={settings.globalAIPromptOverrides || ""}
                      onChange={(e) => setSettings({ ...settings, globalAIPromptOverrides: e.target.value })}
                      placeholder="Inject custom rules into Gemini AI prompt globally..."
                      className={`${inputClasses} border-indigo-200 dark:border-indigo-900/30 bg-indigo-50/10`}
                    />
                 </div>

                 {/* Maintenance Mode */}
                 <div className="p-8 rounded-[32px] bg-rose-50/50 dark:bg-rose-900/10 border-2 border-dashed border-rose-200 dark:border-rose-900/30 flex items-center justify-between">
                    <div className="space-y-1">
                       <h3 className="text-lg font-black text-rose-600 uppercase tracking-tighter flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" /> Maintenance Mode
                       </h3>
                       <p className="text-xs text-rose-500 font-bold">Temporarily disable student access and block logins.</p>
                    </div>
                    <button
                      onClick={() => setShowMaintenanceConfirm(true)}
                      className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${settings.maintenanceMode ? 'bg-rose-600 text-white' : 'bg-white dark:bg-[#1E293B] text-rose-600 border border-rose-200 dark:border-rose-800'}`}
                    >
                      {settings.maintenanceMode ? "Enabled - Turn Off" : "Enable System Lock"}
                    </button>
                 </div>
              </div>

              <div className="flex justify-start border-t border-gray-50 dark:border-slate-800/50 pt-6">
                <button onClick={handleSystemSave} className="px-8 py-3 bg-[#1a73e8] text-white font-black rounded-xl hover:bg-[#1557b0] transition-all shadow-md">
                  Save All System Configurations
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Add / Edit Resource Custom Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-[32px] bg-white dark:bg-[#1E293B] p-8 shadow-2xl border border-gray-200 dark:border-slate-700 relative animate-in zoom-in duration-200">
            <button onClick={() => setShowResourceModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white"><X className="w-6 h-6" /></button>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white font-google mb-6">{editResourceId ? "Edit Library Entry" : "Add New Resource"}</h3>
            <form onSubmit={handleResourceSubmit} className="space-y-5">
              <div>
                <label className={labelClasses}>Entry Title</label>
                <input type="text" required placeholder="Resource Title" value={resourceForm.title || ""} onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })} className={inputClasses} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Media Format</label>
                  <select required value={resourceForm.type || "video"} onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value as any })} className={inputClasses}>
                    <option value="video">Google Drive Video</option>
                    <option value="pdf">PDF Document</option>
                    <option value="audio">Audio drill</option>
                    <option value="doc">Template/Link</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Valid Until (Optional)</label>
                  <input
                    type="date"
                    value={resourceForm.validUntil ? new Date(resourceForm.validUntil.seconds * 1000).toISOString().split('T')[0] : ""}
                    onChange={(e) => setResourceForm({ ...resourceForm, validUntil: e.target.value ? { seconds: Math.floor(new Date(e.target.value).getTime() / 1000) } : null })}
                    className={inputClasses}
                  />
                </div>
              </div>
              <div>
                <label className={labelClasses}>Cloud Provider Link (URL)</label>
                <input type="url" required placeholder="Google Drive Link" value={resourceForm.driveUrl || ""} onChange={(e) => setResourceForm({ ...resourceForm, driveUrl: e.target.value })} className={inputClasses} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Attached Module/Pack ID</label>
                  <input type="text" placeholder="General" value={resourceForm.attachedPackId || ""} onChange={(e) => setResourceForm({ ...resourceForm, attachedPackId: e.target.value })} className={inputClasses} />
                </div>
                <div>
                  <label className={labelClasses}>Tags (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="Financial, Visa, etc."
                    value={resourceForm.tags?.join(", ") || ""}
                    onChange={(e) => setResourceForm({ ...resourceForm, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                    className={inputClasses}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowResourceModal(false)} className="px-6 py-3 text-xs font-black uppercase text-gray-500 hover:text-gray-900">Cancel</button>
                <button type="submit" className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-2xl text-xs uppercase shadow-xl">{editResourceId ? "Update" : "Save Entry"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Register User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-[32px] bg-white dark:bg-[#1E293B] p-8 shadow-2xl border border-gray-200 dark:border-slate-700 relative animate-in zoom-in duration-200">
            <button onClick={() => setShowAddUserModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white"><X className="w-6 h-6" /></button>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white font-google mb-2">Register New User</h3>
            <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-8">Creates profile in cloud database</p>
            <form onSubmit={handleCreateUser} className="space-y-5">
              <div>
                <label className={labelClasses}>Full Identity</label>
                <input type="text" required placeholder="Full Name" value={newUserForm.displayName} onChange={(e) => setNewUserForm({ ...newUserForm, displayName: e.target.value })} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Corporate / Student Email</label>
                <input type="email" required placeholder="Email Address" value={newUserForm.email} onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })} className={inputClasses} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Access Level</label>
                  <select value={newUserForm.role} onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })} className={inputClasses}>
                    <option value="Student">Student</option>
                    <option value="Counselor">Counselor</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Branch Office</label>
                  <select value={newUserForm.office} onChange={(e) => setNewUserForm({ ...newUserForm, office: e.target.value })} className={inputClasses}>
                    <option value="Lagos">Lagos</option>
                    <option value="Abuja">Abuja</option>
                    <option value="Benin">Benin</option>
                    <option value="London HQ">London HQ</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setShowAddUserModal(false)} className="px-6 py-3 text-xs font-black uppercase text-gray-500 hover:text-gray-900">Cancel</button>
                <button type="submit" disabled={isCreatingUser} className="px-8 py-3 bg-[#1a73e8] text-white font-black rounded-2xl text-xs uppercase shadow-xl disabled:opacity-50">
                  {isCreatingUser ? "Processing..." : "Create Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Confirmation Modal */}
      {showMaintenanceConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
           <div className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-[40px] p-10 space-y-8 shadow-2xl border border-rose-100 dark:border-rose-900/30 text-center animate-in zoom-in duration-200">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto">
                 <AlertCircle className="w-10 h-10 text-rose-600" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-2xl font-black text-gray-900 dark:text-white font-google uppercase">Toggle System Lock?</h3>
                 <p className="text-xs font-bold text-gray-500 uppercase leading-relaxed">
                    This will immediately {settings.maintenanceMode ? 'ENABLE' : 'DISABLE'} student access to the entire platform.
                 </p>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setShowMaintenanceConfirm(false)} className="flex-1 py-4 text-xs font-black uppercase text-gray-500">Abort</button>
                 <button
                   onClick={() => { setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode }); setShowMaintenanceConfirm(false); }}
                   className="flex-1 py-4 bg-rose-600 text-white font-black rounded-2xl text-xs uppercase shadow-xl shadow-rose-500/20"
                 >
                   Confirm Change
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* CSV Import Feedback */}
      {isImportingCSV && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-10">
           <Loader2 className="w-5 h-5 animate-spin" />
           <span className="text-xs font-black uppercase tracking-widest">Processing CSV Student Import...</span>
           <button onClick={() => setIsImportingCSV(false)} className="ml-4 p-1 hover:bg-white/20 rounded-full"><X className="w-4 h-4" /></button>
        </div>
      )}
    </AppShell>
  );
}
