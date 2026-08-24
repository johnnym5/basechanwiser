"use client";

import React from 'react';
import { Globe, Building2, Receipt, Clock } from 'lucide-react';

interface OrganizationPanelProps {
  config: any;
  onChange: (field: string, value: any) => void;
}

export default function OrganizationPanel({ config, onChange }: OrganizationPanelProps) {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-bold text-white uppercase flex items-center mb-6">
          <Building2 className="w-4 h-4 mr-2 text-indigo-400" /> Legal & Identity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Registered Entity Name</label>
            <input
              type="text"
              value={config.entityName || ''}
              onChange={(e) => onChange('entityName', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500"
              placeholder="e.g. Basechan International Ltd."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tax ID / Business Number</label>
            <input
              type="text"
              value={config.taxId || ''}
              onChange={(e) => onChange('taxId', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">Auto-populates on outgoing Purchase Orders.</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-bold text-white uppercase flex items-center mb-6">
          <Globe className="w-4 h-4 mr-2 text-indigo-400" /> Regional Defaults
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center"><Receipt className="w-3 h-3 mr-1"/> Base Currency</label>
            <select
              value={config.currency || 'NGN'}
              onChange={(e) => onChange('currency', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500"
            >
              <option value="NGN">₦ NGN (Naira)</option>
              <option value="USD">$ USD (Dollar)</option>
              <option value="GBP">£ GBP (Pounds)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center"><Clock className="w-3 h-3 mr-1"/> System Timezone</label>
            <select
              value={config.timezone || 'Africa/Lagos'}
              onChange={(e) => onChange('timezone', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500"
            >
              <option value="Africa/Lagos">West Africa Time (WAT)</option>
              <option value="UTC">Coordinated Universal Time (UTC)</option>
              <option value="Europe/London">Greenwich Mean Time (GMT)</option>
            </select>
            <p className="text-[10px] text-slate-500 mt-1">Dictates shift start/end calculations.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
