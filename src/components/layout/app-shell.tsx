"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useTheme } from "@/lib/theme/theme-context";
import {
  LayoutDashboard,
  BookOpen,
  FileCheck,
  ShieldCheck,
  Users,
  Edit3,
  Search,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Settings,
  Sun,
  Moon,
} from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, userProfile, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const studentLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Learning", href: "/learning", icon: BookOpen },
    { name: "Interview Pack", href: "/interview-pack", icon: FileCheck },
  ];

  const counselorLinks = [
    { name: "Traffic Light Dashboard", href: "/counselor/dashboard", icon: ShieldCheck },
    { name: "Students Directory", href: "/counselor/students", icon: Users },
    { name: "Module Editor", href: "/counselor/module-editor", icon: Edit3 },
  ];

  const adminLinks = [
    { name: "Traffic Light Dashboard", href: "/counselor/dashboard", icon: ShieldCheck },
    { name: "Students Directory", href: "/counselor/students", icon: Users },
    { name: "Module Editor", href: "/counselor/module-editor", icon: Edit3 },
    { name: "Admin Settings", href: "/counselor/students", icon: Settings },
  ];

  const navLinks = role === "Admin" ? adminLinks : role === "Counselor" ? counselorLinks : studentLinks;

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  const displayName = userProfile?.displayName || user?.displayName || "User";
  const displayEmail = userProfile?.email || user?.email || "Staff Member";

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#111827] text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors duration-300">
      {/* Top App Bar */}
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between shadow-xs transition-colors duration-300">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="md:hidden p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link
            href={role === "Admin" || role === "Counselor" ? "/counselor/dashboard" : "/dashboard"}
            className="flex items-center gap-2.5"
          >
            <Image src="/logo.png" alt="BN" width={36} height={36} className="rounded-lg" />
            <span className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight font-google hidden sm:inline">
              BASECHANWISER
            </span>
          </Link>
        </div>

        {/* Right side: Search, Theme, Role, Profile */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden sm:flex items-center relative w-64">
            <Search className="w-4 h-4 absolute left-3 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search modules, packs, students..."
              className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full pl-9 pr-4 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/30 focus:bg-white dark:focus:bg-gray-600 transition-all"
            />
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-700 dark:text-yellow-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Role Pill */}
          <span
            className={`hidden md:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
              role === "Admin"
                ? "bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700"
                : role === "Counselor"
                ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700"
                : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700"
            }`}
          >
            Role: {role || "Student"}
          </span>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="w-9 h-9 rounded-full bg-[#1a73e8] flex items-center justify-center text-white font-bold text-sm hover:bg-[#1557b0] transition-colors shadow-md"
            >
              {displayName.charAt(0).toUpperCase()}
            </button>

            {profileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50 space-y-1">
                  <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{displayEmail}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 relative">
        {/* ── Desktop Sidebar: hover to expand ── */}
        <aside
          className="hidden md:flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 sticky top-16 h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out group/sidebar w-[68px] hover:w-64 overflow-hidden z-30"
        >
          {/* Workspace label — only visible when expanded */}
          <div className="px-4 py-3 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {role === "Admin" ? "Admin Workspace" : role === "Counselor" ? "Counselor Portal" : "Student Workspace"}
            </span>
          </div>

          <nav className="flex-1 px-2 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  title={link.name}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-blue-100 dark:bg-blue-900/40 text-[#1a73e8] dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-[#1a73e8] dark:text-blue-300" : "text-gray-500 dark:text-gray-400"}`} />
                  <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">{link.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 text-[#1a73e8] dark:text-blue-300" />}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Drawer */}
        {mobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/50" onClick={() => setMobileDrawerOpen(false)} />
            <div className="relative w-64 bg-white dark:bg-gray-800 h-full p-4 flex flex-col space-y-4 shadow-xl z-50 transition-colors">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                <div className="flex items-center gap-2">
                  <Image src="/logo.png" alt="BN" width={28} height={28} className="rounded-lg" />
                  <span className="font-bold text-gray-900 dark:text-white text-sm">Navigation</span>
                </div>
                <button onClick={() => setMobileDrawerOpen(false)} className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-1 flex-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        isActive ? "bg-blue-100 dark:bg-blue-900/40 text-[#1a73e8] dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
