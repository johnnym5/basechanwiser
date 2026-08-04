"use client";

import React from "react";
import Image from "next/image";
import { AlertCircle, Clock, ShieldAlert } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0F172A] flex flex-col items-center justify-center p-4 text-center space-y-8 animate-in fade-in duration-700">
      <div className="relative">
        <div className="absolute -inset-4 bg-amber-500/20 blur-2xl rounded-full animate-pulse" />
        <Image src="/logo.png" alt="BASECHANWISER" width={100} height={100} className="relative drop-shadow-2xl" />
      </div>

      <div className="space-y-4 max-w-lg">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white font-google tracking-tighter flex items-center justify-center gap-3">
          <ShieldAlert className="w-10 h-10 text-amber-500" /> System Maintenance
        </h1>
        <p className="text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest text-sm">
          Platform temporarily offline
        </p>
        <div className="h-1 w-20 bg-amber-500 mx-auto rounded-full" />
        <p className="text-gray-600 dark:text-slate-300 leading-relaxed font-medium">
          BASECHANWISER is currently undergoing critical system updates to enhance your learning experience.
          We apologize for the inconvenience. Please check back later.
        </p>
      </div>

      <div className="flex items-center gap-6 pt-4">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1E293B] shadow-lg flex items-center justify-center border border-gray-100 dark:border-slate-800">
             <Clock className="w-6 h-6 text-[#1a73e8]" />
          </div>
          <span className="text-[10px] font-black uppercase text-gray-400">Scheduled Finish</span>
          <span className="text-xs font-bold dark:text-white">~ 2 Hours</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1E293B] shadow-lg flex items-center justify-center border border-gray-100 dark:border-slate-800">
             <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
          <span className="text-[10px] font-black uppercase text-gray-400">Status</span>
          <span className="text-xs font-bold dark:text-white">Active Updates</span>
        </div>
      </div>

      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
        Counselors and Admins still have full backend access.
      </p>
    </div>
  );
}
