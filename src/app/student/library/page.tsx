"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { LibraryResource } from "@/types/resource";
import { FileText, Video, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/common/EmptyState";
import { DRIVE_CONFIG } from "@/lib/constants/drive";
import DriveVaultModal from "@/components/library/DriveVaultModal";
import { FolderLock, ShieldCheck, Globe } from "lucide-react";

export default function StudentLibraryPage() {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const snap = await getDocs(query(collection(db, "library_resources"), orderBy("createdAt", "desc")));
        setResources(snap.docs.map(d => ({ id: d.id, ...d.data() } as LibraryResource)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  return (
    <AppShell>
      <div className="space-y-10 animate-in fade-in duration-500">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">My Learning Modules</h1>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Review study materials before attempting assessments.</p>
          </div>
          <button
            onClick={() => setIsDriveModalOpen(true)}
            className="px-6 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white font-black rounded-full text-xs uppercase tracking-widest shadow-sm hover:scale-105 transition-all flex items-center gap-2 shrink-0"
          >
            <Globe className="w-4 h-4 text-blue-500" /> Drive Workspace
          </button>
        </div>

        {/* Embedded Live Google Drive Vault Container - FIXES BLANK PAGE ISSUE */}
        <div className="space-y-4">
           <div className="flex items-center justify-between p-6 bg-slate-900/50 border border-slate-800 rounded-[32px] shadow-sm">
              <div className="flex items-center space-x-4">
                 <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                    <FolderLock className="w-6 h-6 text-indigo-400" />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">Shared Resource Repository</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Browse official UKVI preparation guides</p>
                 </div>
              </div>
              <span className="text-[10px] font-black uppercase px-4 py-2 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4" /> Live Drive Sync
              </span>
           </div>

           {/* Live Folder View directly inside the page body */}
           <div className="w-full h-[60vh] bg-slate-950 border border-slate-800 rounded-[40px] overflow-hidden shadow-2xl relative">
              <iframe
                src={DRIVE_CONFIG.EMBED_FOLDER_URL}
                className="w-full h-full border-0 bg-slate-950"
                title="Google Drive Live Resource Repository"
              />
           </div>
        </div>

        {/* Individual Study Modules */}
        <div className="space-y-6 pt-10 border-t border-slate-800">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Individual Study Guides</h2>

          {loading ? (
            <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
               {resources.length === 0 ? (
                  <div className="col-span-full">
                     <EmptyState
                       icon={FileText}
                       title="No Learning Materials"
                       description="There are no individual resources available right now. Browse the Drive repository above."
                     />
                  </div>
               ) : resources.map(res => (
                 <div key={res.id} className="bg-white dark:bg-[#1E293B] rounded-[40px] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300">
                    <div className="p-8 flex-1 space-y-4">
                       <div className="w-16 h-16 rounded-[24px] bg-gray-50 dark:bg-[#0F172A] border border-gray-100 dark:border-slate-800 flex items-center justify-center mb-6">
                          {res.fileType === 'pdf' && <FileText className="w-8 h-8 text-rose-500" />}
                          {res.fileType === 'video' && <Video className="w-8 h-8 text-blue-500" />}
                          {res.fileType === 'doc' && <FileText className="w-8 h-8 text-emerald-500" />}
                       </div>
                       <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">{res.title}</h3>
                       <p className="text-sm text-gray-500 font-bold leading-relaxed line-clamp-3">{res.description}</p>
                    </div>
                    <div className="p-8 pt-0">
                       <Link
                         href={`/student/library/viewer?id=${res.id}`}
                         className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-[24px] text-xs uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-[#1a73e8] group-hover:text-white transition-all"
                       >
                          Start Learning <ArrowRight className="w-4 h-4" />
                       </Link>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>

        <DriveVaultModal
          isOpen={isDriveModalOpen}
          onClose={() => setIsDriveModalOpen(false)}
        />
      </div>
    </AppShell>
  );
}
