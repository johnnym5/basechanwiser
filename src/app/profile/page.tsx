"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Loader2 } from "lucide-react";

export default function ProfileRedirectPage() {
  const { effectiveRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (effectiveRole === "Student") {
        router.replace("/dashboard"); // Or a specific student profile if built later
      } else if (effectiveRole) {
        router.replace("/counselor/profile");
      } else {
        router.replace("/login");
      }
    }
  }, [effectiveRole, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>
  );
}
