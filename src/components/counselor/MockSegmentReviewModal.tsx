"use client";

import React, { useState, useEffect } from 'react';
import { X, Star, Save, Loader2, PlayCircle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { MockInterviewAnswer, MockInterviewAttempt } from '@/types/mock';

interface MockSegmentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mockId: string;
  answerIndex: number;
  answer: MockInterviewAnswer;
  onSuccess: () => void;
}

export default function MockSegmentReviewModal({
  isOpen,
  onClose,
  mockId,
  answerIndex,
  answer,
  onSuccess
}: MockSegmentReviewModalProps) {
  const [stars, setStars] = useState<number>(0);
  const [remark, setRemark] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && answer) {
      // Initialize with existing data if available
      // Note: We might need to extend the type or use existing 'rating' logic
      setRemark(answer.feedback || '');
      // If we don't have stars yet, we can map 'good' to 5, 'average' to 3, 'bad' to 1 or just leave at 0
      if ((answer as any).stars) {
        setStars((answer as any).stars);
      } else if (answer.rating === 'good') {
        setStars(5);
      } else if (answer.rating === 'bad') {
        setStars(1);
      } else {
        setStars(0);
      }
    }
  }, [isOpen, answer]);

  const handleSave = async () => {
    if (!mockId) return;
    setIsSaving(true);
    try {
      const mockRef = doc(db, 'mock_interview_attempts', mockId);
      const snap = await getDoc(mockRef);

      if (snap.exists()) {
        const data = snap.data() as MockInterviewAttempt;
        const updatedAnswers = [...data.answers];

        updatedAnswers[answerIndex] = {
          ...updatedAnswers[answerIndex],
          feedback: remark,
          rating: stars >= 4 ? 'good' : stars === 3 ? 'average' : 'bad',
          // Persist the specific star count
          stars: stars
        } as any;

        await updateDoc(mockRef, {
          answers: updatedAnswers,
          updatedAt: serverTimestamp()
        });

        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Failed to save segment review:", error);
      alert("Failed to save review.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-[40px] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <PlayCircle size={24} />
             </div>
             <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Segment Performance Audit</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Reviewing Response to Q{answerIndex + 1}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-[70vh]">
          {/* Left: Video Player */}
          <div className="flex-1 bg-black flex items-center justify-center relative group">
             <video
               src={answer.videoUrl}
               controls
               className="w-full h-full object-contain"
               autoPlay
             />
             <div className="absolute top-4 left-4 z-10">
                <span className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                   Answer Segment Q{answerIndex + 1}
                </span>
             </div>
          </div>

          {/* Right: Review Form */}
          <div className="w-full lg:w-96 bg-slate-900 border-l border-slate-800 p-8 space-y-8 overflow-y-auto">

             {/* Question Prompt */}
             <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Question Asked</label>
                <p className="text-sm font-bold text-white leading-relaxed italic">"{answer.questionText}"</p>
             </div>

             <div className="h-px bg-slate-800" />

             {/* Rating System */}
             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Scholar Performance Rating</label>
                <div className="flex items-center gap-2">
                   {[1, 2, 3, 4, 5].map((s) => (
                     <button
                       key={s}
                       onClick={() => setStars(s)}
                       className={`p-2 transition-all hover:scale-110 ${stars >= s ? 'text-yellow-400' : 'text-slate-700'}`}
                     >
                       <Star size={32} fill={stars >= s ? 'currentColor' : 'none'} strokeWidth={2.5} />
                     </button>
                   ))}
                </div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">
                   {stars === 5 ? 'Exceptional Confidence' : stars === 4 ? 'Solid Response' : stars === 3 ? 'Average / Needs Work' : stars === 2 ? 'Weak Content' : stars === 1 ? 'Critical Failure' : 'Select Star Rating'}
                </p>
             </div>

             {/* Remark / Feedback */}
             <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <MessageSquare size={12} /> Counselor Remarks
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Enter specific observations, required corrections, or guidance for the scholar..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 text-sm font-medium leading-relaxed text-white focus:ring-2 focus:ring-indigo-500 outline-none h-40 transition-all resize-none shadow-inner"
                />
             </div>

             <button
               onClick={handleSave}
               disabled={isSaving || stars === 0}
               className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-900/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
             >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Archive Segment Audit
             </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-8 py-3 bg-slate-950 border-t border-slate-800 text-[9px] font-black text-slate-600 uppercase tracking-widest">
           Secure Audit Transmission Active • Synchronizing to Scholar Dossier
        </div>
      </motion.div>
    </div>
  );
}
