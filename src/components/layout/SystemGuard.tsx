"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SystemSettings } from "@/types/resource";
import FullScreenLoader from "@/components/common/FullScreenLoader";

export default function SystemGuard({ children }: { children: React.ReactNode }) {
  const { user, role, loading: authLoading } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTimeout, setIsTimeout] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Safety fallback: if Firebase/System check hangs for more than 8 seconds, force a resolution
    const timer = setTimeout(() => setIsTimeout(true), 8000);

    // Listen to global system settings
    const unsub = onSnapshot(doc(db, "system_settings", "global"), (snap) => {
      if (snap.exists()) {
        const settings = snap.data() as SystemSettings;
        setMaintenanceMode(!!settings.maintenanceMode);
      }
      setLoading(false);
    }, (err) => {
      console.error("System settings snapshot error:", err);
      setLoading(false);
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

    // If maintenance mode is ON and user is a Student
    if (maintenanceMode && role === "Student" && pathname !== "/maintenance") {
      router.push("/maintenance");
    }

    // If maintenance mode is OFF but user is on the maintenance page
    if (!maintenanceMode && pathname === "/maintenance") {
      router.push("/dashboard");
    }
  }, [maintenanceMode, role, loading, authLoading, pathname, router, user]);

  // Show the proper loader instead of a blank screen/null
  if ((loading || authLoading) && !isTimeout) {
    return <FullScreenLoader />;
  }

  // Prevent rendering children if unauthenticated on protected routes (prevents flash)
  if (!user && pathname !== "/login" && !isTimeout) {
     return <FullScreenLoader />;
  }

  return <>{children}</>;
}
