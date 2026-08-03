"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import AIAssistantFab from "@/components/ai/AIAssistantFab";
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
  FolderKanban,
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

  // Close drawer on route change
  useEffect(() => { setMobileDrawerOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileDrawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileDrawerOpen]);

  const studentLinks = [
    { name: "Dashboard",         href: "/dashboard",       icon: LayoutDashboard },
    { name: "Learning Drills",   href: "/learning",        icon: BookOpen },
    { name: "Interview Pack",    href: "/interview-pack",  icon: FileCheck },
  ];

  const counselorLinks = [
    { name: "Traffic Light",     href: "/counselor/dashboard",          icon: ShieldCheck },
    { name: "Students",          href: "/counselor/students",           icon: Users },
    { name: "Question Packs",    href: "/counselor/packs",              icon: FolderKanban },
    { name: "Pack Editor",       href: "/counselor/packs/editor?id=new",icon: Edit3 },
    { name: "Settings & Vault",  href: "/counselor/settings",           icon: Settings },
  ];

  const adminLinks = counselorLinks;

  const navLinks = role === "Admin" ? adminLinks : role === "Counselor" ? counselorLinks : studentLinks;

  const handleSignOut = async () => {
    setMobileDrawerOpen(false);
    await logout();
    router.push("/login");
  };

  const displayName  = userProfile?.displayName || user?.displayName || "User";
  const displayEmail = userProfile?.email || user?.email || "Staff Member";

  // Shared nav-link renderer
  const NavLink = ({ link, onClick }: { link: typeof navLinks[0]; onClick?: () => void }) => {
    const isActive = pathname === link.href || pathname.startsWith(link.href.split("?")[0]);
    const Icon = link.icon;
    return (
      <Link
        href={link.href}
        onClick={onClick}
        title={link.name}
        className={`group/link flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap touch-target ${
          isActive
            ? "bg-blue-100 dark:bg-blue-900/40 text-[#1a73e8] dark:text-blue-300"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
        }`}
      >
        <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-[#1a73e8] dark:text-blue-300" : "text-gray-500 dark:text-gray-400"}`} />
        <span className="truncate">{link.name}</span>
        {isActive && <ChevronRight className="w-4 h-4 ml-auto text-[#1a73e8] dark:text-blue-300" />}
      </Link>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] dark:bg-[#111827] text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors duration-300">

      {/* ── Top App Bar ──────────────────────────────────────────── */}
      <header className="h-14 sm:h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 px-3 sm:px-4 md:px-6 flex items-center justify-between shadow-xs transition-colors duration-300">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-target"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link
            href={role === "Admin" || role === "Counselor" ? "/counselor/dashboard" : "/dashboard"}
            className="flex items-center gap-2"
          >
            <Image src="/logo.png" alt="BN" width={32} height={32} className="rounded-lg" />
            <span className="font-extrabold text-gray-900 dark:text-white text-base sm:text-lg tracking-tight font-google hidden sm:inline">
              BASECHANWISER
            </span>
          </Link>
        </div>

        {/* Right: Search | Theme | Role | Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          {/* Search — hidden on xs, visible sm+ */}
          <div className="hidden sm:flex items-center relative w-44 md:w-56 lg:w-64">
            <Search className="w-4 h-4 absolute left-3 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full pl-9 pr-4 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/30 focus:bg-white dark:focus:bg-gray-600 transition-all"
            />
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-700 dark:text-yellow-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors touch-target"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Role pill — md+ */}
          <span className={`hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
            role === "Admin"
              ? "bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700"
              : role === "Counselor"
              ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700"
              : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700"
          }`}>
            {role || "Student"}
          </span>

          {/* Avatar / Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="w-9 h-9 rounded-full bg-[#1a73e8] flex items-center justify-center text-white font-bold text-sm hover:bg-[#1557b0] transition-colors shadow-md touch-target"
            >
              {displayName.charAt(0).toUpperCase()}
            </button>

            {profileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50 space-y-1">
                  <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{displayEmail}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl flex items-center gap-2 transition-colors touch-target"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Desktop Sidebar — lg+ (icon-only, hover-expands) */}
        <aside className="hidden lg:flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 sticky top-14 sm:top-16 h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] transition-all duration-300 ease-in-out group/sidebar w-[64px] hover:w-60 overflow-hidden z-30 shrink-0">
          <div className="px-3 py-3 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              {role === "Admin" ? "Admin Workspace" : role === "Counselor" ? "Counselor Portal" : "Student Workspace"}
            </span>
          </div>
          <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href.split("?")[0]);
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  title={link.name}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-blue-100 dark:bg-blue-900/40 text-[#1a73e8] dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-[#1a73e8] dark:text-blue-300" : "text-gray-500 dark:text-gray-400"}`} />
                  <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 truncate">{link.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 text-[#1a73e8] dark:text-blue-300" />}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* ── Mobile Slide-over Drawer — lg:hidden ─────────────── */}
        {mobileDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileDrawerOpen(false)}
            />
            {/* Drawer panel — slides from left */}
            <div className="relative w-72 max-w-[85vw] bg-white dark:bg-gray-800 h-full flex flex-col shadow-2xl z-50 animate-slide-right overflow-y-auto">
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
                <div className="flex items-center gap-2.5">
                  <Image src="/logo.png" alt="BN" width={32} height={32} className="rounded-lg" />
                  <span className="font-extrabold text-gray-900 dark:text-white text-base">BASECHANWISER</span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 touch-target"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Role label */}
              <div className="px-4 pt-3 pb-1">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                  role === "Admin"
                    ? "bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700"
                    : role === "Counselor"
                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700"
                    : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700"
                }`}>
                  {role || "Student"}
                </span>
              </div>

              {/* Nav links */}
              <nav className="flex-1 px-3 py-2 space-y-0.5">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.name}
                    link={link}
                    onClick={() => setMobileDrawerOpen(false)}
                  />
                ))}
              </nav>

              {/* User footer + sign out */}
              <div className="px-3 pb-4 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2 shrink-0 pb-safe">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-9 h-9 rounded-full bg-[#1a73e8] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{displayEmail}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors touch-target"
                >
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Main Content ─────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 lg:px-10 lg:py-8 max-w-7xl mx-auto w-full pb-20 lg:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Navigation — student only, lg:hidden ── */}
      {role !== "Counselor" && role !== "Admin" && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 flex pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          {studentLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors touch-target ${
                  isActive ? "text-[#1a73e8]" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-bold">{link.name.split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>
      )}
      {/* Universal Floating AI Assistant Copilot */}
      <AIAssistantFab />
    </div>
  );
}
