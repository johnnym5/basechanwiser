"use client";

import React, { useState } from "react";
import { Palette, Upload } from "lucide-react";
import { storage } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface BrandingPanelProps {
  config: any;
  onChange: (field: string, value: any) => void;
}

export default function BrandingPanel({ config, onChange }: BrandingPanelProps) {
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      const logoRef = ref(storage, `branding/logo_${Date.now()}`);
      await uploadBytes(logoRef, file);
      const url = await getDownloadURL(logoRef);
      onChange("logoUrl", url);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in">
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">B2B White-Labeling</h3>
          <p className="text-sm text-slate-400 font-medium">Customize the platform identity, colors, and assets.</p>
        </div>
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
               value={config.primaryColor || "#1a73e8"}
               onChange={(e) => onChange("primaryColor", e.target.value)}
               className="w-20 h-20 rounded-3xl cursor-pointer border-4 border-slate-800 bg-transparent"
             />
             <div className="space-y-1">
                <p className="text-lg font-black text-white font-mono uppercase tracking-tighter">{config.primaryColor || "#1a73e8"}</p>
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
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt="Logo" className="h-14 mx-auto object-contain" />
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
