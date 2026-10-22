"use client";

import React from "react";
import AppShell from "@/components/layout/app-shell";
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";
import Link from "next/link";
import {
  BarChart3,
  Users,
  LayoutGrid,
  BookOpen,
  Settings,
  ShieldCheck,
  ArrowUpRight,
  Activity
} from "lucide-react";

export default function AdminDashboardPage() {
  const quickActions = [
    {
      title: "Student Roster",
      desc: "Manage enrolled scholars & assign counselors",
      href: "/counselor/students",
      icon: Users,
      color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800"
    },
    {
      title: "Course Manager",
      desc: "Configure test question sets & modules",
      href: "/counselor/academy-manager",
      icon: LayoutGrid,
      color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200 dark:border-indigo-800"
    },
    {
      title: "Academy Vault",
      desc: "Upload & manage study files and guides",
      href: "/counselor/library",
      icon: BookOpen,
      color: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 border-purple-200 dark:border-purple-800"
    },
    {
      title: "Platform Settings",
      desc: "System security, branding & rubrics",
      href: "/counselor/settings",
      icon: Settings,
      color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200 dark:border-emerald-800"
    }
  ];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">

        {/* Executive Command Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-200 dark:border-indigo-800">
              <ShieldCheck size={14} /> Executive Admin Command Center
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter font-google flex items-center gap-3">
              <BarChart3 className="w-9 h-9 text-indigo-600" /> Executive Analytics & Compliance
            </h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
              Institutional performance tracking, candidate progress monitoring & counselor review loads.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-sm">
              <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">System Status</p>
                <p className="text-xs font-black text-slate-900 dark:text-white uppercase">Operational 100%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Admin Action Gateway */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Quick Operations Gateway</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <Link
                  key={idx}
                  href={action.href}
                  className="group bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3.5 rounded-2xl border ${action.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold mt-1 line-clamp-2 uppercase tracking-wider leading-relaxed">
                      {action.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Analytics & Metrics */}
        <div className="space-y-4 pt-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Institutional Performance & Review Load</h2>
          <AnalyticsCharts />
        </div>

      </div>
    </AppShell>
  );
}
