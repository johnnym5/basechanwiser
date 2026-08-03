"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (!user) {
          router.push("/login");
        } else if (role === "Admin" || role === "Counselor") {
          router.push("/counselor/dashboard");
        } else {
          router.push("/dashboard");
        }
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [user, role, loading, router]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#111827] flex flex-col items-center justify-center font-sans transition-colors duration-300">
      {/* Logo Animation */}
      <div className="animate-pulse-scale mb-6">
        <Image
          src="/logo.png"
          alt="BASECHANWISER"
          width={120}
          height={120}
          className="drop-shadow-xl"
          priority
        />
      </div>

      {/* Brand Name */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white font-google">
          BASECHANWISER
        </h1>
      </div>

      {/* Subtitle */}
      <div className="animate-fade-up-delay">
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-2 tracking-wide">
          Student Compliance &amp; Operations Platform
        </p>
      </div>

      {/* Loading Bar */}
      <div className="mt-8 w-48 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden animate-fade-up-delay">
        <div
          className="h-full bg-gradient-to-r from-[#1a73e8] to-[#4285f4] rounded-full"
          style={{
            animation: "loading-bar 1.6s ease-in-out infinite",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
