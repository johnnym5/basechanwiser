"use client";

import React, { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { auth } from "@/lib/firebase/config";
import { AnalyticsDashboardData } from "@/types";
import { downloadCsv } from "@/lib/utils/csv-export";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  ShieldCheck,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  BarChart3,
} from "lucide-react";

const CHART_COLORS = ["#1a73e8", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];
const PIE_COLORS = ["#1a73e8", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899", "#64748B"];

const ANALYTICS_ROLES = ["Super Admin", "Head of Compliance"];

interface ComplianceAnalyticsDashboardProps {
  redirectPath?: string;
}

export default function ComplianceAnalyticsDashboard({
  redirectPath = "/login",
}: ComplianceAnalyticsDashboardProps) {
  const { role, loading: authLoading } = useAuth();
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const isAuthorized = role != null && ANALYTICS_ROLES.includes(role);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not authenticated");

      const res = await fetch("/api/admin/analytics", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load analytics");
      setData(json as AnalyticsDashboardData);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthorized) {
      fetchAnalytics();
    }
  }, [authLoading, isAuthorized, fetchAnalytics]);

  useEffect(() => {
    if (!authLoading && role && !isAuthorized) {
      window.location.href = redirectPath;
    }
  }, [authLoading, role, isAuthorized, redirectPath]);

  const handleExportRoster = () => {
    if (!data) return;
    downloadCsv(
      `student-roster-${new Date().toISOString().slice(0, 10)}.csv`,
      data.studentRoster as unknown as Record<string, unknown>[]
    );
    setExportMenuOpen(false);
  };

  const handleExportCounselorPerformance = () => {
    if (!data) return;
    downloadCsv(
      `counselor-performance-${new Date().toISOString().slice(0, 10)}.csv`,
      data.counselorPerformance as unknown as Record<string, unknown>[]
    );
    setExportMenuOpen(false);
  };

  const StatCard = ({
    title,
    value,
    sub,
    icon: Icon,
    accent,
  }: {
    title: string;
    value: string | number;
    sub: string;
    icon: React.ElementType;
    accent: string;
  }) => (
    <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500">
          {title}
        </span>
        <div className={`p-2 rounded-xl ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-3xl font-black text-gray-900 dark:text-white">{value}</span>
        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500">{sub}</span>
      </div>
    </div>
  );

  if (authLoading || (!isAuthorized && !role)) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a73e8]" />
        </div>
      </AppShell>
    );
  }

  if (!isAuthorized) return null;

  return (
    <AppShell>
      <div className="max-w-[1600px] mx-auto space-y-8 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 font-google">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#1a73e8] dark:text-blue-400" />
              Compliance Analytics Dashboard
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Executive-level insights across all offices, counselors, and student pipelines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>

            <div className="relative">
              <button
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                disabled={!data}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#1a73e8] text-white shadow-lg hover:bg-[#1557b0] transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Generate Report
              </button>

              {exportMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setExportMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 p-2 z-50">
                    <button
                      onClick={handleExportRoster}
                      className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-3 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                      Export Student Roster
                    </button>
                    <button
                      onClick={handleExportCounselorPerformance}
                      className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-3 transition-colors"
                    >
                      <BarChart3 className="w-4 h-4 text-purple-500" />
                      Export Counselor Performance
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm font-bold">
            {error}
          </div>
        )}

        {loading && !data ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a73e8]" />
          </div>
        ) : data ? (
          <>
            {/* Global KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                title="Total Pipeline"
                value={data.kpis.totalPipeline}
                sub="Active students on platform"
                icon={Users}
                accent="bg-blue-50 dark:bg-blue-900/30 text-blue-600"
              />
              <StatCard
                title="Global Pass Rate"
                value={`${data.kpis.globalPassRate}%`}
                sub="Students with Green status"
                icon={TrendingUp}
                accent="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"
              />
              <StatCard
                title="Avg Prep Time"
                value={`${data.kpis.averagePrepTimeDays}d`}
                sub="Account creation → Green status"
                icon={Clock}
                accent="bg-amber-50 dark:bg-amber-900/30 text-amber-600"
              />
              <StatCard
                title="High-Risk Alert"
                value={data.kpis.highRiskAlert}
                sub="Students in Red status"
                icon={AlertTriangle}
                accent="bg-rose-50 dark:bg-rose-900/30 text-rose-600"
              />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Office Performance */}
              <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6">
                  Office Performance
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.officePerformance} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="office" tick={{ fontSize: 11, fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                    <Bar dataKey="totalStudents" name="Total Students" fill="#1a73e8" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="passRate" name="Pass Rate (%)" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Readiness Funnel */}
              <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6">
                  Readiness Funnel
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data.readinessFunnel}>
                    <defs>
                      <linearGradient id="funnelGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1a73e8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="stage"
                      tick={{ fontSize: 10, fontWeight: 700 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#1a73e8"
                      strokeWidth={2}
                      fill="url(#funnelGradient)"
                      name="Students"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Counselor Workload */}
              <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6">
                  Counselor Workload
                </h3>
                {data.counselorWorkload.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={data.counselorWorkload}
                        dataKey="studentCount"
                        nameKey="counselorName"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        label={({ counselorName, studentCount }) =>
                          `${counselorName}: ${studentCount}`
                        }
                        labelLine={false}
                      >
                        {data.counselorWorkload.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "none",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-sm text-gray-400 font-bold">
                    No counselor data available
                  </div>
                )}
              </div>

              {/* Common Failure Reasons */}
              <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6">
                  Common Failure Reasons
                </h3>
                {data.failureReasons.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={data.failureReasons}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis
                        dataKey="reason"
                        tick={{ fontSize: 9, fontWeight: 700 }}
                      />
                      <PolarRadiusAxis tick={{ fontSize: 10 }} />
                      <Radar
                        name="Occurrences"
                        dataKey="count"
                        stroke="#EF4444"
                        fill="#EF4444"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "none",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-sm text-gray-400 font-bold">
                    No red flag data recorded yet
                  </div>
                )}
              </div>
            </div>

            {/* Failure Reasons Bar (supplementary) */}
            {data.failureReasons.length > 0 && (
              <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6">
                  Red Flag Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.failureReasons} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="reason"
                      tick={{ fontSize: 10, fontWeight: 700 }}
                      width={160}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    />
                    <Bar dataKey="count" name="Occurrences" fill="#EF4444" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {data.generatedAt && (
              <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold text-center">
                Last updated: {new Date(data.generatedAt).toLocaleString()}
              </p>
            )}
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
