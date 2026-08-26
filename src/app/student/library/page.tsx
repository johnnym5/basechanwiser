'use client';

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth/auth-context';
import AppShell from '@/components/layout/app-shell';
import ResourcePreviewModal from '@/components/library/ResourcePreviewModal';
import { BookOpen, FileText, Loader2, Video, Link2 } from 'lucide-react';
import EmptyState from "@/components/common/EmptyState";

/**
 * Student Library: The primary entry point for study materials.
 * Paradigm: "Study First, Quiz Later"
 */
export default function StudentLibrary() {
  const { userId, userProfile } = useAuth();
  const [resources, setResources] = useState<any[]>([]);
  const [selectedResource, setSelectedResource] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    // Students see public resources OR those specifically assigned to them.
    const q = query(
      collection(db, 'library_resources'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allResources = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter for student visibility: isPublic OR assigned to this student
      const visible = allResources.filter((res: any) =>
        res.isPublic === true || (res.assignedStudentIds && res.assignedStudentIds.includes(userId))
      );

      setResources(visible);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching library:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return (
    <AppShell>
      <div className="space-y-10 animate-in fade-in duration-500 pb-20">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-indigo-500" /> Study Materials
            </h1>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest leading-relaxed max-w-2xl">
              Review official guides, UKVI briefings, and university preparation materials before attempting compliance assessments.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Hydrating Resource Vault...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resources.length === 0 ? (
              <div className="col-span-full">
                 <EmptyState
                   icon={FileText}
                   title="No Study Materials"
                   description="Your counselor hasn't assigned any resources yet. Check back soon for UKVI guides."
                 />
              </div>
            ) : resources.map(file => (
              <div
                key={file.id}
                onClick={() => setSelectedResource(file)}
                className="bg-white dark:bg-[#1E293B] rounded-[40px] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-2xl hover:border-indigo-500/50 transition-all duration-300 cursor-pointer relative"
              >
                {/* Visual Type Indicator */}
                <div className="p-8 flex-1 space-y-4">
                  <div className="w-16 h-16 rounded-[24px] bg-gray-50 dark:bg-[#0F172A] border border-gray-100 dark:border-slate-800 flex items-center justify-center mb-6 transition-all group-hover:scale-110">
                    {file.fileType === 'pdf' && <FileText className="w-8 h-8 text-rose-500" />}
                    {file.fileType === 'video' && <Video className="w-8 h-8 text-blue-500" />}
                    {file.fileType === 'doc' && <FileText className="w-8 h-8 text-emerald-500" />}
                    {file.fileType === 'link' && <Link2 className="w-8 h-8 text-indigo-500" />}
                  </div>

                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none truncate">{file.title}</h3>
                  <p className="text-sm text-gray-500 font-bold leading-relaxed line-clamp-3">{file.description || 'Official Resource Document'}</p>

                  {file.linkedPackId && (
                    <div className="mt-4 inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                      Assessment Linked
                    </div>
                  )}
                </div>

                <div className="p-8 pt-0">
                   <div className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-[24px] text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg">
                      Study Material
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedResource && (
          <ResourcePreviewModal
            resource={selectedResource}
            onClose={() => setSelectedResource(null)}
          />
        )}
      </div>
    </AppShell>
  );
}
