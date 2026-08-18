"use client";

import React, { useState } from "react";
import {
  X,
  StickyNote,
  Save,
  Loader2,
  AlertCircle
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth/auth-context";

interface QuickNoteModalProps {
  student: {
    uid: string;
    displayName: string | null;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuickNoteModal({ student, onClose, onSuccess }: QuickNoteModalProps) {
  const { user } = useAuth();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!note.trim() || !user) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "activity_logs"), {
        studentId: student.uid,
        studentName: student.displayName || "Unknown Scholar",
        counselorId: user.uid,
        counselorName: user.displayName || "Counselor",
        type: "NOTE",
        action: `Staff Note: ${note}`,
        createdAt: serverTimestamp()
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to save note:", err);
      alert("Note preservation failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[40px] p-10 shadow-2xl border border-gray-100 dark:border-slate-700 space-y-8"
      >
        <div className="flex items-center gap-4 text-amber-500">
           <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center"><StickyNote size={32} /></div>
           <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white leading-none">Quick Note</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">For: {student.displayName}</p>
           </div>
        </div>

        <div className="space-y-4">
           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
              Notes are preserved in the student timeline for compliance audit and internal staff handovers.
           </p>
           <textarea
             value={note}
             onChange={e => setNote(e.target.value)}
             rows={4}
             className="w-full bg-gray-50 dark:bg-[#0F172A] border-none rounded-3xl p-6 text-sm font-bold focus:ring-2 focus:ring-amber-500 dark:text-white resize-none"
             placeholder="Enter operational notes..."
           />
        </div>

        <div className="flex gap-4 pt-4">
           <button onClick={onClose} className="flex-1 py-4 text-xs font-black uppercase text-gray-400">Cancel</button>
           <button
             onClick={handleSave}
             disabled={saving || !note.trim()}
             className="flex-2 px-8 py-4 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
           >
              {saving ? <Loader2 className="animate-spin" /> : <Save size={18} className="inline mr-2" />}
              Save to Timeline
           </button>
        </div>
      </motion.div>
    </div>
  );
}
