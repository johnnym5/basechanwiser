"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { seedDefaultMockConfig } from "@/lib/seed/mock-interview-seed";
import { seedDefaultPackConfig } from "@/lib/seed/interview-pack-seed";

export default function InitialSeeder() {
  const { role } = useAuth();

  useEffect(() => {
    if (role === 'Admin' || role === 'Super Admin') {
      seedDefaultMockConfig();
      seedDefaultPackConfig();
    }
  }, [role]);

  return null;
}
