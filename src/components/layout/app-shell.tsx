"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import NotificationBell from "@/components/common/NotificationBell";
import ChatDrawer from "@/components/chat/ChatDrawer";
import IncomingCallListener from "@/components/mock-interview/IncomingCallListener";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useTheme } from "@/lib/theme/theme-context";
import {
  LayoutDashboard,
  BookOpen,
  FileCheck,
  ShieldCheck,
  Users,
  Search,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Settings,
  Sun,
  Moon,
  LayoutGrid,
  Trophy,
  History,
  BarChart3,
  Eye,
  ShieldAlert,
  User as UserIcon,
  MessageSquare,
} from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, userProfile, role, logout, effectiveRole, simulatedRole, setSimulatedRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [avatarErrored, setAvatarErrored] = useState(false);
  const [mobileAvatarErrored, setMobileAvatarErrored] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

  const isAdmin = role === "Admin" || role === "Super Admin";

  // Close drawer on route change
  useEffect(() => { setMobileDrawerOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileDrawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileDrawerOpen]);

  const studentLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Leaderboard", href: "/student/leaderboard", icon: Trophy },
    { name: "My History", href: "/student/history", icon: History },
    { name: "Scholar Academy", href: "/learning", icon: BookOpen },
    { name: "Interview Pack", href: "/student/interview-pack", icon: ShieldCheck },
    { name: "Mock Interview", href: "/student/mock-interview", icon: MessageSquare },
  ];

  const counselorLinks = [
    { name: "Dashboard", href: "/counselor/dashboard", icon: LayoutDashboard },
    { name: "My Students", href: "/counselor/students", icon: Users },
    { name: "Academy Manager", href: "/counselor/academy-manager", icon: LayoutGrid },
    { name: "Resource Library", href: "/counselor/library", icon: BookOpen },
    { name: "Leaderboard", href: "/counselor/leaderboard", icon: Trophy },
  ];

  const adminLinks = [
    ...counselorLinks,
    { name: "Analytics", href: "/admin/dashboard", icon: BarChart3 },
    { name: "Platform Settings", href: "/counselor/settings", icon: Settings },
  ];

  const complianceLinks = [
    { name: "Analytics", href: "/head-of-compliance/dashboard", icon: BarChart3 },
    { name: "Settings", href: "/counselor/settings", icon: Settings },
  ];

  const navLinks =
    effectiveRole === "Head of Compliance"
      ? complianceLinks
      : effectiveRole === "Admin" || effectiveRole === "Super Admin"
        ? adminLinks
        : effectiveRole === "Counselor"
          ? counselorLinks
          : studentLinks;

  const handleSignOut = async () => {
    setMobileDrawerOpen(false);
    await logout();
    router.push("/login");
  };

  const displayName = userProfile?.displayName || user?.displayName || "User";
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
        className={`group/link flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap touch-target ${isActive
            ? "bg-blue-100 dark:bg-blue-900/40 text-[#1a73e8] dark:text-blue-300"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
          }`}
      >
        <Icon size={20} className={`shrink-0 ${isActive ? "text-[#1a73e8] dark:text-blue-300" : "text-gray-500 dark:text-gray-400"}`} />
        <span className="truncate">{link.name}</span>
        {isActive && <ChevronRight size={16} className="ml-auto text-[#1a73e8] dark:text-blue-300" />}
      </Link>
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8F9FA] dark:bg-[#0F172A] text-gray-900 dark:text-slate-200 font-sans transition-colors duration-300">

      {/* Desktop Sidebar — lg+ (Fixed width, border right) */}
      <aside className="hidden lg:flex flex-col bg-white dark:bg-[#1E293B] border-r border-gray-200 dark:border-slate-800 w-20 hover:w-64 transition-all duration-300 ease-in-out group/sidebar z-30 shrink-0 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-transparent group-hover/sidebar:border-gray-100 dark:group-hover/sidebar:border-slate-800 transition-colors">
          <Image src="/logo.png" alt="BN" width={32} height={32} className="rounded-lg shrink-0" />
          <span className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight font-google opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            BASECHANWISER
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-4 overflow-y-auto overflow-x-hidden">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href.split("?")[0]);
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                title={link.name}
                className={`flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${isActive
                    ? "bg-blue-50 dark:bg-blue-500/10 text-[#1a73e8] dark:text-blue-500"
                    : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                <Icon size={24} className={`shrink-0 ${isActive ? "text-[#1a73e8] dark:text-blue-500" : "text-gray-400 dark:text-slate-500"}`} />
                <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 truncate">{link.name}</span>
                {isActive && <ChevronRight size={18} className="ml-auto opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 text-[#1a73e8] dark:text-blue-500" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-6 border-t border-gray-100 dark:border-slate-800">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all w-full overflow-hidden"
            title="Sign Out"
          >
            <LogOut className="w-6 h-6 shrink-0" />
            <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area (Right side) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-[#1E293B] border-b border-gray-200 dark:border-slate-800 shrink-0 z-20 px-4 sm:px-6 flex items-center justify-between shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu size={24} />
            </button>

            {/* Breadcrumb or Search placeholder */}
            <div className="hidden sm:flex items-center relative w-64">
              <Search size={16} className="absolute left-3 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search resources..."
                className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-full pl-9 pr-4 py-2 text-xs font-medium text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/30 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Chat Trigger */}
            <button
              onClick={() => setIsChatDrawerOpen(true)}
              className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all relative"
            >
              <MessageSquare size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border border-white dark:border-slate-800" />
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Role pill */}
            <span className={`hidden md:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${effectiveRole === "Super Admin"
                ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                : effectiveRole === "Head of Compliance"
                  ? "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                : effectiveRole === "Admin"
                  ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                  : effectiveRole === "Counselor"
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                    : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              }`}>
              {simulatedRole ? `Viewing as: ${simulatedRole}` : (effectiveRole || "Student")}
            </span>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-10 h-10 rounded-full bg-[#1a73e8] overflow-hidden flex items-center justify-center text-white font-bold text-sm hover:bg-[#1557b0] transition-all shadow-md"
              >
                {!avatarErrored && (userProfile?.photoURL || user?.photoURL) ? (
                  <img
                    src={userProfile?.photoURL || user?.photoURL || ""}
                    alt="User avatar"
                    className="w-full h-full object-cover"
                    onError={() => setAvatarErrored(true)}
                  />
                ) : (
                  <span>{displayName.charAt(0).toUpperCase()}</span>
                )}
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-gray-100 dark:border-slate-700 mb-1">
                      <p className="text-sm font-black text-gray-900 dark:text-white truncate">{displayName}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">{displayEmail}</p>
                      {simulatedRole && (
                        <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mt-1 italic">
                          Simulating: {simulatedRole}
                        </p>
                      )}
                    </div>

                    <div className="p-2 border-b border-gray-100 dark:border-slate-700">
                      <Link
                        href={role === "Student" ? "/dashboard" : "/counselor/profile"}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="w-full text-left flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-gray-700 dark:text-gray-300"
                      >
                        <UserIcon size={16}/> My Profile
                      </Link>
                    </div>

                    {/* Simulation Controls (Admins Only) */}
                    {isAdmin && (
                      <div className="p-2 border-b border-gray-100 dark:border-slate-700">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Simulate View</p>
                        <button
                          onClick={() => { setSimulatedRole('Counselor'); setProfileDropdownOpen(false); }}
                          className={`w-full text-left flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${simulatedRole === 'Counselor' ? 'text-[#1a73e8] bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'}`}
                        >
                          <Eye size={16}/> Counselor View
                        </button>
                        <button
                          onClick={() => { setSimulatedRole('Student'); setProfileDropdownOpen(false); }}
                          className={`w-full text-left flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${simulatedRole === 'Student' ? 'text-[#1a73e8] bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'}`}
                        >
                          <UserIcon size={16}/> Student View
                        </button>

                        {simulatedRole && (
                          <button
                            onClick={() => { setSimulatedRole(null); setProfileDropdownOpen(false); }}
                            className="w-full text-left flex items-center gap-3 px-3 py-2 mt-1 text-xs font-black rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 transition-colors"
                          >
                            <ShieldAlert size={16}/> Exit Simulation
                          </button>
                        )}
                      </div>
                    )}

                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex items-center gap-3 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content Container */}
        <main className="flex-1 overflow-y-auto bg-inherit">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile Slide-over Drawer — lg:hidden ─────────────── */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setMobileDrawerOpen(false)} />
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-[#1E293B] h-full flex flex-col shadow-2xl z-50 animate-slide-right overflow-hidden">
            <div className="flex items-center justify-between px-6 py-6 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Image src="/logo.png" alt="BN" width={32} height={32} className="rounded-lg" />
                <span className="font-extrabold text-gray-900 dark:text-white text-base">BASECHANWISER</span>
              </div>
              <button onClick={() => setMobileDrawerOpen(false)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800">
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              {navLinks.map((link) => (
                <NavLink key={link.name} link={link} onClick={() => setMobileDrawerOpen(false)} />
              ))}
            </nav>

            <div className="px-4 pb-8 pt-4 border-t border-gray-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-10 h-10 rounded-full bg-[#1a73e8] overflow-hidden flex items-center justify-center text-white font-bold text-sm">
                  {!mobileAvatarErrored && (userProfile?.photoURL || user?.photoURL) ? (
                    <img
                      src={userProfile?.photoURL || user?.photoURL || ""}
                      alt="User avatar"
                      className="w-full h-full object-cover"
                      onError={() => setMobileAvatarErrored(true)}
                    />
                  ) : (
                    <span>{displayName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{displayName}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{displayEmail}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Chat Drawer */}
      <ChatDrawer isOpen={isChatDrawerOpen} onClose={() => setIsChatDrawerOpen(false)} />

      {/* Global WebRTC Incoming Call Listener */}
      <IncomingCallListener />
    </div>
  );
}
