"use client";

import React, { useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import { Palette, Upload, Plus, Trash2, Save, LayoutGrid, CheckCircle2 } from "lucide-react";
import { storage } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { RubricCriteria } from "@/types/settings";

export default function BrandingTab() {
  const { globalSettings, updateGlobalSettings } = useSettings();
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    const logoRef = ref(storage, `branding/logo_${Date.now()}`);
    await uploadBytes(logoRef, file);
    const url = await getDownloadURL(logoRef);
    await updateGlobalSettings({ logoUrl: url });
    setUploading(false);
  };

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
    <div className="space-y-8">
      {/* Brand Theme */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-8">
           <Palette className="text-pink-500" size={24} />
           <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">B2B White-Labeling</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-400 block">Primary Brand Color</label>
              <div className="flex items-center gap-4">
                 <input
                   type="color"
                   value={globalSettings?.primaryColor || "#1a73e8"}
                   onChange={(e) => updateGlobalSettings({ primaryColor: e.target.value })}
                   className="w-16 h-16 rounded-2xl cursor-pointer border-none"
                 />
                 <div className="space-y-1">
                    <p className="text-sm font-black dark:text-white font-mono uppercase">{globalSettings?.primaryColor}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Dynamic CSS Variable mapping</p>
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-400 block">Company Identity Logo</label>
              <div className="relative group w-full max-w-[200px]">
                 <input
                   type="file"
                   onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                 />
                 <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-3xl p-6 text-center hover:border-blue-500 transition-all bg-gray-50/50 dark:bg-slate-900/50">
                    {globalSettings?.logoUrl ? (
                      <img src={globalSettings.logoUrl} alt="Logo" className="h-12 mx-auto object-contain" />
                    ) : (
                      <Upload className="w-8 h-8 text-gray-300 mx-auto" />
                    )}
                    <p className="mt-2 text-[8px] font-black uppercase text-gray-400 tracking-widest">{uploading ? 'UPLOADING...' : 'Upload PNG/SVG'}</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Global Rubric */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
           <LayoutGrid className="text-emerald-500" size={24} />
           <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">Mock Interview Scoring Rubric</h2>
        </div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-8">Define standard criteria for Counselor evaluations.</p>

        <div className="space-y-4">
           {globalSettings?.globalRubric.map((r) => (
             <div key={r.id} className="flex items-center gap-4 bg-gray-50 dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-700">
                <input
                  type="text"
                  value={r.label}
                  onChange={(e) => updateRubricItem(r.id, e.target.value, r.maxScore)}
                  className="flex-1 bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm font-bold shadow-sm"
                />
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-gray-400">MAX:</span>
                   <input
                    type="number"
                    value={r.maxScore}
                    onChange={(e) => updateRubricItem(r.id, r.label, parseInt(e.target.value))}
                    className="w-16 bg-white dark:bg-slate-800 border-none rounded-xl px-2 py-2 text-sm font-black text-blue-600 text-center shadow-sm"
                   />
                </div>
                <button onClick={() => deleteRubricItem(r.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg">
                   <Trash2 size={18} />
                </button>
             </div>
           ))}
           <button onClick={addRubricItem} className="flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-widest hover:underline pt-2">
              <Plus size={16} /> Add Evaluative Criteria
           </button>
        </div>
      </div>
    </div>
  );
}
