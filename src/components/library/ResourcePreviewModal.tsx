'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { X, Target } from 'lucide-react';

export default function ResourcePreviewModal({ resource, onClose }: { resource: any, onClose: () => void }) {
  const router = useRouter();

  if (!resource) return null;

  const handleProceed = () => {
    // Navigate to the learning section, automatically opening the linked module
    router.push(`/learning/detail?packId=${resource.linkedPackId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in">
      <div className="w-full max-w-6xl h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">{resource.title}</h2>
            <p className="text-xs text-slate-400">{resource.description}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Document iFrame */}
        <div className="flex-1 bg-slate-950 w-full relative">
          <iframe
            src={resource.fileUrl}
            className="w-full h-full border-0 absolute inset-0"
            title={resource.title}
            allow="autoplay"
          />
        </div>

        {/* Action Footer */}
        {resource.linkedPackId && (
          <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 flex justify-center">
            <button
              onClick={handleProceed}
              className="flex items-center px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:scale-105"
            >
              <Target className="w-5 h-5 mr-3" />
              I have finished reading. Start Assessment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
