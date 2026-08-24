"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  Building2,
  Zap,
  ShieldCheck,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  Palette,
  Webhook
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import OrganizationPanel from './panels/OrganizationPanel';
import WorkflowPanel from './panels/WorkflowPanel';
import SecurityPanel from './panels/SecurityPanel';
import RubricsPanel from './panels/RubricsPanel';
import BrandingPanel from './panels/BrandingPanel';
import IntegrationsPanel from './panels/IntegrationsPanel';
import { motion, AnimatePresence } from 'framer-motion';

type SettingsTab = 'branding' | 'organization' | 'workflow' | 'security' | 'rubrics' | 'integrations';

export default function SettingsPageContent() {
  const { user } = useAuth();
  const [config, setConfig] = useState<any>(null);
  const [localConfig, setLocalConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTab>('branding');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // 1. Firestore Subscription (config/global)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "global"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setConfig(data);
        // Only initialize localConfig if it's the first load
        setLocalConfig((prev: any) => prev === null ? data : prev);
      } else {
        // Default schema if missing
        const defaults = {
          primaryColor: "#1a73e8",
          entityName: 'Basechan International Ltd.',
          currency: 'NGN',
          timezone: 'Africa/Lagos',
          poThreshold: 500000,
          autoApproveMicro: true,
          slaAlertsEnabled: true,
          globalRubric: [
            { id: "fluency", label: "English Fluency", maxScore: 10 },
            { id: "finance", label: "Financial Awareness", maxScore: 10 },
            { id: "intent", label: "Genuine Intent", maxScore: 10 },
          ],
        };
        setConfig(defaults);
        setLocalConfig(defaults);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const hasChanges = useMemo(() => {
    return JSON.stringify(config) !== JSON.stringify(localConfig);
  }, [config, localConfig]);

  const handleUpdate = (field: string, value: any) => {
    setLocalConfig({ ...localConfig, [field]: value });
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "config", "global"), {
        ...localConfig,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error("Failed to save config:", err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Hydrating Config Engine...</p>
      </div>
    );
  }

  return (
    <div className="relative pb-32">
      <div className="flex flex-col lg:flex-row gap-10">

        {/* LEFT SIDEBAR NAVIGATION */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="flex flex-col bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-xl sticky top-8">
            <div className="p-6 border-b border-slate-800">
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Configuration</p>
               <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Enterprise</h2>
            </div>
            <nav className="p-3">
               <ul className="space-y-1">
                  <SideTab id="branding" label="Brand Identity" icon={Palette} active={activeTab === 'branding'} onClick={() => setActiveTab('branding')} />
                  <SideTab id="organization" label="Organization" icon={Building2} active={activeTab === 'organization'} onClick={() => setActiveTab('organization')} />
                  <SideTab id="workflow" label="Automation" icon={Zap} active={activeTab === 'workflow'} onClick={() => setActiveTab('workflow')} />
                  <SideTab id="security" label="Staff & Security" icon={ShieldCheck} active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
                  <SideTab id="rubrics" label="Rubrics" icon={ClipboardList} active={activeTab === 'rubrics'} onClick={() => setActiveTab('rubrics')} />
                  <SideTab id="integrations" label="Integrations" icon={Webhook} active={activeTab === 'integrations'} onClick={() => setActiveTab('integrations')} />
               </ul>
            </nav>
          </div>
        </div>

        {/* RIGHT CONTENT PANELS */}
        <div className="flex-1 min-w-0">
          {activeTab === 'branding' && <BrandingPanel config={localConfig} onChange={handleUpdate} />}
          {activeTab === 'organization' && <OrganizationPanel config={localConfig} onChange={handleUpdate} />}
          {activeTab === 'workflow' && <WorkflowPanel config={localConfig} onChange={handleUpdate} />}
          {activeTab === 'security' && <SecurityPanel currentUser={user} />}
          {activeTab === 'rubrics' && <RubricsPanel config={localConfig} onChange={handleUpdate} />}
          {activeTab === 'integrations' && <IntegrationsPanel />}
        </div>
      </div>

      {/* Sticky Save Banner */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-[100]"
          >
            <div className="bg-indigo-600 rounded-[32px] p-4 flex items-center justify-between shadow-[0_20px_50px_rgba(79,70,229,0.4)] border border-indigo-400">
               <div className="flex items-center gap-4 pl-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                     <AlertCircle size={20} />
                  </div>
                  <div>
                     <p className="text-sm font-black text-white uppercase tracking-tight">Unsaved Configuration Changes</p>
                     <p className="text-[10px] text-indigo-100 font-bold uppercase">Platform rules will not update until synced.</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <button
                    onClick={() => setLocalConfig(config)}
                    className="px-6 py-3 rounded-2xl text-xs font-black uppercase text-indigo-100 hover:bg-white/10 transition-all"
                  >
                    <RotateCcw className="inline-block mr-2 w-4 h-4" /> Reset
                  </button>
                  <button
                    onClick={saveChanges}
                    disabled={isSaving}
                    className="bg-white text-indigo-600 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Sync Engine
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {saveStatus === 'success' && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 z-[110]"
          >
            <CheckCircle2 size={18} />
            System Synchronized Successfully
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SideTab({ id, label, icon: Icon, active, onClick }: any) {
  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
          active
            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner'
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
        }`}
      >
        <Icon size={18} />
        {label}
      </button>
    </li>
  );
}
