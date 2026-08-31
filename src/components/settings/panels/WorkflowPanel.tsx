"use client";

import React, { useState } from 'react';
import { GitMerge, AlertTriangle, ShieldCheck, Download, Loader2, Zap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { runSystemRecovery } from '@/lib/client/seed-utils';

interface WorkflowPanelProps {
  config: any;
  onChange: (field: string, value: any) => void;
}

export default function WorkflowPanel({ config, onChange }: WorkflowPanelProps) {
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    if (!confirm("🚨 WARNING: This will overwrite or restore the 5 Core UKVI Modules. Continue?")) return;
    setSeeding(true);
    try {
      const result = await runSystemRecovery();
      if (!result.success) throw new Error(result.message);
      alert(result.message);
    } catch (e: any) {
      alert(`System Notice: ${e.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* UKVI Content Seeding Tool (Restore original functionality) */}
      <div className="bg-slate-900/50 p-8 rounded-[40px] border border-slate-800 space-y-6 mb-10">
           <div className="flex items-center gap-3">
              <Download className="text-blue-500" size={24} />
              <h4 className="text-lg font-black text-white uppercase tracking-tighter">UKVI Content Seeding</h4>
           </div>
           <p className="text-xs text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
             Populate or reset the 5 official progressive UKVI training modules and their question banks.
           </p>
           <button
             onClick={handleSeed}
             disabled={seeding}
             className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
           >
             {seeding ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
             {seeding ? "RESTORING..." : "Seed / Restore Core Modules"}
           </button>
        </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-bold text-white uppercase flex items-center mb-6">
          <ShieldCheck className="w-4 h-4 mr-2 text-emerald-400" /> Procurement Approvals
        </h3>

        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
            <div className="pr-8">
              <h4 className="text-sm font-bold text-white">SuperAdmin Threshold Limit</h4>
              <p className="text-xs text-slate-400 mt-1">Any Requisition or Purchase Order exceeding this amount will bypass standard managers and require direct Root Admin approval.</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-bold">{config.currency || 'NGN'}</span>
              <input
                type="number"
                value={config.poThreshold || 0}
                onChange={(e) => onChange('poThreshold', parseInt(e.target.value) || 0)}
                className="w-32 bg-slate-900 border border-slate-700 text-sm font-bold text-white rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 text-right"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
            <div className="pr-8">
              <h4 className="text-sm font-bold text-white">Auto-Approve Micro-Expenses</h4>
              <p className="text-xs text-slate-400 mt-1">Automatically approve operational expenses under 10,000 without managerial intervention.</p>
            </div>
            <Switch
              checked={config.autoApproveMicro || false}
              onCheckedChange={(val) => onChange('autoApproveMicro', val)}
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-bold text-white uppercase flex items-center mb-6">
          <AlertTriangle className="w-4 h-4 mr-2 text-amber-400" /> Service Level Alerts (SLA)
        </h3>
        <div className="flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
            <div className="pr-8">
              <h4 className="text-sm font-bold text-white">Stalled Request Notifications</h4>
              <p className="text-xs text-slate-400 mt-1">Send a system alert to the Head of Operations if any leave request or requisition sits unapproved for more than 48 hours.</p>
            </div>
            <Switch
              checked={config.slaAlertsEnabled || false}
              onCheckedChange={(val) => onChange('slaAlertsEnabled', val)}
            />
          </div>
      </div>
    </div>
  );
}
