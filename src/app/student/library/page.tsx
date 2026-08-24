"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { LibraryResource } from "@/types/resource";
import { FileText, Video, Loader2, ArrowRight, BookOpen, ShieldCheck } from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/common/EmptyState";

export default function StudentLibraryPage() {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [loading, setLoading] = useState(true);

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
            <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" /> Academy Library
            </h1>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Review study materials before attempting assessments.</p>
          </div>
          <div className="px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck size={14} /> Secure Vault Active
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Synchronizing learning track...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
             {resources.length === 0 ? (
                <div className="col-span-full">
                   <EmptyState
                     icon={FileText}
                     title="No Learning Materials"
                     description="There are no resources available right now. Check back later or ask your counselor to add new study guides."
                   />
                </div>
             ) : resources.map(res => (
               <div key={res.id} className="bg-white dark:bg-[#1E293B] rounded-[40px] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300">
                  <div className="p-8 flex-1 space-y-4">
                     <div className="w-16 h-16 rounded-[24px] bg-gray-50 dark:bg-[#0F172A] border border-gray-100 dark:border-slate-800 flex items-center justify-center mb-6 transition-all group-hover:scale-110">
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
                       className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-[24px] text-xs uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-[#1a73e8] group-hover:text-white transition-all shadow-lg"
                     >
                        Launch Learning Module <ArrowRight className="w-4 h-4" />
                     </Link>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
