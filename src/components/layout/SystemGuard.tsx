"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SystemSettings } from "@/types/resource";
import FullScreenLoader from "@/components/common/FullScreenLoader";
import { ShieldAlert, LogOut } from "lucide-react";

export default function SystemGuard({ children }: { children: React.ReactNode }) {
  const { user, userProfile, role, loading: authLoading, logout, effectiveRole } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTimeout, setIsTimeout] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  /**
   * SystemGuard Global Session & Loading Resolution:
   * Ensures that system settings snapshots and auth resolution are strictly guarded with
   * try/catch/finally resolution and an 8-second safety fallback timeout.
   * setLoading(false) is called on snapshot success AND snapshot error.
   */
  useEffect(() => {
    // Safety fallback: if Firebase/System check hangs for more than 8 seconds, force a resolution
    const timer = setTimeout(() => {
      setIsTimeout(true);
      setLoading(false);
    }, 8000);

    // Listen to global system settings
    const unsub = onSnapshot(doc(db, "system_settings", "global"), (snap) => {
      try {
        if (snap.exists()) {
          const settings = snap.data() as SystemSettings;
          setMaintenanceMode(!!settings.maintenanceMode);
        }
      } catch (e) {
        console.error("System settings parsing error:", e);
      } finally {
        setLoading(false); // Universally resolved
      }
    }, (err) => {
      console.error("System settings snapshot error:", err);
      setLoading(false); // Universally resolved on error
    });

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (loading || authLoading) return;

    // Route Guard Logic
    if (!user && pathname !== "/login" && pathname !== "/maintenance") {
      router.push("/login");
      return;
    }

    // SUSPENSION CHECK
    const isSuspended = userProfile?.suspended === true || userProfile?.status === "Suspended";
    if (user && isSuspended && pathname !== "/login") {
      // We'll handle the UI in the render block below
      return;
    }

    // If maintenance mode is ON and user is a Student
    if (maintenanceMode && effectiveRole === "Student" && pathname !== "/maintenance") {
      router.push("/maintenance");
    }

    // If maintenance mode is OFF but user is on the maintenance page
    if (!maintenanceMode && pathname === "/maintenance") {
      router.push("/dashboard");
    }
  }, [maintenanceMode, effectiveRole, loading, authLoading, pathname, router, user, userProfile]);

  // Show the proper loader instead of a blank screen/null
  if ((loading || authLoading) && !isTimeout) {
    return <FullScreenLoader />;
  }

  // If timeout reached and still no user, redirect to login as a failsafe
  if (isTimeout && !user && pathname !== "/login") {
    router.push("/login");
    return <FullScreenLoader />;
  }

  // Prevent rendering children if unauthenticated on protected routes (prevents flash)
  if (!user && pathname !== "/login") {
     return <FullScreenLoader />;
  }

  // SUSPENSION UI RENDER
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

