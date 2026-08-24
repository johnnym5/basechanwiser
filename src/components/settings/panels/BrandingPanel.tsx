"use client";

import React from "react";
import { Palette, Globe, Link2 } from "lucide-react";

interface BrandingPanelProps {
  config: any;
  onChange: (field: string, value: any) => void;
}

export default function BrandingPanel({ config, onChange }: BrandingPanelProps) {
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
             <Globe className="text-indigo-400" size={20} />
             <h4 className="text-sm font-black text-white uppercase tracking-widest">Enterprise Logo Link</h4>
          </div>
          <div className="space-y-4">
             <div className="relative">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="url"
                  value={config.logoUrl || ""}
                  onChange={(e) => onChange("logoUrl", e.target.value)}
                  placeholder="Paste Logo Image URL..."
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl pl-11 pr-4 py-3.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
             </div>

             {config.logoUrl && (
               <div className="p-4 rounded-2xl bg-white/5 border border-slate-800 flex flex-col items-center">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Live Preview</p>
                  <img src={config.logoUrl} alt="Branding Preview" className="h-12 object-contain" />
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
