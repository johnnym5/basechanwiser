'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DRIVE_CONFIG } from '@/lib/constants/drive';
import { FolderLock, ExternalLink, X, Shield, RefreshCw, Layers } from 'lucide-react';

interface DriveVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DriveVaultModal({ isOpen, onClose }: DriveVaultModalProps) {
  const { userProfile } = useAuth();
  const [iframeKey, setIframeKey] = useState(0);

  if (!isOpen) return null;

  const isStaff = userProfile?.role === 'Counselor' || userProfile?.role === 'Admin' || userProfile?.role === 'Super Admin';

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-7xl h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Modal Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <FolderLock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">Central Google Drive Workspace</h2>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                  isStaff
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                }`}>
                  {isStaff ? 'Staff Manager Mode' : 'Student Reader'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isStaff
                  ? 'Manage, organize, and inspect uploaded study materials in real-time.'
                  : 'Access official UKVI preparation documents and video briefing notes.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Refresh Live Embed Feed */}
            <button
              onClick={handleRefresh}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Refresh Drive Feed"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* External Tab Fallback for Admins */}
            {isStaff && (
              <a
                href={DRIVE_CONFIG.FULL_WORKSPACE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center space-x-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-indigo-600/20 shrink-0"
              >
                <span>Drive Web app</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Close Pop-Up Modal */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security & Guidance Sub-Header */}
        <div className="flex items-center justify-between px-6 py-2 bg-slate-950/60 border-b border-slate-800 text-xs shrink-0">
          <div className="flex items-center text-slate-400 space-x-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Interactive Repository View</span>
          </div>
          <div className="flex items-center text-[11px] text-slate-500 space-x-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isStaff ? 'Full Administrative Visibility Active' : 'Protected Read-Only Session'}</span>
          </div>
        </div>

        {/* Main Embedded Drive View - Fixed Blank Page Issue */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden">
          <iframe
            key={iframeKey}
            src={DRIVE_CONFIG.EMBED_FOLDER_URL}
            className="w-full h-full border-0 bg-slate-950"
            title="Google Drive Document Repository"
          />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            BASECHANWISER Compliance OS • Document Management System
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors"
          >
            Close Pop-Up Window
          </button>
        </div>

      </div>
    </div>
  );
}
