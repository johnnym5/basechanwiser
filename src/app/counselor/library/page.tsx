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
import {
  FileText,
  Video,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Loader2,
  Globe
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white font-google uppercase tracking-tight">Learning Library</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Manage study materials and link them to assessments.</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={DRIVE_CONFIG.FULL_WORKSPACE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white font-black rounded-full text-xs uppercase tracking-widest shadow-sm hover:scale-105 transition-all flex items-center gap-2"
            >
              <Globe className="w-4 h-4 text-blue-500" /> Drive Workspace
            </a>
            <button
              onClick={() => { setEditId(null); setShowModal(true); }}
              className="px-6 py-3 bg-[#1a73e8] text-white font-black rounded-full text-xs uppercase shadow-lg shadow-blue-500/20 flex items-center gap-2 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Resource
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map(res => (
              <div key={res.id} className="bg-white dark:bg-[#1E293B] p-6 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm space-y-4 group transition-all hover:shadow-md">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#0F172A] border border-gray-100 dark:border-slate-800">
                    {res.fileType === 'pdf' && <FileText className="w-6 h-6 text-rose-500" />}
                    {res.fileType === 'video' && <Video className="w-6 h-6 text-blue-500" />}
                    {res.fileType === 'doc' && <FileText className="w-6 h-6 text-emerald-500" />}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(res)} className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 border border-blue-100 dark:border-blue-800 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(res.id)} className="p-2 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 border border-rose-100 dark:border-rose-800 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white line-clamp-1 uppercase tracking-tighter">{res.title}</h3>
                  <p className="text-xs text-gray-500 font-bold mt-1 line-clamp-2 uppercase tracking-widest leading-relaxed">{res.description}</p>
                </div>
                <div className="pt-4 border-t border-gray-50 dark:border-slate-800/50 flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase text-[#1a73e8] bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md tracking-tighter">
                      Linked: {packs.find(p => p.id === res.linkedPackId)?.title || "None"}
                   </span>
                   <a href={res.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 flex items-center gap-1 transition-colors tracking-widest">
                      Preview <ExternalLink className="w-3 h-3" />
                   </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <UploadResourceModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          editId={editId}
          initialData={editId ? resources.find(r => r.id === editId) : null}
          onSuccess={fetchData}
        />
      </div>
    </AppShell>
  );
}

