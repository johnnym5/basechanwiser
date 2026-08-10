"use client";

import React, { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

/**
 * OfflineIndicator:
 * Global real-time banner that monitors network connectivity.
 * Renders a full-width fixed banner at the top of the screen when offline.
 */
export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      return !navigator.onLine;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-[9999] bg-rose-600 text-white text-center py-2 px-4 font-bold text-xs shadow-lg flex items-center justify-center gap-2 tracking-widest uppercase animate-in slide-in-from-top duration-300">
      <WifiOff size={16} className="shrink-0 animate-pulse" />
      <span>You are currently offline. Some features may be unavailable.</span>
    </div>
  );
}
