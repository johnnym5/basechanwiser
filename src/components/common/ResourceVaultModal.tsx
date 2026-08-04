"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  Video as VideoIcon,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  ChevronRight,
  Loader2,
  ArrowLeft,
  FolderOpen,
  Link as LinkIcon,
  UploadCloud
} from "lucide-react";
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
import { db, storage } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/lib/auth/auth-context";
import { LibraryResource } from "@/types/resource";
import { QuestionPack } from "@/types";
import { useRouter } from "next/navigation";

interface ResourceVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ResourceVaultModal({ isOpen, onClose }: ResourceVaultModalProps) {
  const { user, role } = useAuth();
  const router = useRouter();

  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [packs, setPacks] = useState<QuestionPack[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<"list" | "form" | "viewer">("list");
  const [selectedResource, setSelectedResource] = useState<LibraryResource | null>(null);

  const [form, setForm] = useState<Partial<LibraryResource>>({
    title: "",
    description: "",
    fileType: "pdf",
    fileUrl: "",
    linkedPackId: ""
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resSnap = await getDocs(query(collection(db, "library_resources"), orderBy("createdAt", "desc")));
      setResources(resSnap.docs.map(d => ({ id: d.id, ...d.data() } as LibraryResource)));

      if (role === "Admin" || role === "Counselor" || role === "Super Admin") {
        const packSnap = await getDocs(collection(db, "question_packs"));
        setPacks(packSnap.docs.map(d => ({ id: d.id, ...d.data() } as QuestionPack)));
      }
    } catch (e) {
      console.error("Vault fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResource = (res: LibraryResource) => {
    setSelectedResource(res);
    setView("viewer");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      let finalFileUrl = form.fileUrl || "";

      // Handle File Upload if present
      if (file) {
        const fileRef = ref(storage, `library/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        finalFileUrl = await getDownloadURL(fileRef);
      }

      const payload = {
        ...form,
        fileUrl: finalFileUrl,
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

      setForm({ fileType: 'pdf', title: '', description: '', fileUrl: '', linkedPackId: '' });
      setFile(null);
      setEditId(null);
      setView("list");
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Error saving resource");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteDoc(doc(db, "library_resources", id));
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const openEdit = (res: LibraryResource) => {
    setForm(res);
    setEditId(res.id);
    setView("form");
  };

  const formatDriveUrl = (url: string) => {
    if (!url) return "";
    // If it's a folder link
    if (url.includes("drive.google.com") && url.includes("/folders/")) {
      const folderId = url.split("/folders/")[1].split("?")[0];
      return `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
    }
    // If it's a file link (view to preview)
    if (url.includes("drive.google.com") && url.includes("/view")) {
      return url.replace(/\/view.*$/, "/preview");
    }
    return url;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="max-w-5xl w-full h-[85vh] bg-[#1E293B] rounded-[24px] border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-[#111827]/50">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <FolderOpen className="w-5 h-5 text-blue-500" />
             </div>
             <div>
                <h2 className="text-lg font-black text-white uppercase tracking-tighter">Resource Vault</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">In-App Study Material & Guides</p>
             </div>
          </div>

          <div className="flex items-center gap-4">
             {view === "list" && (role === "Admin" || role === "Counselor" || role === "Super Admin") && (
                <button
                  onClick={() => { setEditId(null); setForm({ fileType: 'pdf' }); setView("form"); }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-2"
                >
                  <Plus className="w-3 h-3" /> Add Resource
                </button>
             )}
             <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                <X className="w-6 h-6" />
             </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#0F172A]/30">
           {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                 <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                 <p className="text-xs font-black uppercase tracking-widest">Accessing Vault...</p>
              </div>
           ) : view === "list" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {resources.length === 0 ? (
                    <div className="col-span-full py-20 text-center space-y-4">
                       <FolderOpen className="w-16 h-16 text-slate-800 mx-auto" />
                       <p className="text-slate-500 font-black uppercase tracking-widest">Vault is empty.</p>
                    </div>
                 ) : (
                    resources.map(res => (
                       <div key={res.id} onClick={() => handleOpenResource(res)} className="bg-[#1E293B] p-6 rounded-[24px] border border-slate-800 hover:border-blue-500/50 hover:bg-[#1E293B]/80 transition-all cursor-pointer group relative">
                          <div className="flex justify-between items-start mb-4">
                             <div className="p-3 rounded-2xl bg-[#0F172A] border border-slate-800">
                                {res.fileType === 'pdf' && <FileText className="w-6 h-6 text-rose-500" />}
                                {res.fileType === 'video' && <VideoIcon className="w-6 h-6 text-blue-500" />}
                                {res.fileType === 'link' && <LinkIcon className="w-6 h-6 text-indigo-500" />}
                                {res.fileType === 'doc' && <FileText className="w-6 h-6 text-emerald-500" />}
                             </div>
                             {(role === "Admin" || role === "Counselor" || role === "Super Admin") && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                   <button onClick={() => openEdit(res)} className="p-2 hover:bg-slate-700 rounded-lg text-blue-400"><Edit3 className="w-4 h-4" /></button>
                                   <button onClick={() => handleDelete(res.id)} className="p-2 hover:bg-slate-700 rounded-lg text-rose-400"><Trash2 className="w-4 h-4" /></button>
                                </div>
                             )}
                          </div>
                          <h3 className="text-sm font-black text-white uppercase tracking-tighter mb-1 line-clamp-1">{res.title}</h3>
                          <p className="text-[10px] text-slate-500 font-bold line-clamp-2 leading-relaxed">{res.description}</p>
                          <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                             <span className="text-[9px] font-black uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">{res.fileType}</span>
                             <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-blue-500 transition-colors" />
                          </div>
                       </div>
                    ))
                 )}
              </div>
           ) : view === "form" ? (
              <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                 <button onClick={() => setView("list")} className="flex items-center gap-2 text-slate-500 hover:text-white font-black uppercase text-[10px] transition-all mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to Vault
                 </button>

                 <div className="space-y-1">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">{editId ? "Update Resource" : "Add New Material"}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Fill in the details to publish to the vault.</p>
                 </div>

                 <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Resource Title</label>
                          <input required value={form.title || ""} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-[#0F172A] border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none border" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">File Type</label>
                          <select value={form.fileType} onChange={e => setForm({...form, fileType: e.target.value as any})} className="w-full bg-[#0F172A] border-slate-800 rounded-xl px-4 py-3 text-sm font-black text-white focus:ring-2 focus:ring-blue-500 focus:outline-none border">
                             <option value="pdf">PDF Document</option>
                             <option value="video">Video (MP4/WebM)</option>
                             <option value="link">Google Drive Link</option>
                             <option value="doc">Word/Template</option>
                          </select>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Option 1: Upload from Manager</label>
                          <div className="relative group">
                             <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${file ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-[#0F172A] hover:border-slate-700'}`}>
                                <UploadCloud className={`w-8 h-8 mx-auto mb-2 ${file ? 'text-blue-500' : 'text-slate-600'}`} />
                                <p className="text-xs font-bold text-slate-400">{file ? file.name : "Drop file here or click to browse"}</p>
                                <input
                                  type="file"
                                  onChange={e => setFile(e.target.files?.[0] || null)}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-4">
                          <div className="h-px bg-slate-800 flex-1" />
                          <span className="text-[10px] font-black text-slate-600 uppercase">OR</span>
                          <div className="h-px bg-slate-800 flex-1" />
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Option 2: Material URL / Drive Link</label>
                          <input value={form.fileUrl || ""} onChange={e => { setForm({...form, fileUrl: e.target.value}); if(e.target.value) setFile(null); }} placeholder="https://..." className="w-full bg-[#0F172A] border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none border" />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Short Description</label>
                       <textarea rows={3} value={form.description || ""} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-[#0F172A] border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none border" />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Link to Assessment (Optional)</label>
                       <select value={form.linkedPackId} onChange={e => setForm({...form, linkedPackId: e.target.value})} className="w-full bg-[#0F172A] border-slate-800 rounded-xl px-4 py-3 text-sm font-black text-white focus:ring-2 focus:ring-blue-500 focus:outline-none border">
                          <option value="">Select a Quiz Pack...</option>
                          {packs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                       </select>
                    </div>

                    <button disabled={isSubmitting} className="w-full py-4 bg-blue-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50">
                       {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editId ? "Update Resource" : "Publish to Vault")}
                    </button>
                 </form>
              </div>
           ) : (
              /* Viewer View */
              <div className="h-full flex flex-col animate-in fade-in duration-500">
                 <div className="flex items-center justify-between mb-6">
                    <button onClick={() => setView("list")} className="flex items-center gap-2 text-slate-500 hover:text-white font-black uppercase text-[10px] transition-all">
                       <ArrowLeft className="w-4 h-4" /> Back to List
                    </button>
                    <div className="text-right">
                       <h3 className="text-sm font-black text-white uppercase tracking-tighter">{selectedResource?.title}</h3>
                       <p className="text-[9px] text-slate-500 font-bold uppercase">{selectedResource?.fileType} • {selectedResource?.description}</p>
                    </div>
                 </div>

                 <div className="flex-1 bg-white rounded-xl overflow-hidden relative border border-slate-700">
                    {selectedResource?.fileType === 'pdf' && (
                       <iframe src={`${selectedResource.fileUrl}#toolbar=0`} className="w-full h-full border-0"></iframe>
                    )}
                    {selectedResource?.fileType === 'video' && (
                       <div className="w-full h-full bg-black flex items-center justify-center">
                          <video controls className="max-w-full max-h-full">
                             <source src={selectedResource.fileUrl} type="video/mp4" />
                          </video>
                       </div>
                    )}
                    {selectedResource?.fileType === 'link' && (
                       <iframe src={formatDriveUrl(selectedResource.fileUrl)} className="w-full h-full border-0"></iframe>
                    )}
                    {selectedResource?.fileType === 'doc' && (
                       <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(selectedResource.fileUrl)}&embedded=true`} className="w-full h-full border-0"></iframe>
                    )}
                 </div>

                 {selectedResource?.linkedPackId && (
                    <div className="mt-6 flex justify-center">
                       <button
                         onClick={() => { onClose(); router.push(`/learning/detail?id=${selectedResource.linkedPackId}`); }}
                         className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-full text-xs uppercase tracking-widest shadow-2xl shadow-emerald-500/20 flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
                       >
                          <CheckCircle2 className="w-4 h-4" /> Proceed to Linked Assessment <ChevronRight className="w-4 h-4" />
                       </button>
                    </div>
                 )}
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
