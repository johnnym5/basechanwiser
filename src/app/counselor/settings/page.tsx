"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { Settings, Shield, Zap, Palette, Loader2 } from "lucide-react";
import RoleGuard from "@/components/layout/RoleGuard";
import SecurityTab from "@/components/settings/SecurityTab";
import WorkflowTab from "@/components/settings/WorkflowTab";
import BrandingTab from "@/components/settings/BrandingTab";
import { useSettings } from "@/context/SettingsContext";

function Tab({ isActive, label, icon: Icon, onClick }: { isActive: boolean; label: string; icon: any; onClick: () => void }) {
  return (
    <button
      className={`flex items-center gap-3 px-8 py-4 font-black text-xs uppercase tracking-widest transition-all relative ${
        isActive
          ? "text-[#1a73e8] dark:text-blue-400"
          : "text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white"
      }`}
      onClick={onClick}
    >
      <Icon size={18} />
      {label}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1a73e8] dark:bg-blue-400 rounded-t-full animate-in fade-in slide-in-from-bottom-1" />
      )}
    </button>
  );
}

export default function EnterpriseSettingsPage() {
  const { role, loading: authLoading } = useAuth();
  const { loading: settingsLoading } = useSettings();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && role !== "Counselor" && role !== "Admin" && role !== "Super Admin") {
      router.push("/dashboard");
    }
  }, [role, authLoading, router]);

  const [activeTab, setActiveTab] = useState<number>(0);

  if (authLoading || settingsLoading) {
    return (
      <AppShell>
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" /></div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <RoleGuard allowedRoles={["Admin", "Super Admin"]}>
        <div className="max-w-6xl mx-auto w-full space-y-8 pb-20">
          <div className="flex flex-col gap-1 border-l-4 border-[#1a73e8] pl-6 py-2">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3 font-google uppercase tracking-tighter">
              <Settings className="w-8 h-8 text-[#1a73e8]" /> Enterprise Terminal
            </h1>
            <p className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
              Global Security, Workflow Automation & Brand Customization
            </p>
          </div>

          <div className="bg-white dark:bg-[#1E293B] rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 overflow-x-auto scrollbar-hide">
              <Tab label="Security & GDPR" icon={Shield} isActive={activeTab === 0} onClick={() => setActiveTab(0)} />
              <Tab label="Workflow & Automation" icon={Zap} isActive={activeTab === 1} onClick={() => setActiveTab(1)} />
              <Tab label="Branding & Rubrics" icon={Palette} isActive={activeTab === 2} onClick={() => setActiveTab(2)} />
            </div>

            <div className="p-8 animate-in fade-in duration-500">
              {activeTab === 0 && <SecurityTab />}
              {activeTab === 1 && <WorkflowTab />}
              {activeTab === 2 && <BrandingTab />}
            </div>
          </div>
        </div>
      </RoleGuard>
    </AppShell>
  );
}
