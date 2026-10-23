"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import NotificationBell from "@/components/common/NotificationBell";
import ChatDrawer from "@/components/chat/ChatDrawer";
import IncomingCallListener from "@/components/mock-interview/IncomingCallListener";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useTheme } from "@/lib/theme/theme-context";
import { useSystemNotifications } from "@/hooks/useSystemNotifications";
import { motion, AnimatePresence } from "framer-motion";
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
  Video,
} from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, userProfile, role, logout, effectiveRole, simulatedRole, setSimulatedRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  // ── PUSH NOTIFICATIONS: Global Real-time Listener ──
  useSystemNotifications(user, role);

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [avatarErrored, setAvatarErrored] = useState(false);
  const [mobileAvatarErrored, setMobileAvatarErrored] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

  // FAB Open State
  const [isFabOpen, setIsFabOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  const isAdmin = role === "Admin" || role === "Super Admin";

  // Close drawer on route change
  useEffect(() => { setMobileDrawerOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileDrawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileDrawerOpen]);

  // Close FAB on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsFabOpen(false);
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const studentLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Resources", href: "/student/library", icon: BookOpen },
    { name: "Feedback Hub", href: "/student/feedback", icon: MessageSquare },
    { name: "Interview Pack", href: "/student/interview-pack", icon: ShieldCheck },
    { name: "Mock Interview", href: "/student/mock-interview", icon: Video },
  ];

  const counselorLinks = [
    { name: "Dashboard", href: "/counselor/dashboard", icon: LayoutDashboard },
    { name: "My Students", href: "/counselor/students", icon: Users },
    { name: "Course Manager", href: "/counselor/academy-manager", icon: LayoutGrid },
    { name: "Study Files", href: "/counselor/library", icon: BookOpen },
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

  const isStudent = effectiveRole === "Student";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8F9FA] dark:bg-[#0F172A] text-gray-900 dark:text-slate-200 font-sans transition-colors duration-300">

      {/* Desktop Sidebar — lg+ (Fixed width, border right) */}
      {!isStudent && (
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
      )}

      {/* Main Content Area (Right side) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-[#1E293B] border-b border-gray-200 dark:border-slate-800 shrink-0 z-20 px-4 sm:px-6 flex items-center justify-between shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-4">
            {!isStudent ? (
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden p-2 rounded-xl text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Menu size={24} />
              </button>
            ) : (
              <div className="flex items-center gap-2.5">
                <Image src="/logo.png" alt="BN" width={32} height={32} className="rounded-lg" />
                <span className="font-extrabold text-gray-900 dark:text-white text-base hidden sm:inline tracking-tight font-google">BASECHANWISER</span>
              </div>
            )}

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
            {/* Unified FAB Menu anchored to Avatar Circle ("J") */}
            <div className="relative flex items-center" ref={fabRef}>
              <AnimatePresence>
                {isFabOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 20 }}
                    transition={{ type: "spring", duration: 0.35, bounce: 0 }}
                    className="absolute right-14 flex items-center gap-2.5 bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-xl border border-gray-200 dark:border-slate-700/80 rounded-full p-2 shadow-2xl z-50 whitespace-nowrap"
                  >
                    {/* 1. Leaderboard (Icon Only) */}
                    {isStudent && (
                      <Link
                        href="/student/leaderboard"
                        onClick={() => setIsFabOpen(false)}
                        className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700/80 flex items-center justify-center text-gray-600 dark:text-slate-300 hover:text-[#1a73e8] dark:hover:text-blue-400 hover:border-blue-500 transition-all"
                        title="Leaderboard"
                      >
                        <Trophy size={18} />
                      </Link>
                    )}

                    {/* 2. History (Icon Only) */}
                    {isStudent && (
                      <Link
                        href="/student/history"
                        onClick={() => setIsFabOpen(false)}
                        className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700/80 flex items-center justify-center text-gray-600 dark:text-slate-300 hover:text-[#1a73e8] dark:hover:text-blue-400 hover:border-blue-500 transition-all"
                        title="My History"
                      >
                        <History size={18} />
                      </Link>
                    )}

                    {/* 3. Global Chat (Icon Only) */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsChatDrawerOpen(true);
                        setIsFabOpen(false);
                      }}
                      className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700/80 flex items-center justify-center text-gray-600 dark:text-slate-300 hover:text-[#1a73e8] dark:hover:text-blue-400 hover:border-blue-500 transition-all relative"
                      title="Community Chat"
                    >
                      <MessageSquare size={18} />
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full border border-white dark:border-slate-800" />
                    </button>

                    {/* 4. Notification Bell (Icon Only) */}
                    <NotificationBell />

                    {/* 5. Theme Toggle (Icon Only) */}
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700/80 flex items-center justify-center text-gray-600 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                      title="Toggle Theme"
                    >
                      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                    </button>

                    {/* 6. Role Badge */}
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        effectiveRole === "Super Admin"
                          ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                          : effectiveRole === "Head of Compliance"
                          ? "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                          : effectiveRole === "Admin"
                          ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                          : effectiveRole === "Counselor"
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                          : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      }`}
                    >
                      {simulatedRole ? `Sim: ${simulatedRole}` : (effectiveRole || "Student")}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Avatar FAB Trigger Button ("J") */}
              <button
                type="button"
                onClick={() => {
                  const nextState = !isFabOpen;
                  setIsFabOpen(nextState);
                  setProfileDropdownOpen(nextState);
                }}
                className="w-11 h-11 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-orange-500/20 border-2 border-orange-400/40 transition-all transform active:scale-95 shrink-0 z-50 cursor-pointer"
                title="Toggle Quick Actions & Profile"
              >
                {!avatarErrored && (userProfile?.photoURL || user?.photoURL) ? (
                  <img
                    src={userProfile?.photoURL || user?.photoURL || ""}
                    alt="User avatar"
                    className="w-full h-full object-cover rounded-full"
                    onError={() => setAvatarErrored(true)}
                  />
                ) : (
                  <span>{displayName.charAt(0).toUpperCase()}</span>
                )}
              </button>

              {/* Profile Options Dropdown Menu */}
              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setIsFabOpen(false);
                    }}
                  />
                  <div className="absolute right-0 top-14 w-60 bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-gray-100 dark:border-slate-700 mb-1">
                      <p className="text-sm font-black text-gray-900 dark:text-white truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">
                        {displayEmail}
                      </p>
                      {simulatedRole && (
                        <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mt-1 italic">
                          Simulating: {simulatedRole}
                        </p>
                      )}
                    </div>

                    <div className="p-2 border-b border-gray-100 dark:border-slate-700">
                      <Link
                        href={role === "Student" ? "/dashboard" : "/counselor/profile"}
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setIsFabOpen(false);
                        }}
                        className="w-full text-left flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-gray-700 dark:text-gray-300"
                      >
                        <UserIcon size={16} /> My Profile
                      </Link>
                    </div>

                    {/* Simulation Controls (Admins Only) */}
                    {isAdmin && (
                      <div className="p-2 border-b border-gray-100 dark:border-slate-700">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">
                          Simulate View
                        </p>
                        <button
                          onClick={() => {
                            setSimulatedRole("Counselor");
                            setProfileDropdownOpen(false);
                            setIsFabOpen(false);
                            window.location.reload();
                          }}
                          className={`w-full text-left flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${
                            simulatedRole === "Counselor"
                              ? "text-[#1a73e8] bg-blue-50 dark:bg-blue-900/20"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <Eye size={16} /> Counselor View
                        </button>
                        <button
                          onClick={() => {
                            setSimulatedRole("Student");
                            setProfileDropdownOpen(false);
                            setIsFabOpen(false);
                            window.location.reload();
                          }}
                          className={`w-full text-left flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${
                            simulatedRole === "Student"
                              ? "text-[#1a73e8] bg-blue-50 dark:bg-blue-900/20"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <UserIcon size={16} /> Student View
                        </button>

                        {simulatedRole && (
                          <button
                            onClick={() => {
                              setSimulatedRole(null);
                              setProfileDropdownOpen(false);
                              setIsFabOpen(false);
                              window.location.reload();
                            }}
                            className="w-full text-left flex items-center gap-3 px-3 py-2 mt-1 text-xs font-black rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 transition-colors"
                          >
                            <ShieldAlert size={16} /> Exit Simulation
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
      {!isStudent && mobileDrawerOpen && (
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

      {/* ── Fixed Bottom Mobile Navigation Bar (Thumb Friendly) ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-slate-800 px-3 py-2 flex items-center justify-around shadow-2xl">
        {navLinks.slice(0, 4).map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href.split("?")[0]);
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all touch-target ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'} />
              <span className="text-[9px] font-black uppercase tracking-wider">{link.name.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
