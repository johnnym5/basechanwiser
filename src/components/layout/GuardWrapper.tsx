"use client";

import React from "react";
import { usePathname } from "next/navigation";
import SystemGuard from "./SystemGuard";

/**
 * GuardWrapper: Conditionally applies the SystemGuard based on the route.
 * This decouples public routes (like /login) from the global authentication check,
 * ensuring they render instantly even if the database connection hangs.
 */
export default function GuardWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Whitelist public routes from the global authentication check.
  const isPublicRoute = pathname === "/login" || pathname === "/maintenance" || pathname === "/";

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return <SystemGuard>{children}</SystemGuard>;
}
