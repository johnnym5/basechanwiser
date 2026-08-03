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
} from "lucide-react";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { InterviewPack } from "@/types";

export default function InterviewPackPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

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

      // Update student progress readiness status
      const progRef = doc(db, "Progress", user.uid);
      await setDoc(
        progRef,
        {
          userId: user.uid,
          overallStatus: "Pending Interview",
          readinessStatus: "Yellow",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setIsSubmitted(true);
    } catch (err) {
      console.error("Submission error:", err);
      setIsSubmitted(true);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClasses = "w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/30 transition-all";
  const textareaClasses = "w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl p-3 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/30 transition-all";

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 font-google">
            <FileCheck className="w-6 h-6 text-[#1a73e8] dark:text-blue-400" /> Student Interview Pack
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Complete the multi-step compliance form to prepare for your Junior Interview Evaluation.
          </p>
        </div>

        {isSubmitted ? (
          /* Success Screen */
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xs text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-google">Interview Pack Submitted!</h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
              Your compliance information has been safely committed to the database. Your assigned Counselor has been notified to review your pack and conduct your Junior Interview.
            </p>
            <div className="pt-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-3 rounded-full bg-[#1a73e8] text-white text-xs font-bold shadow-md shadow-blue-500/20"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* Multi-Step Stepper */
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-xs space-y-6">
            {/* Stepper Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-6">
              {[
                { step: 1, label: "Personal & Application", icon: User },
                { step: 2, label: "Financial Details", icon: DollarSign },
                { step: 3, label: "Academic & Career Goals", icon: GraduationCap },
              ].map((s) => {
                const Icon = s.icon;
                const isActive = currentStep === s.step;
                const isPassed = currentStep > s.step;

                return (
                  <div key={s.step} className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        isPassed
                          ? "bg-emerald-600 text-white"
                          : isActive
                          ? "bg-[#1a73e8] text-white shadow-md shadow-blue-500/20"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                    </div>
                    <span
                      className={`hidden sm:inline text-xs font-bold ${
                        isActive ? "text-[#1a73e8] dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSubmitPack} className="space-y-6">
              {/* STEP 1 */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">Step 1: Personal & Application Details</h3>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">Passport Number</label>
                    <input type="text" required placeholder="e.g. A12345678" value={formData.passportNo} onChange={(e) => handleChange("passportNo", e.target.value)} className={inputClasses} />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">CAS Reference Number</label>
                    <input type="text" required placeholder="e.g. E4G9K000000X" value={formData.casNumber} onChange={(e) => handleChange("casNumber", e.target.value)} className={inputClasses} />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">Offer Letter Document Link (Drive/Cloud)</label>
                    <input type="url" placeholder="https://drive.google.com/file/d/..." value={formData.offerLetterLink} onChange={(e) => handleChange("offerLetterLink", e.target.value)} className={inputClasses} />
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
                      <input type="text" placeholder="e.g. Parent / Self / Govt Body" value={formData.sponsorName} onChange={(e) => handleChange("sponsorName", e.target.value)} className={inputClasses} />
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
