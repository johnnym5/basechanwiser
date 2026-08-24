"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { LibraryResource } from "@/types/resource";
import { QuestionPack } from "@/types";
import { DRIVE_CONFIG } from "@/lib/constants/drive";
import UploadResourceModal from "@/components/library/UploadResourceModal";
import DriveVaultModal from "@/components/library/DriveVaultModal";
import {
  FileText,
  Video,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Loader2,
  Globe,
  FolderLock,
  ShieldCheck
} from "lucide-react";

export default function CounselorLibraryPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && role !== "Counselor" && role !== "Admin" && role !== "Super Admin") {
      router.push("/dashboard");
    }
  }, [role, authLoading, router]);

  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [packs, setPacks] = useState<QuestionPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const resSnap = await getDocs(query(collection(db, "library_resources"), orderBy("createdAt", "desc")));
      setResources(resSnap.docs.map(d => ({ id: d.id, ...d.data() } as LibraryResource)));

      const packSnap = await getDocs(collection(db, "question_packs"));
      setPacks(packSnap.docs.map(d => ({ id: d.id, ...d.data() } as QuestionPack)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently remove this resource from the library?")) return;
    try {
      await deleteDoc(doc(db, "library_resources", id));
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const openEdit = (res: LibraryResource) => {
    setEditId(res.id);
    setShowModal(true);
  };

  return (
    <AppShell>
      <div className="space-y-10 animate-in fade-in duration-500">

        {/* Page Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white font-google uppercase tracking-tighter">Learning Library</h1>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Manage study materials and link them to assessments.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsDriveModalOpen(true)}
              className="px-6 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white font-black rounded-full text-xs uppercase tracking-widest shadow-sm hover:scale-105 transition-all flex items-center gap-2"
            >
              <Globe className="w-4 h-4 text-blue-500" /> Drive Workspace
            </button>
            <button
              onClick={() => { setEditId(null); setShowModal(true); }}
              className="px-6 py-3 bg-[#1a73e8] text-white font-black rounded-full text-xs uppercase shadow-lg shadow-blue-500/20 flex items-center gap-2 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Resource
            </button>
          </div>
        </div>

        {/* Embedded Live Google Drive Vault Container - FIXES BLANK PAGE ISSUE */}
        <div className="space-y-4">
           <div className="flex items-center justify-between p-6 bg-slate-900/50 border border-slate-800 rounded-[32px] shadow-sm">
              <div className="flex items-center space-x-4">
                 <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                    <FolderLock className="w-6 h-6 text-indigo-400" />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">Central Resource Repository</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Encrypted enterprise document store</p>
                 </div>
              </div>
              <span className="text-[10px] font-black uppercase px-4 py-2 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4" /> Live Drive Sync
              </span>
           </div>

           {/* Live Folder View directly inside the page body */}
           <div className="w-full h-[65vh] bg-slate-950 border border-slate-800 rounded-[40px] overflow-hidden shadow-2xl relative group">
              <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-700" />
              <iframe
                src={DRIVE_CONFIG.EMBED_FOLDER_URL}
                className="w-full h-full border-0 bg-slate-950"
                title="Google Drive Live Resource Repository"
              />
           </div>
        </div>

        {/* Resource Link Records (Grid View below the embed) */}
        <div className="space-y-6 pt-10 border-t border-slate-800">
           <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Linked Resource Records</h2>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{resources.length} Meta Records</span>
           </div>

           {loading ? (
             <div className="flex justify-center p-10"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>
           ) : resources.length === 0 ? (
             <div className="p-20 text-center bg-slate-900/30 rounded-[40px] border border-dashed border-slate-800">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">No resources have been linked to modules yet.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map(res => (
                  <div key={res.id} className="bg-slate-900/50 p-6 rounded-[32px] border border-slate-800 shadow-sm space-y-4 group transition-all hover:border-indigo-500/50">
                    <div className="flex justify-between items-start">
                      <div className="p-3 rounded-2xl bg-[#0F172A] border border-slate-800">
                        {res.fileType === 'pdf' && <FileText className="w-6 h-6 text-rose-500" />}
                        {res.fileType === 'video' && <Video className="w-6 h-6 text-blue-500" />}
                        {res.fileType === 'doc' && <FileText className="w-6 h-6 text-emerald-500" />}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(res)} className="p-2 rounded-full bg-blue-900/30 text-blue-400 border border-blue-900/50 transition-colors"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(res.id)} className="p-2 rounded-full bg-rose-900/30 text-rose-400 border border-rose-900/50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white line-clamp-1 uppercase tracking-tighter">{res.title}</h3>
                      <p className="text-[10px] text-slate-500 font-bold mt-1 line-clamp-2 uppercase tracking-widest leading-relaxed">{res.description}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                       <span className="text-[9px] font-black uppercase text-[#1a73e8] bg-blue-500/10 px-2 py-1 rounded-md tracking-tighter">
                          Linked: {packs.find(p => p.id === res.linkedPackId)?.title || "None"}
                       </span>
                       <a href={res.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase text-slate-500 hover:text-white flex items-center gap-1 transition-colors tracking-widest">
                          Preview <ExternalLink className="w-3 h-3" />
                       </a>
                    </div>
                  </div>
                ))}
             </div>
           )}
        </div>

        <UploadResourceModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          editId={editId}
          initialData={editId ? resources.find(r => r.id === editId) : null}
          onSuccess={fetchData}
        />

        <DriveVaultModal
          isOpen={isDriveModalOpen}
          onClose={() => setIsDriveModalOpen(false)}
        />
      </div>
    </AppShell>
  );
}

