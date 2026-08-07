"use client";

import React from "react";
import { useSettings } from "@/context/SettingsContext";
import { Clock, Bell, Zap, ToggleLeft, ToggleRight, Monitor, Mail, Wifi } from "lucide-react";

const TIMEZONES = [
  "Europe/London",
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Nairobi",
  "Asia/Dubai",
  "UTC"
];

export default function WorkflowTab() {
  const { userPreferences, updateUserPreferences } = useSettings();

  return (
    <div className="space-y-8">
      {/* Regional & Timezone */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
           <Clock className="text-indigo-500" size={24} />
           <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">Workflow & Regional</h2>
        </div>

        <div className="max-w-xs">
          <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Display Timezone</label>
          <select
            value={userPreferences?.timezone || "Europe/London"}
            onChange={(e) => updateUserPreferences({ timezone: e.target.value })}
            className="w-full bg-gray-50 dark:bg-slate-900 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500"
          >
            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
           <Bell className="text-amber-500" size={24} />
           <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">Notification Triggers</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <button
             onClick={() => updateUserPreferences({ emailNotifications: !userPreferences?.emailNotifications })}
             className="flex items-center justify-between p-6 rounded-3xl bg-gray-50 dark:bg-slate-900 border border-transparent hover:border-blue-500/50 transition-all"
           >
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-blue-500"><Mail size={20} /></div>
                 <span className="text-sm font-black dark:text-slate-300 uppercase tracking-tight">Email Notifications</span>
              </div>
              {userPreferences?.emailNotifications ? <ToggleRight className="text-emerald-500" /> : <ToggleLeft className="text-gray-300" />}
           </button>

           <button
             onClick={() => updateUserPreferences({ inAppNotifications: !userPreferences?.inAppNotifications })}
             className="flex items-center justify-between p-6 rounded-3xl bg-gray-50 dark:bg-slate-900 border border-transparent hover:border-blue-500/50 transition-all"
           >
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-blue-500"><Monitor size={20} /></div>
                 <span className="text-sm font-black dark:text-slate-300 uppercase tracking-tight">In-App Alerts</span>
              </div>
              {userPreferences?.inAppNotifications ? <ToggleRight className="text-emerald-500" /> : <ToggleLeft className="text-gray-300" />}
           </button>
        </div>
      </div>

      {/* Connectivity */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
           <Wifi className="text-emerald-500" size={24} />
           <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">Connectivity Optimization</h2>
        </div>

        <button
          onClick={() => updateUserPreferences({ lowBandwidthMode: !userPreferences?.lowBandwidthMode })}
          className="w-full flex items-center justify-between p-6 rounded-3xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-500/50 transition-all"
        >
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-500"><Zap size={20} /></div>
              <div className="text-left">
                 <span className="text-sm font-black dark:text-slate-200 uppercase tracking-tight block">Optimize Video Uploads</span>
                 <span className="text-[10px] font-bold text-gray-400 uppercase">Recommended for low-connectivity regions. Uses lower bitrate.</span>
              </div>
           </div>
           {userPreferences?.lowBandwidthMode ? <ToggleRight className="text-emerald-500" /> : <ToggleLeft className="text-gray-300" />}
        </button>
      </div>
    </div>
  );
}
