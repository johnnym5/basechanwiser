"use client";

import React from "react";
import AppShell from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { Shield, Loader2 } from "lucide-react";
import RoleGuard from "@/components/layout/RoleGuard";
import SettingsPageContent from "@/components/settings/SettingsPageContent";

/**
 * Enterprise Settings Dashboard:
 * Re-architected as a unified operational control center.
 * Powered by a central Firestore Config document and a transactional Save Engine.
 */
export default function EnterpriseSettingsPage() {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <AppShell>
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <RoleGuard allowedRoles={["Admin", "Super Admin", "Head of Compliance"]}>
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">

          {/* Header Dashboard Branding */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-8 gap-6">
            <div>
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter">System Configuration</h1>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">Operational Hub & Functional Rules engine</p>
            </div>

            <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-3xl border border-slate-800">
               <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <Shield className="w-5 h-5 text-indigo-400" />
               </div>
               <div>
                  <p className="text-xs font-black text-white uppercase">Authorized Session</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Read/Write Privileges Active</p>
               </div>
            </div>
          </div>

          {/* New Unified Settings Content */}
          <SettingsPageContent />

        </div>
      </RoleGuard>
    </AppShell>
  );
}
