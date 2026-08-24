"use client";

import React from "react";
import { Webhook } from "lucide-react";

export default function IntegrationsPanel() {
  return (
    <div className="space-y-10 animate-in fade-in text-center py-20">
      <div className="max-w-md mx-auto space-y-8">
        <div className="w-24 h-24 bg-slate-800/50 rounded-[32px] border border-slate-700 flex items-center justify-center mx-auto shadow-2xl">
           <Webhook className="w-12 h-12 text-slate-600" />
        </div>
        <div className="space-y-2">
           <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Integrations & API</h3>
           <p className="text-sm text-slate-500 font-medium leading-relaxed uppercase tracking-widest">
             No active connections. Manage third-party webhooks and enterprise API keys here.
           </p>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-6">
           <div className="h-1 bg-slate-800 rounded-full" />
           <div className="h-1 bg-slate-800 rounded-full" />
           <div className="h-1 bg-slate-800 rounded-full" />
        </div>
      </div>
    </div>
  );
}
