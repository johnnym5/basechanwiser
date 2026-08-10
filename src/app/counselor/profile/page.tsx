"use client";

import React, { useEffect, useState } from "react";
import AppShell from "@/components/layout/app-shell";
import StaffProfile from "@/components/staff/StaffProfile";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Counselor Profile Page
 * Acts as the entry point for staff members to view and manage their professional dossier.
 */
export default function CounselorProfilePage() {
  const { userProfile, effectiveRole, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!userProfile) {
        router.push("/login");
      } else if (effectiveRole === "Student") {
        router.push("/dashboard");
      }
    }
  }, [userProfile, effectiveRole, authLoading, router]);

  if (authLoading || !userProfile) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-sm font-black uppercase text-gray-500 tracking-widest text-center">
            Synchronizing Staff Dossier...
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <StaffProfile staffMember={userProfile} />
    </AppShell>
  );
}
