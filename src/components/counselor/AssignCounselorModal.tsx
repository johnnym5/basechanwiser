"use client";

import React, { useState } from "react";
import { X, UserCheck, Loader2, ShieldAlert } from "lucide-react";
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserProfile } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

interface AssignCounselorModalProps {
  student: UserProfile;
  counselors: UserProfile[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignCounselorModal({ student, counselors, onClose, onSuccess }: AssignCounselorModalProps) {
  const [selectedId, setSelectedId] = useState(student.assignedCounselorId || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAssign = async () => {
    if (!selectedId) return;
    setIsSubmitting(true);
    try {
      // 1. Update Student Profile in Firestore
      const studentRef = doc(db, "Users", student.uid);
      await updateDoc(studentRef, {
        assignedCounselorId: selectedId,
        updatedAt: serverTimestamp()
      });

      // 2. Notification Groundwork: Alert the new Counselor
      // We log this in a 'notifications' collection which the global bell listener monitors.
      await addDoc(collection(db, "notifications"), {
        targetUserId: selectedId,
        title: "New Student Assigned",
        message: `${student.displayName || 'A new student'} has been reassigned to your portfolio.`,
        type: "assignment",
        isRead: false,
        actionUrl: `/counselor/students/portfolio?id=${student.uid}`,
        createdAt: serverTimestamp()
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("[AssignModal] Error:", error);
      alert("Failed to reassign student. Please check permissions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[40px] p-10 shadow-2xl border border-gray-100 dark:border-slate-700 relative"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <UserCheck size={32} />
            </div>
            <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Reassign Counselor</h2>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">For {student.displayName}</p>
          </div>

          <div className="space-y-4">
             <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Select Staff Member</label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-900 border-none rounded-2xl px-5 py-4 text-sm font-black text-[#1a73e8] focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="">-- Choose Counselor --</option>
                  {counselors.map(c => (
                    <option key={c.uid} value={c.uid}>{c.displayName} ({c.role})</option>
                  ))}
                </select>
             </div>

             <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 flex items-start gap-3">
                <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed uppercase">
                  Note: Reassigning a student will immediately notify the new counselor via the global alert system.
                </p>
             </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleAssign}
              disabled={isSubmitting || !selectedId}
              className="w-full py-5 bg-[#1a73e8] text-white font-black rounded-full text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin size={18}" /> : <UserCheck size={18} />}
              Confirm Reassignment
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
