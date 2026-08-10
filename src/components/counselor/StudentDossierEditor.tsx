"use client";

import React from "react";
import { InterviewPack } from "@/types";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

interface StudentDossierEditorProps {
  formData: Partial<InterviewPack>;
  onChange: (updates: Partial<InterviewPack>) => void;
}

/**
 * StudentDetailsEditor: Comprehensive form for managing student profile data.
 * Includes a Counselor-only "Docs Verified" toggle for the Auto-Status engine.
 */
export default function StudentDossierEditor({ formData, onChange }: StudentDossierEditorProps) {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    onChange({ [name]: type === 'number' ? parseFloat(value) || 0 : value });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Academic & Admission */}
        <div className="space-y-6">
          <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Academic & Admission</p>
          <div className="space-y-4">
            <Field
              label="CAS Number"
              name="casNumber"
              value={formData.casNumber || ""}
              onChange={handleInputChange}
            />
            <Field
              label="Tuition Fee (£)"
              name="tuitionAmount"
              type="number"
              value={formData.tuitionAmount || 0}
              onChange={handleInputChange}
            />
            <Field
              label="Deposit Paid (£)"
              name="depositPaid"
              type="number"
              value={formData.depositPaid || 0}
              onChange={handleInputChange}
            />
            <Field
              label="University Ranking"
              name="universityRanking"
              value={formData.universityRanking || ""}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Financials & Logistics */}
        <div className="space-y-6">
          <p className="text-[10px] font-black uppercase text-purple-500 tracking-widest">Financials & Logistics</p>
          <div className="space-y-4">
            <Field
              label="Sponsor Name"
              name="sponsorName"
              value={formData.sponsorName || ""}
              onChange={handleInputChange}
            />
            <Field
              label="Sponsor Income (£)"
              name="sponsorIncome"
              type="number"
              value={formData.sponsorIncome || 0}
              onChange={handleInputChange}
            />
            <Field
              label="Accommodation Details"
              name="accommodationDetails"
              value={formData.accommodationDetails || ""}
              onChange={handleInputChange}
            />
            <Field
              label="Target Date"
              name="timeline"
              value={formData.timeline || ""}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>

      {/* Long Text Fields */}
      <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-slate-800">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Future Career Plans</label>
          <textarea
            name="careerPlans"
            value={formData.careerPlans || ""}
            onChange={handleInputChange}
            rows={3}
            className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-slate-800 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
            placeholder="Outline student's post-study intentions..."
          />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Reason for University Choice</label>
          <textarea
            name="reasonsForUniversity"
            value={formData.reasonsForUniversity || formData.whyUniversity || ""}
            onChange={handleInputChange}
            rows={3}
            className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-slate-800 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
            placeholder="Why this specific institution?"
          />
        </div>

        {/* ── AUTO-STATUS UPGRADE: Counselor Verification Toggle ── */}
        <div className="pt-6">
           <div className="flex items-center justify-between p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-3xl">
              <div className="space-y-1">
                 <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <ShieldCheck size={16} />
                    <p className="text-xs font-black uppercase tracking-widest">Counselor Verification</p>
                 </div>
                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Confirm all physical documents have been validated</p>
              </div>
              <button
                type="button"
                onClick={() => onChange({ docsVerified: !formData.docsVerified })}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  formData.docsVerified
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 text-gray-400 border border-gray-200 dark:border-slate-700 hover:border-blue-300'
                }`}
              >
                {formData.docsVerified ? 'Documents Verified' : 'Mark as Verified'}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text" }: { label: string; name: string; value: any; onChange: any; type?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white shadow-inner"
      />
    </div>
  );
}
