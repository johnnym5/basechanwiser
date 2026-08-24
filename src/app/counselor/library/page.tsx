"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase/config";
import { LibraryResource } from "@/types/resource";
import { QuestionPack } from "@/types";
import { DRIVE_CONFIG, getEmbeddableDriveUrl } from "@/lib/constants/drive";
import {
  FileText,
  Video,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Loader2,
  X,
  UploadCloud,
  Globe,
  Link as LinkIcon
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setResourceForm] = useState<Partial<LibraryResource>>({
    title: "",
    description: "",
    fileType: "pdf",
    linkedPackId: ""
  });
  const [file, setFile] = useState<File | null>(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      let fileUrl = form.fileUrl || "";

      // 1. Handle File Upload to Firebase (Supplement)
      if (file) {
        const fileRef = ref(storage, `library/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        fileUrl = await getDownloadURL(fileRef);
      }

      // 2. Handle Google Drive Link (Transform if present)
      if (fileUrl.includes("drive.google.com")) {
        fileUrl = getEmbeddableDriveUrl(fileUrl);
      }

      const payload = {
        title: form.title,
        description: form.description,
        fileType: form.fileType,
        fileUrl,
        linkedPackId: form.linkedPackId,
        updatedAt: serverTimestamp(),
        createdBy: user.uid
      };

      if (editId) {
        await updateDoc(doc(db, "library_resources", editId), payload);
      } else {
        await addDoc(collection(db, "library_resources"), {
          ...payload,
          createdAt: serverTimestamp()
        });
      }

      setShowModal(false);
      setResourceForm({ fileType: 'pdf' });
      setFile(null);
      setEditId(null);
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Error saving resource");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, url: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteDoc(doc(db, "library_resources", id));
      if (url.includes("firebasestorage")) {
        try {
          const fileRef = ref(storage, url);
          await deleteObject(fileRef);
        } catch (e) { console.warn("Storage delete failed", e); }
      }
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const openEdit = (res: LibraryResource) => {
    setResourceForm(res);
    setEditId(res.id);
    setFile(null);
    setShowModal(true);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white font-google uppercase">Learning Library</h1>
            <p className="text-xs text-gray-500 font-bold">Manage study materials and link them to assessments.</p>
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
              onClick={() => { setEditId(null); setResourceForm({ fileType: 'pdf' }); setFile(null); setShowModal(true); }}
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
                    <button onClick={() => openEdit(res)} className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 border border-blue-100 dark:border-blue-800"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(res.id, res.fileUrl)} className="p-2 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 border border-rose-100 dark:border-rose-800"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white line-clamp-1 uppercase tracking-tighter">{res.title}</h3>
                  <p className="text-xs text-gray-500 font-bold mt-1 line-clamp-2">{res.description}</p>
                </div>
                <div className="pt-4 border-t border-gray-50 dark:border-slate-800/50 flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase text-[#1a73e8] bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                      Linked: {packs.find(p => p.id === res.linkedPackId)?.title || "None"}
                   </span>
                   <a href={res.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 flex items-center gap-1">
                      Preview <ExternalLink className="w-3 h-3" />
                   </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="bg-white dark:bg-[#1E293B] w-full max-w-lg rounded-[40px] p-8 shadow-2xl border border-gray-100 dark:border-slate-800 animate-in zoom-in duration-200">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{editId ? "Update Resource" : "Upload Learning Material"}</h3>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"><X className="w-6 h-6" /></button>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Resource Title</label>
                    <input required value={form.title || ""} onChange={e => setResourceForm({...form, title: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0F172A] border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-[#1a73e8]" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Short Description</label>
                    <textarea rows={3} value={form.description || ""} onChange={e => setResourceForm({...form, description: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0F172A] border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-[#1a73e8]" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">File Type</label>
                       <select value={form.fileType} onChange={e => setResourceForm({...form, fileType: e.target.value as any})} className="w-full bg-gray-50 dark:bg-[#0F172A] border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-[#1a73e8]">
                          <option value="pdf">PDF Document</option>
                          <option value="video">Video (MP4)</option>
                          <option value="doc">Word/Link</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Link Assessment Pack</label>
                       <select required value={form.linkedPackId} onChange={e => setResourceForm({...form, linkedPackId: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0F172A] border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-[#1a73e8]">
                          <option value="">Select a Quiz Pack</option>
                          {packs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                       </select>
                    </div>
                  </div>

                  <div className="relative group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Direct File Link / Drive URL</label>
                    <div className="relative">
                       <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                       <input
                         value={form.fileUrl || ""}
                         onChange={e => setResourceForm({...form, fileUrl: e.target.value})}
                         placeholder="Paste Drive URL or direct link..."
                         className="w-full bg-gray-50 dark:bg-[#0F172A] border-none rounded-2xl pl-11 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#1a73e8]"
                       />
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1 italic">Automatically transforms Google Drive links into embedded previews.</p>
                  </div>

                  <div className="relative group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">OR: Upload to Storage</label>
                    <div className="border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-3xl p-6 text-center group-hover:border-[#1a73e8] transition-all relative overflow-hidden">
                       <UploadCloud className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                       <p className="text-xs font-bold text-gray-500">{file ? file.name : "Drop file here or click to browse"}</p>
                       <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    {editId && !file && !form.fileUrl && <p className="text-[9px] font-bold text-blue-500 mt-1 uppercase">Leave blank to keep existing file</p>}
                  </div>

                  <button
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#1a73e8] text-white font-black rounded-3xl text-sm uppercase shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editId ? "Update Library Item" : "Publish to Library")}
                  </button>
               </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
