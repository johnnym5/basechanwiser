"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { PackField, StudentPackData, PackFile } from "@/types/pack";
import { formatDriveEmbedUrl } from "@/lib/utils/drive-helpers";
import { Loader2, FileCheck, Send, Download, Trash2, Eye, ShieldCheck, ChevronRight, HelpCircle, Link2 } from "lucide-react";

export default function InterviewPackForm() {
  const { userId } = useAuth();
  const [fields, setFields] = useState<PackField[]>([]);
  const [data, setData] = useState<StudentPackData>({});
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [inputUrls, setInputUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const fetchData = async () => {
    // 1. Fetch config (fields)
    const configSnap = await getDoc(doc(db, "interview_pack_configs", "default"));
    if (configSnap.exists()) {
      setFields(configSnap.data().fields as PackField[]);
    }

    // 2. Fetch student data
    const dataSnap = await getDoc(doc(db, "Users", userId!, "interview_pack", "data"));
    if (dataSnap.exists()) {
      setData(dataSnap.data() as StudentPackData);
    }
    setLoading(false);
  };

  const handleLinkUpload = async (fieldId: string) => {
    const url = inputUrls[fieldId];
    if (!url || !userId) return;

    setIsProcessing(fieldId);
    try {
      const finalUrl = formatDriveEmbedUrl(url);
      const fileData: PackFile = {
        fileUrl: finalUrl,
        fileName: url.split('/').pop()?.split('?')[0] || "Linked Asset",
        uploadedAt: serverTimestamp()
      };
      const newData = { ...data, [fieldId]: fileData };
      setData(newData);
      // Auto-save link to firestore
      await setDoc(doc(db, "Users", userId!, "interview_pack", "data"), newData, { merge: true });
      setInputUrls({ ...inputUrls, [fieldId]: "" });
    } catch (e) {
      console.error(e);
      alert("Linking failed.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRemoveLink = async (fieldId: string) => {
    const newData = { ...data };
    delete newData[fieldId];
    setData(newData);
    await setDoc(doc(db, "Users", userId!, "interview_pack", "data"), newData);
  };

  const handleTextChange = (fieldId: string, value: string) => {
    setData({ ...data, [fieldId]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    await setDoc(doc(db, "Users", userId!, "interview_pack", "data"), {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true });
    setSaving(false);
    alert("Dossier saved successfully!");
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  const categories = Array.from(new Set(fields.map(f => f.category)));

  return (
    <div className="space-y-12 pb-32">
      <div className="bg-white dark:bg-slate-800 rounded-[40px] border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">UKVI Credibility Dossier</h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" /> Compliance Verified Storage
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <FileCheck size={16} />}
                Save Progress
              </button>
              <button
                onClick={() => window.print()}
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                Download as PDF
              </button>
          </div>
        </div>

        <div className="p-8 md:p-10 space-y-10">
          {categories.map((cat) => (
            <div key={cat} className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 border-b border-blue-100 dark:border-blue-900/30 pb-2">{cat}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {fields.filter(f => f.category === cat).map((field) => {
                  const val = data[field.id];
                  return (
                    <div key={field.id} className="space-y-3">
                      <label className="text-sm font-bold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                        {field.label}
                        {field.required && <span className="text-rose-500">*</span>}
                      </label>

                      {field.type === 'file' ? (
                        <div className="space-y-2">
                          {val && typeof val === 'object' ? (
                            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl group transition-all">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
                                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 truncate">{(val as PackFile).fileName}</span>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a href={(val as PackFile).fileUrl} target="_blank" rel="noreferrer" className="p-2 text-blue-500 hover:bg-white dark:hover:bg-slate-800 rounded-lg">
                                  <Eye size={16} />
                                </a>
                                <button onClick={() => handleRemoveLink(field.id)} className="p-2 text-rose-500 hover:bg-white dark:hover:bg-slate-800 rounded-lg">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                 <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                 <input
                                   type="url"
                                   placeholder="Paste Google Drive URL..."
                                   value={inputUrls[field.id] || ""}
                                   onChange={e => setInputUrls({ ...inputUrls, [field.id]: e.target.value })}
                                   className="w-full bg-gray-50 dark:bg-slate-900 border-none rounded-2xl pl-11 pr-4 py-4 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                                 />
                              </div>
                              <button
                                onClick={() => handleLinkUpload(field.id)}
                                disabled={!inputUrls[field.id] || isProcessing === field.id}
                                className="bg-indigo-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all disabled:opacity-30"
                              >
                                {isProcessing === field.id ? "..." : "Link"}
                              </button>
                            </div>
                          )}
                          <p className="text-[9px] text-slate-500 ml-1 italic">Binary upload decommissioned. Link from Google Drive instead.</p>
                        </div>
                      ) : field.type === 'select' ? (
                        <select
                          value={typeof val === 'string' ? val : ""}
                          onChange={(e) => handleTextChange(field.id, e.target.value)}
                          className="w-full bg-gray-50 dark:bg-slate-900 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select an option...</option>
                          {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'long_text' ? (
                        <textarea
                          value={typeof val === 'string' ? val : ""}
                          onChange={(e) => handleTextChange(field.id, e.target.value)}
                          rows={4}
                          placeholder="Provide detailed information..."
                          className="w-full bg-gray-50 dark:bg-slate-900 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      ) : (
                        <input
                          type="text"
                          value={typeof val === 'string' ? val : ""}
                          onChange={(e) => handleTextChange(field.id, e.target.value)}
                          placeholder="Enter details..."
                          className="w-full bg-gray-50 dark:bg-slate-900 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Save Reminder */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
        <div className="bg-gray-900/90 backdrop-blur-md text-white p-6 rounded-[32px] shadow-2xl flex items-center justify-between border border-white/10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center"><HelpCircle size={20} /></div>
             <div>
                <p className="text-xs font-black uppercase tracking-widest text-blue-300">Form Status</p>
                <p className="text-[10px] font-bold text-gray-400">All data synced to compliance cloud.</p>
             </div>
          </div>
          <button
            onClick={handleSave}
            className="bg-white text-gray-900 px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
          >
            Sync Data
          </button>
        </div>
      </div>
    </div>
  );
}
