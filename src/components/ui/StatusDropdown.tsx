"use client";

import { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface StatusDropdownProps {
  studentId: string;
  initialStatus: string;
  onStatusChange?: (id: string, newStatus: string) => void;
}

/**
 * StatusDropdown: Implements manual status flagging for counselors and admins.
 * Provides a sleek, interactive badge to override the automated readiness engine.
 */
export default function StatusDropdown({ studentId, initialStatus, onStatusChange }: StatusDropdownProps) {
  // Map legacy/mixed-case status strings to strict system enums
  const normalizeStatus = (s: string) => {
    const upper = s?.toUpperCase();
    if (!upper || upper === 'GRAY' || upper === 'NOT STARTED') return 'NOT_STARTED';
    if (upper === 'AMBER' || upper === 'YELLOW' || upper === 'ORANGE') return 'IN_PROGRESS';
    if (upper === 'RED') return 'AT_RISK';
    if (upper === 'GREEN') return 'INTERVIEW_READY';
    return upper;
  };

  const [status, setStatus] = useState(normalizeStatus(initialStatus));
  const [isUpdating, setIsUpdating] = useState(false);

  const getStyles = (currentStatus: string) => {
    switch (currentStatus?.toUpperCase()) {
      case 'INTERVIEW_READY':
      case 'GREEN':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'AT_RISK':
      case 'RED':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'IN_PROGRESS':
      case 'AMBER':
      case 'YELLOW':
      case 'ORANGE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-800/50 text-slate-400 border-slate-700'; // NOT_STARTED / GRAY
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    const prevStatus = status;
    setStatus(newStatus);
    setIsUpdating(true);

    try {
      const studentRef = doc(db, 'Users', studentId);
      await updateDoc(studentRef, {
        readinessStatus: newStatus,
        updatedAt: serverTimestamp()
      });

      if (onStatusChange) onStatusChange(studentId, newStatus);

    } catch (error: any) {
      console.error("Failed to update status", error);
      setStatus(prevStatus); // Revert on failure
      alert(`Database Error: Could not save status. ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative inline-block group">
      <select
        value={status}
        onChange={handleStatusChange}
        disabled={isUpdating}
        className={`appearance-none inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap border cursor-pointer focus:outline-none transition-all pr-7 tracking-widest uppercase ${getStyles(status)} ${isUpdating ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}
      >
        <option value="NOT_STARTED" className="bg-slate-900 text-slate-300">NOT STARTED</option>
        <option value="IN_PROGRESS" className="bg-slate-900 text-amber-400">IN PROGRESS</option>
        <option value="AT_RISK" className="bg-slate-900 text-red-400">AT RISK</option>
        <option value="INTERVIEW_READY" className="bg-slate-900 text-emerald-400">INTERVIEW READY</option>
      </select>

      {/* Custom dropdown arrow to fit the badge aesthetic */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-50 group-hover:opacity-100 transition-opacity">
        <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
        </svg>
      </div>
    </div>
  );
}
