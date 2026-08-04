"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useTheme } from "@/lib/theme/theme-context";
import { User, Mail, ArrowRight, LogIn, GraduationCap, Sun, Moon } from "lucide-react";
import Image from "next/image";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";

type LoginMode = "choose" | "student";

export default function LoginPage() {
  const { user, role, signInWithGoogle, signInWithNameAndEmail, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("choose");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (user && role) {
      if (role === "Super Admin" || role === "Admin" || role === "Counselor") {
        router.push("/counselor/dashboard");
      } else {
        // Check for maintenance mode for students
        const checkMaintenance = async () => {
          const sysSnap = await getDoc(doc(db, "system_settings", "global"));
          if (sysSnap.exists() && sysSnap.data().maintenanceMode) {
            router.push("/maintenance");
          } else {
            router.push("/dashboard");
          }
        };
        checkMaintenance();
      }
    }
  }, [user, role, router]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || "Google Sign-In failed.");
      setIsSigningIn(false);
    }
  };

  const handleNameEmailSignIn = async () => {
    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      await signInWithNameAndEmail(fullName.trim(), email.trim().toLowerCase());
    } catch (err: any) {
      setErrorMsg(err.message || "Sign-In failed. Please try again.");
      setIsSigningIn(false);
    }
  };

  const isFormDisabled = isSigningIn || loading;

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#111827] flex flex-col items-center justify-center p-4 font-sans transition-colors duration-300">
      {/* Dark Mode Toggle — Top Right */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-700 dark:text-yellow-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-md"
        aria-label="Toggle theme"
      >
        {theme === "light" ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
      </button>

      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 space-y-6 text-center transition-all">
        {/* Brand Header with BN Logo */}
        <div className="flex flex-col items-center space-y-3">
          <Image
            src="/logo.png"
            alt="BASECHANWISER"
            width={72}
            height={72}
            className="drop-shadow-lg"
            priority
          />
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white font-google">
            BASECHANWISER
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Student Compliance &amp; Operations Platform
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* ── Choose Mode ── */}
        {mode === "choose" && (
          <div className="space-y-3 pt-2">
            {/* Google Sign-In — Primary for Staff & Students */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isFormDisabled}
              className="w-full py-3.5 px-4 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign in with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
              <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
            </div>

            {/* Login as Student (Anonymous) */}
            <button
              onClick={() => { setMode("student"); setErrorMsg(null); }}
              disabled={isFormDisabled}
              className="w-full py-3.5 px-4 rounded-full border-2 border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Login as Student</span>
            </button>
          </div>
        )}

        {/* ── Student Login Form ── */}
        {mode === "student" && (
          <div className="space-y-4 pt-2 text-left">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Student Access</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Please provide your name and email so we know who you are.</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="student-name" className="text-xs font-bold text-gray-700 dark:text-gray-200">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                <input
                  id="student-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  disabled={isFormDisabled}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/50 focus:border-[#1a73e8] transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="student-email" className="text-xs font-bold text-gray-700 dark:text-gray-200">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                <input
                  id="student-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  disabled={isFormDisabled}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/50 focus:border-[#1a73e8] transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <button
              onClick={handleNameEmailSignIn}
              disabled={isFormDisabled}
              className="w-full py-3.5 px-4 rounded-full border-2 border-[#1a73e8] bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600 text-[#1a73e8] dark:text-blue-300 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSigningIn ? (
                <div className="w-5 h-5 border-2 border-blue-300 border-t-[#1a73e8] rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>Login as Student</span>
                </>
              )}
            </button>

            <button
              onClick={() => { setMode("choose"); setErrorMsg(null); setFullName(""); setEmail(""); }}
              className="w-full text-sm text-gray-600 dark:text-gray-300 hover:text-[#1a73e8] dark:hover:text-blue-400 font-bold transition-colors pt-1"
            >
              ← Back to login options
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-500 dark:text-gray-400 font-medium">
        © {new Date().getFullYear()} Basechan Group · Internal Use Only
      </p>
    </div>
  );
}
