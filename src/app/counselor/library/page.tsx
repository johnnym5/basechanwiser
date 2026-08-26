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
  orderBy,
  writeBatch
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { LibraryResource } from "@/types/resource";
import { QuestionPack } from "@/types";
import UploadResourceModal from "@/components/library/UploadResourceModal";
import AssignStudentsModal from "@/components/library/AssignStudentsModal";
import {
  FileText,
  Video,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Loader2,
  ShieldCheck,
  CheckSquare,
  Square,
  Users,
  Eye,
  EyeOff,
  Link2,
  MoreVertical,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CounselorLibraryPage() {
  const { role, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && role !== "Counselor" && role !== "Admin" && role !== "Super Admin") {
      router.push("/dashboard");
    }
  }, [role, authLoading, router]);

  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [packs, setPacks] = useState<QuestionPack[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
      setSelectedIds(prev => prev.filter(sid => sid !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Permanently remove ${selectedIds.length} selected resources?`)) return;
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(db, "library_resources", id));
      });
      await batch.commit();
      fetchData();
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
      alert("Failed to delete selected resources.");
    }
  };

  const handleBulkTogglePublic = async (isPublic: boolean) => {
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.update(doc(db, "library_resources", id), { isPublic });
      });
      await batch.commit();
      fetchData();
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === resources.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(resources.map(r => r.id));
    }
  };

  const openEdit = (res: LibraryResource) => {
    setEditId(res.id);
    setShowUploadModal(true);
  };

  return (
    <AppShell>
      <div className="space-y-10 animate-in fade-in duration-500">

        {/* Page Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white font-google uppercase tracking-tighter">Mission Control: Library</h1>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Manage, update, and deploy learning materials to scholars.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {resources.length > 0 && (
               <button
                 onClick={selectAll}
                 className="px-6 py-4 bg-slate-800 text-slate-400 font-black rounded-full text-[10px] uppercase tracking-widest border border-slate-700 transition-all active:scale-95"
               >
                 {selectedIds.length === resources.length ? "Deselect All" : "Select All"}
               </button>
            )}
            <button
              onClick={() => { setEditId(null); setShowUploadModal(true); }}
              className="px-8 py-4 bg-indigo-600 text-white font-black rounded-full text-xs uppercase shadow-lg shadow-indigo-500/20 flex items-center gap-2 active:scale-95 transition-all tracking-[0.2em]"
            >
              <Plus className="w-4 h-4" /> Add Asset
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>
        ) : (
          <div className="space-y-6 pb-32">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Resource Archive</h2>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{resources.length} Meta Records</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-slate-900/30 rounded-[40px] border border-dashed border-slate-800">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">No assets have been deployed yet.</p>
                </div>
              ) : resources.map(res => {
                const isSelected = selectedIds.includes(res.id);
                return (
                  <div
                    key={res.id}
                    onClick={() => toggleSelection(res.id)}
                    className={`bg-slate-900/50 p-8 rounded-[32px] border-2 shadow-sm space-y-5 group transition-all relative cursor-pointer ${
                      isSelected ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="p-3 rounded-2xl bg-[#0F172A] border border-slate-800 transition-all group-hover:scale-110">
                        {res.fileType === 'pdf' && <FileText className="w-8 h-8 text-rose-500" />}
                        {res.fileType === 'video' && <Video className="w-8 h-8 text-blue-500" />}
                        {res.fileType === 'doc' && <FileText className="w-8 h-8 text-emerald-500" />}
                        {res.fileType === 'link' && <Link2 className="w-8 h-8 text-indigo-500" />}
                      </div>

                      <div className="flex items-center gap-2">
                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEdit(res); }}
                              className="p-2 rounded-xl bg-blue-900/30 text-blue-400 border border-blue-900/50 transition-colors hover:bg-blue-600 hover:text-white"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(res.id); }}
                              className="p-2 rounded-xl bg-rose-900/30 text-rose-400 border border-rose-900/50 transition-colors hover:bg-rose-600 hover:text-white"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                         </div>
                         <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-700 bg-slate-950'}`}>
                           {isSelected && <CheckSquare className="w-4 h-4" />}
                         </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                         <h3 className="text-lg font-black text-white line-clamp-1 uppercase tracking-tighter">{res.title}</h3>
                         {res.isPublic ? (
                            <span title="Publicly Visible">
                              <Eye className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            </span>
                         ) : (
                            <span title="Restricted Visibility">
                              <EyeOff className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            </span>
                         )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold mt-1 line-clamp-2 uppercase tracking-widest leading-relaxed">{res.description}</p>
                    </div>

                    <div className="pt-5 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg tracking-tighter border border-indigo-500/20">
                          {packs.find(p => p.id === res.linkedPackId)?.title || "Global Resource"}
                      </span>
                      <a
                        href={res.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] font-black uppercase text-slate-500 hover:text-white flex items-center gap-1 transition-colors tracking-widest"
                      >
                          Preview <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STICKY BULK ACTIONS TOOLBAR ── */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 border border-slate-800 px-8 py-5 rounded-[32px] shadow-2xl flex items-center gap-8 min-w-[600px]"
            >
              <div className="flex items-center gap-4 pr-8 border-r border-slate-800">
                 <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/30">
                    {selectedIds.length}
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-white tracking-widest leading-none">Assets Selected</span>
                    <button onClick={() => setSelectedIds([])} className="text-[8px] font-bold text-slate-500 uppercase hover:text-white text-left mt-1">Clear Selection</button>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <button
                   onClick={() => setShowAssignModal(true)}
                   className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-500 transition-all active:scale-95"
                 >
                    <Users className="w-3.5 h-3.5" /> Assign Scholars
                 </button>

                 <div className="h-8 w-px bg-slate-800 mx-2" />

                 <button
                    onClick={() => handleBulkTogglePublic(true)}
                    className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"
                    title="Make Public"
                 >
                    <Eye className="w-4 h-4" />
                 </button>
                 <button
                    onClick={() => handleBulkTogglePublic(false)}
                    className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-white transition-all"
                    title="Restrict Visibility"
                 >
                    <EyeOff className="w-4 h-4" />
                 </button>
                 <button
                    onClick={handleBulkDelete}
                    className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all ml-2"
                    title="Bulk Delete"
                 >
                    <Trash2 className="w-4 h-4" />
                 </button>
              </div>

              <button onClick={() => setSelectedIds([])} className="ml-auto p-2 text-slate-500 hover:text-white">
                <X size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <UploadResourceModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          editId={editId}
          initialData={editId ? resources.find(r => r.id === editId) : null}
          onSuccess={fetchData}
        />

        <AssignStudentsModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          resourceIds={selectedIds}
          onSuccess={fetchData}
        />
      </div>
    </AppShell>
  );
}
