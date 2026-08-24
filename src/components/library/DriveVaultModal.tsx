'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DRIVE_CONFIG } from '@/lib/constants/drive';
import { FolderLock, ExternalLink, X, Shield, BookOpen, Layers } from 'lucide-react';

interface DriveVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToQuiz?: (packId: string) => void;
}

export default function DriveVaultModal({ isOpen, onClose, onNavigateToQuiz }: DriveVaultModalProps) {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'vault' | 'linked_modules'>('vault');

  if (!isOpen) return null;

  const isStaff = userProfile?.role === 'Counselor' || userProfile?.role === 'Admin' || userProfile?.role === 'Super Admin';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[88vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/90 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <FolderLock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">Central Resource Vault</h2>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  isStaff
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                }`}>
                  {isStaff ? 'Admin / Manager View' : 'Student Reader'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isStaff
                  ? 'Manage organizational assets, updates, and linked training packages.'
                  : 'Access UKVI guides, compliance documents, and video briefing notes.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* RBAC GATE: Only Counselors/Admins get the direct Google Drive external link */}
            {isStaff && (
              <a
                href={DRIVE_CONFIG.FULL_WORKSPACE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-indigo-600/20"
              >
                <span>Open in Drive Workspace</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Sub-Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-2 bg-slate-950/50 border-b border-slate-800 text-xs shrink-0">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                activeTab === 'vault' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Drive Repository</span>
            </button>
          </div>

          {/* RBAC Notice */}
          <div className="flex items-center text-[11px] text-slate-500 space-x-1">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>{isStaff ? 'RBAC Level 2: Edit & Upload Enabled' : 'RBAC Level 1: Secure In-App Preview Only'}</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden">
          {activeTab === 'vault' && (
            <iframe
              src={DRIVE_CONFIG.EMBED_FOLDER_URL}
              className="w-full h-full border-0 bg-slate-950"
              title="Google Drive Document Repository"
            />
          )}
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
            Close Vault
          </button>
        </div>

      </div>
    </div>
  );
}
