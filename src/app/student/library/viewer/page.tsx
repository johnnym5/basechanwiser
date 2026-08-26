"use client";

import React, { useState, useEffect, Suspense } from "react";
import AppShell from "@/components/layout/app-shell";
import { useSearchParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { LibraryResource } from "@/types/resource";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ChevronRight
} from "lucide-react";

function ViewerContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();
  const [resource, setResource] = useState<LibraryResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [canProceed, setCanProceed] = useState(false);

  useEffect(() => {
    // 5-second study timer before enabling quiz
    const timer = setTimeout(() => setCanProceed(true), 5000);
    return () => clearTimeout(timer);
  }, [id]);

  useEffect(() => {
    if (id) {
      const fetchResource = async () => {
        try {
          const snap = await getDoc(doc(db, "library_resources", id));
          if (snap.exists()) {
            setResource({ id: snap.id, ...snap.data() } as LibraryResource);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      fetchResource();
    }
  }, [id]);

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;
  }

  if (!resource) {
    return (
      <div className="text-center p-20">
        <p className="text-gray-400 font-black uppercase">Resource not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-blue-500 font-bold uppercase text-xs underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-32">
      <div className="flex items-center justify-between">
         <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white font-black uppercase text-[10px] transition-all">
            <ArrowLeft className="w-4 h-4" /> Back to Library
         </button>
         <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300 text-[10px] font-black uppercase">
               {resource.fileType}
            </span>
         </div>
      </div>

      <div className="space-y-1">
         <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{resource.title}</h1>
         <p className="text-sm text-gray-500 font-bold max-w-2xl leading-relaxed">{resource.description}</p>
      </div>

      {/* ── Viewer ── */}
      <div className="bg-white dark:bg-[#1E293B] rounded-[40px] border border-gray-100 dark:border-slate-800 overflow-hidden shadow-2xl">
         {resource.fileType === 'pdf' && (
            <iframe
              src={`${resource.fileUrl}#toolbar=0`}
              className="w-full h-[75vh] border-none"
              title={resource.title}
            />
         )}

         {resource.fileType === 'video' && (
            <div className="bg-black aspect-video flex items-center justify-center">
               <video controls className="w-full h-full max-h-[75vh]" autoPlay>
                  <source src={resource.fileUrl} type="video/mp4" />
                  Your browser does not support the video tag.
               </video>
            </div>
         )}

         {resource.fileType === 'doc' && (
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(resource.fileUrl)}&embedded=true`}
              className="w-full h-[75vh] border-none"
              title={resource.title}
            />
         )}
      </div>

      {/* ── CTA ── */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-40 space-y-3">
         {resource.linkedPackId ? (
            <>
              <button
                onClick={() => router.push(`/learning/detail?id=${resource.linkedPackId}`)}
                disabled={!canProceed}
                className="w-full py-5 bg-[#1a73e8] text-white font-black rounded-[24px] text-sm uppercase tracking-widest shadow-[0_20px_50px_rgba(26,115,232,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
              >
                {canProceed ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Complete Material & Start Quiz
                    <ChevronRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Reviewing Material...
                  </>
                )}
              </button>

              {!canProceed && (
                <button
                  onClick={() => router.push(`/learning/detail?id=${resource.linkedPackId}`)}
                  className="w-full py-3 bg-white/10 backdrop-blur-md text-white/60 hover:text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all"
                >
                  Skip Study & Go to Quiz
                </button>
              )}
            </>
         ) : (
            <button
              onClick={() => router.push('/student/library')}
              className="w-full py-5 bg-slate-800 text-white font-black rounded-[24px] text-sm uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
               <CheckCircle2 className="w-5 h-5 text-emerald-500" />
               Finish Reading & Return
            </button>
         )}
      </div>
    </div>
  );
}

export default function StudentResourceViewerPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-20 text-center"><Loader2 className="animate-spin inline mr-2" /> Loading viewer...</div>}>
        <ViewerContent />
      </Suspense>
    </AppShell>
  );
}
