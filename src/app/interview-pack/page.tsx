"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import {
  FileCheck,
  User,
  DollarSign,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { InterviewPack } from "@/types";

export default function InterviewPackPage() {
  const { user, role } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // AI Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [aiAuditResult, setAiAuditResult] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<InterviewPack>>({
    passportNo: "",
    casNumber: "",
    offerLetterLink: "",
    tuitionAmount: 14500,
    depositPaid: 5000,
    sponsorName: "",
    sponsorIncome: 45000,
    studyGapReason: "",
    careerPlans: "",
    whyUniversity: "",
  });

  useEffect(() => {
    async function fetchExistingPack() {
      if (!user) return;
      try {
        const docRef = doc(db, "Interview_Packs", user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setFormData(snap.data() as Partial<InterviewPack>);
          if (snap.data().status === "Submitted") {
            setIsSubmitted(true);
          }
        }
      } catch (err) {
        console.warn("Interview pack fetch fallback:", err);
      }
    }
    fetchExistingPack();
  }, [user]);

  const handleChange = (field: keyof InterviewPack, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (currentStep < 3) setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleAiConsistencyCheck = async () => {
    if (!user) return;
    setIsVerifying(true);
    setAiError(null);
    setAiAuditResult(null);

    try {
      const res = await fetch("/api/ai/verify-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          role: role || "Student",
          packData: formData,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setAiError(resData.error || "AI consistency check failed. Please try again.");
      } else {
        setAiAuditResult(resData.data);
      }
    } catch (err: any) {
      setAiError(err.message || "Failed to reach AI service.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmitPack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const payload: InterviewPack = {
        userId: user.uid,
        studentName: user.displayName || "Student User",
        studentEmail: user.email || "student@basechaninternational.com",
        passportNo: formData.passportNo || "N/A",
        casNumber: formData.casNumber || "N/A",
        offerLetterLink: formData.offerLetterLink || "",
        tuitionAmount: Number(formData.tuitionAmount) || 0,
        depositPaid: Number(formData.depositPaid) || 0,
        sponsorName: formData.sponsorName || "Self",
        sponsorIncome: Number(formData.sponsorIncome) || 0,
        studyGapReason: formData.studyGapReason || "N/A",
        careerPlans: formData.careerPlans || "N/A",
        whyUniversity: formData.whyUniversity || "N/A",
        status: "Submitted",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = doc(db, "Interview_Packs", user.uid);
      await setDoc(docRef, payload, { merge: true });

      setIsSubmitted(true);
    } catch (err) {
      console.error("Pack submit error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClasses =
    "w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 transition-all";
  const textareaClasses =
    "w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 transition-all";

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        {/* Header Banner */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 text-[#1a73e8] dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-700">
              <FileCheck className="w-3.5 h-3.5" /> Official UK Credibility Drill
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight font-google">
              Student Interview Pack
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl font-medium">
              Complete your pre-CAS compliance information. Our AI UKVI Compliance Officer will verify your financial and academic consistency.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleAiConsistencyCheck}
              disabled={isVerifying}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" /> AI Compliance Audit
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Error Alert */}
        {aiError && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3 text-red-800 dark:text-red-200 text-xs font-bold">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}

        {/* AI Audit Result Card */}
        {aiAuditResult && (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 rounded-3xl p-6 border border-purple-200 dark:border-purple-800 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black">
                  {aiAuditResult.score}%
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-base">
                    UKVI AI Audit Verdict: {aiAuditResult.verdict}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{aiAuditResult.summary}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {aiAuditResult.financialDiscrepancies?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-red-200 dark:border-red-900/50">
                  <h4 className="font-bold text-red-600 dark:text-red-400 mb-2">Financial Discrepancies</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                    {aiAuditResult.financialDiscrepancies.map((d: string, idx: number) => (
                      <li key={idx}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiAuditResult.logicalGaps?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-yellow-200 dark:border-yellow-900/50">
                  <h4 className="font-bold text-yellow-600 dark:text-yellow-400 mb-2">Logical Gaps</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                    {aiAuditResult.logicalGaps.map((g: string, idx: number) => (
                      <li key={idx}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {aiAuditResult.suggestedImprovements?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-purple-200 dark:border-purple-800 text-xs">
                <h4 className="font-bold text-purple-700 dark:text-purple-300 mb-2">Suggested Improvements</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  {aiAuditResult.suggestedImprovements.map((imp: string, idx: number) => (
                    <li key={idx}>{imp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Step Indicator */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { step: 1, label: "Personal Info", icon: User },
            { step: 2, label: "Financials", icon: DollarSign },
            { step: 3, label: "Academic Goals", icon: GraduationCap },
          ].map((s) => {
            const Icon = s.icon;
            const isActive = currentStep === s.step;
            return (
              <div
                key={s.step}
                onClick={() => setCurrentStep(s.step)}
                className={`cursor-pointer p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                  isActive
                    ? "bg-white dark:bg-gray-800 border-[#1a73e8] text-[#1a73e8] shadow-md"
                    : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-500"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    isActive ? "bg-blue-100 dark:bg-blue-900/60 text-[#1a73e8]" : "bg-gray-200 dark:bg-gray-700 text-gray-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold hidden sm:inline">{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Main Form */}
        {isSubmitted ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Interview Pack Submitted!</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto">
              Your counselor has received your pack. You will be notified when your compliance evaluation is ready.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="px-6 py-2.5 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 font-bold text-xs text-gray-800 dark:text-gray-200 hover:bg-gray-100"
            >
              Edit Submitted Information
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
            <form onSubmit={handleSubmitPack} className="space-y-6">
              {/* STEP 1 */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">Step 1: Personal & Application Details</h3>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">Passport Number</label>
                    <input type="text" required placeholder="Passport Number" value={formData.passportNo} onChange={(e) => handleChange("passportNo", e.target.value)} className={inputClasses} />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">CAS Reference Number</label>
                    <input type="text" required placeholder="CAS Reference Number" value={formData.casNumber} onChange={(e) => handleChange("casNumber", e.target.value)} className={inputClasses} />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">Offer Letter Document Link (Drive/Cloud)</label>
                    <input type="url" placeholder="Offer Letter Document Link" value={formData.offerLetterLink} onChange={(e) => handleChange("offerLetterLink", e.target.value)} className={inputClasses} />
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">Step 2: Financial & Sponsorship Details</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">Total Tuition Amount (£ / $)</label>
                      <input type="number" required value={formData.tuitionAmount} onChange={(e) => handleChange("tuitionAmount", e.target.value)} className={inputClasses} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">Deposit Amount Already Paid (£ / $)</label>
                      <input type="number" required value={formData.depositPaid} onChange={(e) => handleChange("depositPaid", e.target.value)} className={inputClasses} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">Financial Sponsor Name</label>
                      <input type="text" placeholder="Financial Sponsor Name" value={formData.sponsorName} onChange={(e) => handleChange("sponsorName", e.target.value)} className={inputClasses} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">Sponsor Annual Income (£ / $)</label>
                      <input type="number" value={formData.sponsorIncome} onChange={(e) => handleChange("sponsorIncome", e.target.value)} className={inputClasses} />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">Step 3: Academic & Career Goals</h3>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">Study Gap Reasons (If any)</label>
                    <textarea rows={3} placeholder="Explain work experience or activities during gaps between qualifications..." value={formData.studyGapReason} onChange={(e) => handleChange("studyGapReason", e.target.value)} className={textareaClasses} />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">Post-Study Career Plans</label>
                    <textarea rows={3} placeholder="Detail your planned target job role, target industry, and return home goals..." value={formData.careerPlans} onChange={(e) => handleChange("careerPlans", e.target.value)} className={textareaClasses} />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">Why this University & Course?</label>
                    <textarea rows={3} placeholder="Explain modules, campus facilities, and why this institution was chosen..." value={formData.whyUniversity} onChange={(e) => handleChange("whyUniversity", e.target.value)} className={textareaClasses} />
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-5 py-2.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-2.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
                  >
                    Next Step <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Submit Interview Pack
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}
