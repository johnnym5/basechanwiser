"use client";

import React, { useState, useMemo } from "react";
import { auth } from '@/lib/firebase/config';
import { X } from "lucide-react";

type InterviewLevel = "Junior" | "Senior" | "Head";

const RED_FLAG_OPTIONS = [
  "Memorized Answers",
  "Agent Interference",
  "Financial Discrepancy",
  "Weak Career Logic",
  "Hesitated on Sponsor Income",
];

export default function InterviewEvaluationModal({
  studentId,
  studentName,
  open,
  onClose,
  counselorId,
  counselorName,
}: {
  studentId: string;
  studentName: string;
  open: boolean;
  onClose: () => void;
  counselorId: string;
  counselorName: string;
}) {
  const [level, setLevel] = useState<InterviewLevel>("Junior");
  const [scores, setScores] = useState({ communication: 0, courseKnowledge: 0, financialCredibility: 0, returnIntent: 0 });
  const [notes, setNotes] = useState("");
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const totalScore = useMemo(() => Object.values(scores).reduce((a, b) => a + b, 0), [scores]);

  const toggleFlag = (flag: string) => {
    setRedFlags(prev => prev.includes(flag) ? prev.filter(f => f !== flag) : [...prev, flag]);
  };

  const handleScoreChange = (key: string, value: number) => {
    setScores(prev => ({ ...prev, [key]: Math.max(0, Math.min(10, Math.round(value))) }));
  };

  const submitEvaluation = async (outcome: string) => {
    if (!studentId) return;
    setSaving(true);
    try {
      const payload = {
        studentId,
        counselorId,
        counselorName,
        counselorName_display: counselorName,
        interviewLevel: level,
        scores,
        totalScore,
        notes,
        redFlags,
        outcome,
      };

      // include Firebase ID token for server-side auth verification
      const idToken = await auth.currentUser?.getIdToken();
      const headers: any = { "Content-Type": "application/json" };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch(`/api/interviews/evaluate`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Save failed');

      // If Head approve, trigger simple visual confetti by adding a class to body
      if (level === "Head" && (outcome === "Final Approve" || outcome === "Pass")) {
        const el = document.createElement('div');
        el.className = 'fixed inset-0 pointer-events-none z-[9999] animate-confetti';
        el.innerHTML = '<div class="w-full h-full"></div>';
        document.body.appendChild(el);
        setTimeout(() => document.body.removeChild(el), 3000);
      }

      onClose();
    } catch (e) {
      console.error("Evaluation save failed:", e);
      alert("Could not save evaluation. See console for details.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="fixed inset-0 bg-black/50" onClick={() => !saving && onClose()} />
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#0b1220] rounded-2xl shadow-2xl overflow-auto max-h-[90vh] p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black">🎤 Conduct Live Interview — {studentName}</h3>
          <button onClick={() => !saving && onClose()} className="p-2 rounded-full bg-gray-100 dark:bg-slate-800"><X className="w-4 h-4" /></button>
        </div>

        <div className="mt-4 space-y-6">
          <div>
            <p className="text-xs font-black uppercase text-gray-400">Select Level</p>
            <div className="flex gap-3 mt-2">
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="level" checked={level === 'Junior'} onChange={() => setLevel('Junior')} />
                <span className="text-sm font-bold">Junior Interview (Standard)</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="level" checked={level === 'Senior'} onChange={() => setLevel('Senior')} />
                <span className="text-sm font-bold">Senior Interview (Stress Test)</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="level" checked={level === 'Head'} onChange={() => setLevel('Head')} />
                <span className="text-sm font-bold">Head Approval (Final)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'communication', label: 'Communication & Fluency' },
              { key: 'courseKnowledge', label: 'Course & University Knowledge' },
              { key: 'financialCredibility', label: 'Financial Credibility' },
              { key: 'returnIntent', label: 'Immigration & Return Intent' },
            ].map(c => (
              <div key={c.key} className="bg-gray-50 dark:bg-slate-900 p-4 rounded-2xl">
                <p className="text-xs font-black uppercase text-gray-400">{c.label}</p>
                <div className="flex items-center gap-3 mt-3">
                  <input type="range" min={0} max={10} value={(scores as any)[c.key]} onChange={(e) => handleScoreChange(c.key, Number(e.target.value))} />
                  <div className="w-10 text-right font-black">{(scores as any)[c.key]}</div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-black uppercase text-gray-400">Red Flags</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {RED_FLAG_OPTIONS.map(flag => (
                <button key={flag} onClick={() => toggleFlag(flag)} className={`px-3 py-1 rounded-full text-sm font-bold border ${redFlags.includes(flag) ? 'bg-rose-100 border-rose-300' : 'bg-gray-100 border-gray-200'}`}>
                  {flag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase text-gray-400">Interviewer Notes</p>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full mt-2 p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800" rows={6} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400">Total Score</p>
              <p className="text-2xl font-black">{totalScore} / 40</p>
            </div>

            <div className="flex items-center gap-3">
              {level === 'Junior' ? (
                <>
                  <button disabled={saving} onClick={() => submitEvaluation('Pass')} className="px-4 py-3 bg-emerald-500 text-white font-black rounded-2xl">✅ Pass</button>
                  <button disabled={saving} onClick={() => submitEvaluation('Retry')} className="px-4 py-3 bg-yellow-400 text-black font-black rounded-2xl">🔄 Retry Required</button>
                  <button disabled={saving} onClick={() => submitEvaluation('Escalate')} className="px-4 py-3 bg-indigo-600 text-white font-black rounded-2xl">⬆️ Escalate to Senior</button>
                </>
              ) : (
                <>
                  <button disabled={saving} onClick={() => submitEvaluation('Final Approve')} className="px-4 py-3 bg-emerald-600 text-white font-black rounded-2xl">✅ Final Approve</button>
                  <button disabled={saving} onClick={() => submitEvaluation('Reject')} className="px-4 py-3 bg-rose-600 text-white font-black rounded-2xl">❌ Reject</button>
                  <button disabled={saving} onClick={() => submitEvaluation('Send Back to Learning')} className="px-4 py-3 bg-yellow-400 text-black font-black rounded-2xl">🔄 Send Back to Learning</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
