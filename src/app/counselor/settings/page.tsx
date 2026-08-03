"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Resource, SystemSettings } from "@/types/resource";
import { Settings, Video, FileText, Music, ExternalLink, Trash2, Edit, Plus, X } from "lucide-react";

function Tab({ isActive, label, onClick }: { isActive: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`px-4 py-2.5 rounded-t-lg font-medium text-sm transition-colors ${
        isActive
          ? "bg-white dark:bg-gray-800 text-[#1a73e8] border-b-2 border-[#1a73e8]"
          : "bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default function SettingsPage() {
  const { user, userProfile, role } = useAuth();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [settings, setSettings] = useState<SystemSettings>({});
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resourceForm, setResourceForm] = useState<Partial<Resource>>({});
  const [editResourceId, setEditResourceId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
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
            addedBy: data.addedBy || "",
            authorName: data.authorName || "",
            createdAt: data.createdAt,
          });
        });
        setResources(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const [profileInfo, setProfileInfo] = useState({
    name: userProfile?.displayName || "",
    email: userProfile?.email || "",
    office: userProfile?.office || "",
    availability: "",
    notifyInterview: false,
    notifyFail: false,
    dailySummary: false,
  });

  const handleProfileSave = async () => {
    if (!user) return;
    const userRef = doc(db, "Users", user.uid);
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

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("drive.google.com") && url.includes("/view")) {
      return url.replace(/\/view.*$/, "/preview");
    }
    return url;
  };

  const handleResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const driveUrl = resourceForm.driveUrl || "";
    const embedUrl = getEmbedUrl(driveUrl);

    const payload = {
      title: resourceForm.title || "Untitled",
      type: (resourceForm.type as any) || "video",
      driveUrl,
      embedUrl,
      attachedPackId: resourceForm.attachedPackId || "",
      addedBy: user.uid,
      authorName: userProfile?.displayName || "Staff",
      createdAt: serverTimestamp(),
    };

    if (editResourceId) {
      const docRef = doc(db, "resources", editResourceId);
      await updateDoc(docRef, payload);
    } else {
      await addDoc(collection(db, "resources"), payload);
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

  const [staffList, setStaffList] = useState<any[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState<string>("All");
  const [userSearchTerm, setUserSearchTerm] = useState<string>("");
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [newUserForm, setNewUserForm] = useState({ displayName: "", email: "", role: "Counselor", office: "Lagos" });
  const [isCreatingUser, setIsCreatingUser] = useState<boolean>(false);

  const fetchStaff = async () => {
    const staffSnap = await getDocs(collection(db, "Users"));
    const list: any[] = [];
    staffSnap.forEach((d) => {
      const data = d.data() as any;
      list.push({ uid: d.id, ...data });
    });
    setStaffList(list);
  };

  useEffect(() => {
    if (role === "Admin") fetchStaff();
  }, [role]);

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
      // Create user entry in Firestore Users collection
      const dummyUid = `user_created_${Date.now()}`;
      await setDoc(doc(db, "Users", dummyUid), {
        uid: dummyUid,
        displayName: newUserForm.displayName,
        email: newUserForm.email,
        role: newUserForm.role,
        office: newUserForm.office,
        suspended: false,
        createdAt: serverTimestamp(),
      });

      alert(`User profile for ${newUserForm.displayName} (${newUserForm.role}) created successfully!`);
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

  if (loading) return <div className="p-8 text-gray-500 dark:text-gray-400">Loading Settings...</div>;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-4">
          <Settings className="w-8 h-8 text-[#1a73e8]" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings & Resource Manager</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage staff profile, resource library, users, and system defaults</p>
          </div>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700 gap-1 overflow-x-auto pb-px">
          {[
            { label: "Profile & Preferences", idx: 0, adminOnly: false },
            { label: "Resource Library", idx: 1, adminOnly: false },
            { label: "User Management", idx: 2, adminOnly: true },
            { label: "System & Compliance", idx: 3, adminOnly: true },
          ]
            .filter((tab) => !tab.adminOnly || role === "Admin")
            .map((tab) => (
              <Tab key={tab.label} label={tab.label} isActive={activeTab === tab.idx} onClick={() => setActiveTab(tab.idx)} />
            ))}
        </div>

        <div className="pt-4">
          {activeTab === 0 && (
            <section className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Staff Profile & Preferences</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                  <input
                    type="text"
                    value={profileInfo.name}
                    onChange={(e) => setProfileInfo({ ...profileInfo, name: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Staff Email</label>
                  <input
                    type="email"
                    value={profileInfo.email}
                    onChange={(e) => setProfileInfo({ ...profileInfo, email: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Designated Office Location</label>
                  <select
                    value={profileInfo.office}
                    onChange={(e) => setProfileInfo({ ...profileInfo, office: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select Office</option>
                    {(settings.offices || ["Abuja", "Lagos", "Benin"]).map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Interview Availability URL</label>
                  <input
                    type="url"
                    placeholder="https://calendar.google.com/..."
                    value={profileInfo.availability}
                    onChange={(e) => setProfileInfo({ ...profileInfo, availability: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Notification Preferences</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileInfo.notifyInterview}
                      onChange={(e) => setProfileInfo({ ...profileInfo, notifyInterview: e.target.checked })}
                      className="rounded text-[#1a73e8] focus:ring-[#1a73e8] h-4 w-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Email notification when a student submits an Interview Pack</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileInfo.notifyFail}
                      onChange={(e) => setProfileInfo({ ...profileInfo, notifyFail: e.target.checked })}
                      className="rounded text-[#1a73e8] focus:ring-[#1a73e8] h-4 w-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Notification when a student fails a quiz retake (&lt;80%)</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileInfo.dailySummary}
                      onChange={(e) => setProfileInfo({ ...profileInfo, dailySummary: e.target.checked })}
                      className="rounded text-[#1a73e8] focus:ring-[#1a73e8] h-4 w-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Daily email summary of assigned students</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleProfileSave}
                className="px-5 py-2.5 bg-[#1a73e8] text-white font-medium rounded-lg hover:bg-[#1557b0] transition-colors shadow-sm"
              >
                Save Preferences
              </button>
            </section>
          )}

          {activeTab === 1 && (
            <section className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Resource Library & Google Drive Vault</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Attach video lessons, PDFs, and prep documents for student access</p>
                </div>
                <button
                  onClick={() => {
                    setShowResourceModal(true);
                    setEditResourceId(null);
                    setResourceForm({});
                  }}
                  className="px-4 py-2 bg-[#1a73e8] text-white font-medium rounded-lg hover:bg-[#1557b0] transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Resource
                </button>
              </div>

              {role === "Admin" && (
                <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-lg border border-blue-200 dark:border-blue-800 space-y-2">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">Global Google Drive Folder URL (Admin)</h3>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://drive.google.com/drive/folders/..."
                      value={settings.globalDriveFolderUrl || ""}
                      onChange={(e) => setSettings({ ...settings, globalDriveFolderUrl: e.target.value })}
                      className="flex-1 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
                    />
                    <button
                      onClick={handleSystemSave}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                    >
                      Save Link
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-750 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Attached Pack</th>
                      <th className="px-4 py-3">Added By</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {resources.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                          No resources added yet. Click Add Resource to attach links.
                        </td>
                      </tr>
                    ) : (
                      resources.map((res) => (
                        <tr key={res.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 capitalize">
                              {res.type === "video" && <Video className="w-3.5 h-3.5 text-red-500" />}
                              {res.type === "pdf" && <FileText className="w-3.5 h-3.5 text-blue-500" />}
                              {res.type === "audio" && <Music className="w-3.5 h-3.5 text-purple-500" />}
                              {res.type === "doc" && <ExternalLink className="w-3.5 h-3.5 text-green-500" />}
                              {res.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            <a href={res.driveUrl} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                              {res.title}
                              <ExternalLink className="w-3 h-3 text-gray-400" />
                            </a>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {res.attachedPackId || <span className="italic text-gray-400">General</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{res.authorName || "Staff"}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap space-x-3">
                            <button onClick={() => handleEditResource(res)} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center gap-1">
                              <Edit className="w-3 h-3" /> Edit
                            </button>
                            <button onClick={() => handleDeleteResource(res.id)} className="text-xs text-rose-600 dark:text-rose-400 font-medium hover:underline inline-flex items-center gap-1">
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 2 && role === "Admin" && (
            <section className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">User Management & Staff Directory</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Manage roles, staff accounts, students, and account statuses.</p>
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" /> Add / Register User
                </button>
              </div>

              {/* User Type Filter Tabs & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {["All", "Counselor", "Admin", "Student"].map((filterRole) => (
                    <button
                      key={filterRole}
                      onClick={() => setUserRoleFilter(filterRole)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        userRoleFilter === filterRole
                          ? "bg-[#1a73e8] text-white border-[#1a73e8] shadow-xs"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {filterRole === "All" ? "All Users" : `${filterRole}s`}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full sm:w-64 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full px-4 py-1.5 text-xs text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-[#1a73e8]"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-750 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredStaffList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                          No users found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredStaffList.map((staff) => (
                        <tr key={staff.uid} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            {staff.displayName || "Unnamed User"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{staff.email}</td>
                          <td className="px-4 py-3 text-sm">
                            <select
                              value={staff.role || "Student"}
                              onChange={(e) => handleRoleChange(staff.uid, e.target.value)}
                              className="text-xs font-bold rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1 text-gray-900 dark:text-gray-100"
                            >
                              <option value="Student">Student</option>
                              <option value="Counselor">Counselor</option>
                              <option value="Admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                staff.suspended
                                  ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                                  : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                              }`}
                            >
                              {staff.suspended ? "Suspended" : "Active"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-3">
                            <button
                              onClick={() => handleToggleSuspend(staff.uid, staff.suspended)}
                              className={`text-xs font-semibold hover:underline ${
                                staff.suspended ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {staff.suspended ? "Unsuspend" : "Suspend"}
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(staff.uid)}
                              className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 3 && role === "Admin" && (
            <section className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">System & Compliance Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Quiz Pass Mark (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.defaultPassMark ?? 80}
                    onChange={(e) => setSettings({ ...settings, defaultPassMark: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Regional Branch Offices (comma separated)</label>
                  <input
                    type="text"
                    placeholder="Abuja, Lagos, Benin"
                    value={settings.offices?.join(", ") || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        offices: e.target.value.split(",").map((o) => o.trim()).filter(Boolean),
                      })
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <button
                onClick={handleSystemSave}
                className="px-5 py-2.5 bg-[#1a73e8] text-white font-medium rounded-lg hover:bg-[#1557b0] transition-colors shadow-sm"
              >
                Save System Configuration
              </button>
            </section>
          )}
        </div>
      </div>

      {/* Add / Edit Resource Custom Modal (No HeadlessUI dependency) */}
      {showResourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl border border-gray-200 dark:border-gray-700 relative">
            <button
              onClick={() => setShowResourceModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {editResourceId ? "Edit Resource" : "Add New Google Drive Resource"}
            </h3>
            <form onSubmit={handleResourceSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Resource Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UKVI Credibility Interview Video Guide 2026"
                  value={resourceForm.title || ""}
                  onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Resource Type</label>
                <select
                  required
                  value={resourceForm.type || "video"}
                  onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value as any })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
                >
                  <option value="video">Video (Google Drive)</option>
                  <option value="pdf">Document / PDF</option>
                  <option value="audio">Audio Drill</option>
                  <option value="doc">External Template</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Google Drive Link (URL)</label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/file/d/..."
                  value={resourceForm.driveUrl || ""}
                  onChange={(e) => setResourceForm({ ...resourceForm, driveUrl: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Attach to Module / Pack ID (Optional)</label>
                <input
                  type="text"
                  placeholder="Leave blank for general resource"
                  value={resourceForm.attachedPackId || ""}
                  onChange={(e) => setResourceForm({ ...resourceForm, attachedPackId: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResourceModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1a73e8] text-white text-sm font-medium rounded-lg hover:bg-[#1557b0] shadow-sm"
                >
                  {editResourceId ? "Update Resource" : "Save Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add / Register User Modal ─────────────────────────── */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl border border-gray-200 dark:border-gray-700 relative">
            <button
              onClick={() => setShowAddUserModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#1a73e8]" /> Add / Register New User
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Creates a user profile in the database. The user can then sign in via Google and their account will be linked automatically.
            </p>
            <form onSubmit={handleCreateUser} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Johnmary Egbase"
                  value={newUserForm.displayName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, displayName: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#1a73e8]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@basechan.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#1a73e8]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                  >
                    <option value="Student">Student</option>
                    <option value="Counselor">Counselor</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Office</label>
                  <select
                    value={newUserForm.office}
                    onChange={(e) => setNewUserForm({ ...newUserForm, office: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                  >
                    <option value="Lagos">Lagos</option>
                    <option value="Abuja">Abuja</option>
                    <option value="Benin">Benin</option>
                    <option value="London HQ">London HQ</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-5 py-2 bg-[#1a73e8] text-white text-sm font-bold rounded-lg hover:bg-[#1557b0] shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isCreatingUser ? "Creating..." : "Create User Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}