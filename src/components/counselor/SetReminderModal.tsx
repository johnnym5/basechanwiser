"use client";

import React, { useState } from "react";
import { X, CalendarPlus, Loader2 } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth/auth-context";

interface SetReminderModalProps {
  student: {
    uid: string;
    studentId?: string;
    displayName: string | null;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SetReminderModal({ student, onClose, onSuccess }: SetReminderModalProps) {
  const { user } = useAuth();
  const [reminderData, setReminderData] = useState({ date: "", time: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reminderData.date || !reminderData.time || !reminderData.message) return;

    setIsSaving(true);
    try {
      const triggerAt = new Date(`${reminderData.date}T${reminderData.time}`).getTime();
      await addDoc(collection(db, "reminders"), {
        studentId: student.studentId || "N/A",
        studentUid: student.uid,
        counselorUid: user.uid,
        message: reminderData.message,
        triggerAt,
        isTriggered: false,
        createdAt: serverTimestamp(),
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Set reminder error:", err);
      alert("Failed to set reminder.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-[40px] p-10 space-y-6 shadow-2xl border border-gray-100 dark:border-slate-800 animate-in zoom-in duration-200">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Schedule Reminder</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">For {student.displayName || "Student"}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Date</label>
              <input
                type="date"
                required
                value={reminderData.date}
                onChange={e => setReminderData({...reminderData, date: e.target.value})}
                className="w-full bg-gray-50 dark:bg-[#0F172A] border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Time</label>
              <input
                type="time"
                required
                value={reminderData.time}
                onChange={e => setReminderData({...reminderData, time: e.target.value})}
                className="w-full bg-gray-50 dark:bg-[#0F172A] border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Reminder Message</label>
            <textarea
              required
              rows={3}
              value={reminderData.message}
              onChange={e => setReminderData({...reminderData, message: e.target.value})}
              placeholder="e.g., Check CAS document status..."
              className="w-full bg-gray-50 dark:bg-[#0F172A] border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-5 bg-purple-600 text-white font-black rounded-3xl text-sm uppercase tracking-widest shadow-2xl shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CalendarPlus className="w-5 h-5" />}
            Set Reminder
          </button>
        </form>
      </div>
    </div>
  );
}
