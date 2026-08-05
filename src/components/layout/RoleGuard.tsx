"use client";

import React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FullScreenLoader from '@/components/common/FullScreenLoader';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { role, loading } = useAuth();
  const router = useRouter();

  if (loading) return <FullScreenLoader />;

  if (!role || !allowedRoles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-6 space-y-6">
        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center border border-rose-500/20">
          <ShieldAlert size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Access Denied</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm font-bold leading-relaxed max-w-md">
            You do not have the required permissions to view this secure administrative area.
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
