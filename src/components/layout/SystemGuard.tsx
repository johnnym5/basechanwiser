"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SystemSettings } from "@/types/resource";
import FullScreenLoader from "@/components/common/FullScreenLoader";
import { ShieldAlert, LogOut } from "lucide-react";

/**
 * SystemGuard: Protects routes and handles maintenance/suspension states.
 */
export default function SystemGuard({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading: authLoading, logout, effectiveRole } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTimeout, setIsTimeout] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // 1. System Settings Listener
  useEffect(() => {
    // Safety fallback: if Firebase/System check hangs for more than 8 seconds, force a resolution
    const timer = setTimeout(() => {
      setIsTimeout(true);
      setLoading(false);
    }, 8000);

    const unsub = onSnapshot(doc(db, "system_settings", "global"), (snap) => {
      try {
        if (snap.exists()) {
          const settings = snap.data() as SystemSettings;
          setMaintenanceMode(!!settings.maintenanceMode);
        }
      } catch (e) {
        console.error("System settings parsing error:", e);
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error("System settings snapshot error:", err);
      setLoading(false);
    });

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, []);

  // 2. Navigation & Access Control Logic
  useEffect(() => {
    if (loading || authLoading) return;
    if (pathname === "/login") return;

    if (!user && pathname !== "/maintenance") {
      router.push("/login");
      return;
    }

    const isSuspended = userProfile?.suspended === true || userProfile?.status === "Suspended";
    if (user && isSuspended) return;

    if (maintenanceMode && effectiveRole === "Student" && pathname !== "/maintenance") {
      router.push("/maintenance");
    }

    if (!maintenanceMode && pathname === "/maintenance") {
      const homePath = effectiveRole === "Student" ? "/dashboard" : "/counselor/dashboard";
      router.push(homePath);
    }
  }, [maintenanceMode, effectiveRole, loading, authLoading, pathname, router, user, userProfile]);

  // 🚨 RULES OF HOOKS: All hooks must be defined BEFORE any early returns.

  // 3. Early Returns (Post-Hook initialization)

  // Bypass guard for login page or on timeout
  if (pathname === "/login" || isTimeout) {
    return <>{children}</>;
  }

  // Show global loader while initializing
  if (loading || authLoading) {
    return <FullScreenLoader />;
  }

  // Double-check auth for non-public routes
  if (!user && pathname !== "/login") {
     return <FullScreenLoader />;
  }

  // Handle User Suspension UI
  const isSuspended = userProfile?.suspended === true || userProfile?.status === "Suspended";
  if (user && isSuspended) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white dark:bg-[#1E293B] border border-rose-500/30 rounded-[40px] p-10 max-w-md w-full shadow-2xl flex flex-col items-center space-y-6">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center border border-rose-500/20">
            <ShieldAlert size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Access Suspended</h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm font-bold leading-relaxed">
              Your account has been temporarily restricted by an administrator. Please contact your counselor or support.
            </p>
          </div>
          <button
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
            className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
