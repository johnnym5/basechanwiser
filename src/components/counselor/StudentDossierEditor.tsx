"use client";

import React from "react";
import { InterviewPack } from "@/types";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

interface StudentDossierEditorProps {
  formData: Partial<InterviewPack>;
  onChange: (updates: Partial<InterviewPack>) => void;
}

/**
 * StudentDossierEditor: Comprehensive form for managing student profile data.
 * Includes all UKVI Credibility fields and Counselor Verification toggle.
 */
export default function StudentDossierEditor({ formData, onChange }: StudentDossierEditorProps) {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    onChange({ [name]: type === 'number' ? parseFloat(value) || 0 : value });
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-300 pb-10">

      {/* 1. Academic & Admission Section */}
      <div className="space-y-6">
        <p className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em] border-l-4 border-blue-500 pl-4">Academic & Admission Justification</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="University Name" name="universityName" value={formData.universityName || ""} onChange={handleInputChange} />
          <Field label="Course Name" name="courseName" value={formData.courseName || ""} onChange={handleInputChange} />
          <Field label="CAS Number" name="casNumber" value={formData.casNumber || ""} onChange={handleInputChange} />
          <Field label="Course Start Date" name="courseStartDate" value={formData.courseStartDate || ""} onChange={handleInputChange} />
          <Field label="Tuition Fee (£)" name="tuitionFee" value={formData.tuitionFee || ""} onChange={handleInputChange} />
          <Field label="Deposit Paid (£)" name="depositPaid" type="number" value={formData.depositPaid || 0} onChange={handleInputChange} />
          <Field label="University Ranking" name="universityRanking" value={formData.universityRanking || ""} onChange={handleInputChange} />
        </div>
        <div className="space-y-4">
           <Textarea label="Alternative Universities Considered" name="alternativeUniversities" value={formData.alternativeUniversities || ""} onChange={handleInputChange} placeholder="Which other unis did the student research?" />
           <Textarea label="Why This Specific University?" name="whyThisUniversity" value={formData.whyThisUniversity || formData.reasonsForUniversity || ""} onChange={handleInputChange} placeholder="Personal fit, facilities, research links..." />
           <Textarea label="Core Modules & Learning Outcomes" name="coreModules" value={formData.coreModules || ""} onChange={handleInputChange} placeholder="What specific knowledge will they gain?" />
           <Textarea label="Campus Facilities" name="campusFacilities" value={formData.campusFacilities || ""} onChange={handleInputChange} placeholder="Labs, libraries, societies..." />
        </div>
      </div>

      {/* 2. Financial Section */}
      <div className="space-y-6 pt-10 border-t border-gray-100 dark:border-slate-800">
        <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em] border-l-4 border-emerald-500 pl-4">Financial Credibility</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Sponsor Name" name="sponsorName" value={formData.sponsorName || ""} onChange={handleInputChange} />
          <Field label="Relationship" name="sponsorRelationship" value={formData.sponsorRelationship || ""} onChange={handleInputChange} />
          <Field label="Sponsor Occupation" name="sponsorOccupation" value={formData.sponsorOccupation || ""} onChange={handleInputChange} />
          <Field label="Monthly Income" name="sponsorMonthlyIncome" value={formData.sponsorMonthlyIncome || ""} onChange={handleInputChange} />
          <Field label="Living Costs (£)" name="monthlyLivingCosts" value={formData.monthlyLivingCosts || ""} onChange={handleInputChange} />
          <Field label="Total Savings (£)" name="totalSavings" value={formData.totalSavings || ""} onChange={handleInputChange} />
          <Field label="Accommodation Details" name="accommodationDetails" value={formData.accommodationDetails || ""} onChange={handleInputChange} />
        </div>
        <Textarea label="Source of Funds" name="sponsorFundSource" value={formData.sponsorFundSource || ""} onChange={handleInputChange} placeholder="How were the savings accumulated?" />
      </div>

      {/* 3. Post-Study Intent Section */}
      <div className="space-y-6 pt-10 border-t border-gray-100 dark:border-slate-800">
        <p className="text-[10px] font-black uppercase text-rose-500 tracking-[0.2em] border-l-4 border-rose-500 pl-4">Future Plans & Intent</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Field label="Target Companies" name="targetCompanies" value={formData.targetCompanies || ""} onChange={handleInputChange} />
           <Field label="Expected Salary (£)" name="expectedSalary" value={formData.expectedSalary || ""} onChange={handleInputChange} />
        </div>
        <div className="space-y-4">
           <Textarea label="Career Justification" name="careerJustification" value={formData.careerJustification || ""} onChange={handleInputChange} placeholder="How does this degree help their career?" />
           <Textarea label="Intent to Return & Home Ties" name="intentToReturn" value={formData.intentToReturn || ""} onChange={handleInputChange} placeholder="Reasons to return home after studies..." />
           <Textarea label="Legacy Career Plans" name="careerPlans" value={formData.careerPlans || ""} onChange={handleInputChange} />
        </div>
      </div>

      {/* Counselor Verification Toggle */}
      <div className="pt-6">
         <div className="flex items-center justify-between p-8 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-[32px]">
            <div className="space-y-1">
               <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <ShieldCheck size={20} />
                  <p className="text-sm font-black uppercase tracking-widest">Counselor Audit</p>
               </div>
               <p className="text-xs font-bold text-gray-500 uppercase tracking-tight">Final verification of physical document consistency</p>
            </div>
            <button
              type="button"
              onClick={() => onChange({ docsVerified: !formData.docsVerified })}
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                formData.docsVerified
                  ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-gray-400 border border-gray-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-500'
              }`}
            >
              {formData.docsVerified ? 'VERIFIED ✓' : 'MARK AS VERIFIED'}
            </button>
         </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text" }: { label: string; name: string; value: any; onChange: any; type?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white shadow-inner"
      />
    </div>
  );
}

function Textarea({ label, name, value, onChange, placeholder }: { label: string; name: string; value: any; onChange: any; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        placeholder={placeholder}
        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[28px] p-6 text-sm font-medium leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white shadow-inner resize-none"
      />
    </div>
  );
}
