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
  FileText,
  MapPin,
  Clock,
  Save,
  ChevronRight,
  ShieldCheck,
  Building
} from "lucide-react";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { InterviewPack } from "@/types";

export default function InterviewPackPage() {
  const { user, userId, role } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<InterviewPack>>({
    status: 'Not Started',
    hasSop: false,
    hasCv: false,
    hasFinancials: false,
    applicationId: "",
    casNumber: "",
    tuitionAmount: 0,
    depositPaid: 0,
    universityRanking: "",
    modulesToStudy: [],
    sponsorName: "",
    sponsorIncome: 0,
    sponsorInfo: "",
    accommodationDetails: "",
    careerPlans: "",
    reasonsForCourse: "",
    reasonsForUniversity: "",
    reasonsForUK: "",
    timeline: "",
    studyGapReason: "",
  });

  useEffect(() => {
    async function fetchExistingPack() {
      if (!userId) return;
      try {
        const docRef = doc(db, "Interview_Packs", userId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as Partial<InterviewPack>;
          setFormData(data);
          if (data.status === "Submitted" || data.status === "Verified") {
            setIsSubmitted(true);
          }
        }
      } catch (err) {
        console.warn("Interview pack fetch error:", err);
      }
    }
    fetchExistingPack();
  }, [userId]);

  const handleChange = (field: keyof InterviewPack, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        userId,
        studentName: user?.displayName || "Student",
        studentEmail: user?.email || localStorage.getItem("bw_guest_email") || "",
        status: formData.status === 'Submitted' ? 'Submitted' : 'In Progress',
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, "Interview_Packs", userId), payload, { merge: true });
      setLastSaved(new Date());
    } catch (err) {
      console.error("Save draft error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitPack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        userId,
        studentName: user?.displayName || "Student",
        studentEmail: user?.email || localStorage.getItem("bw_guest_email") || "",
        status: "Submitted",
        updatedAt: serverTimestamp(),
        createdAt: formData.createdAt || serverTimestamp(),
      };
      await setDoc(doc(db, "Interview_Packs", userId), payload, { merge: true });
      setIsSubmitted(true);
    } catch (err) {
      console.error("Pack submit error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClasses = "w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-100 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none";
  const textareaClasses = "w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-100 dark:border-slate-800 rounded-2xl p-5 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none";

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8 pb-32">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="space-y-1">
              <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Compliance Dossier</h1>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Official Pre-CAS Interview Preparation Pack</p>
           </div>
           <div className="flex items-center gap-4">
              {lastSaved && <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last saved: {lastSaved.toLocaleTimeString()}</span>}
              <button
                onClick={handleSaveDraft}
                disabled={isSaving || isSubmitted}
                className="px-6 py-3 rounded-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                 {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save Progress
              </button>
           </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { step: 1, label: "Documents", icon: FileText, color: "text-blue-500" },
             { step: 2, label: "Admission", icon: Building, color: "text-purple-500" },
             { step: 3, label: "Justification", icon: ShieldCheck, color: "text-amber-500" },
             { step: 4, label: "Logistics", icon: MapPin, color: "text-emerald-500" },
           ].map(s => (
             <button
               key={s.step}
               onClick={() => setCurrentStep(s.step)}
               className={`p-5 rounded-[28px] border-2 transition-all flex flex-col items-center gap-3 ${currentStep === s.step ? 'bg-white dark:bg-[#1E293B] border-blue-500 shadow-xl' : 'bg-gray-50 dark:bg-[#0F172A] border-transparent opacity-60'}`}
             >
                <div className={`p-3 rounded-2xl bg-white dark:bg-[#1E293B] shadow-sm ${s.color}`}><s.icon className="w-5 h-5" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
             </button>
           ))}
        </div>

        {isSubmitted ? (
          <div className="bg-white dark:bg-[#1E293B] rounded-[40px] p-16 border border-gray-100 dark:border-slate-800 shadow-xl text-center space-y-6">
             <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
             </div>
             <div className="space-y-2">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Dossier Locked & Submitted</h2>
                <p className="text-sm text-gray-500 font-bold max-w-md mx-auto leading-relaxed">
                   Your compliance profile is now being reviewed by our Counselor Team. You will receive an alert if further verification is required.
                </p>
             </div>
             <div className="flex justify-center gap-4">
                <button onClick={() => setIsSubmitted(false)} className="px-8 py-4 bg-gray-50 dark:bg-[#0F172A] text-gray-500 font-black rounded-full text-[10px] uppercase tracking-widest border border-gray-100 dark:border-slate-800 transition-all">Unlock for Edits</button>
                <button onClick={() => router.push("/dashboard")} className="px-10 py-4 bg-blue-600 text-white font-black rounded-full text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all">Return to Dashboard</button>
             </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1E293B] rounded-[40px] p-10 border border-gray-100 dark:border-slate-800 shadow-sm animate-in fade-in duration-500">
             <form onSubmit={handleSubmitPack} className="space-y-10">

                {currentStep === 1 && (
                  <div className="space-y-8">
                     <div className="pb-4 border-b border-gray-50 dark:border-slate-800">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Document Confirmation</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Confirm that you have sent these documents locally to your counselor.</p>
                     </div>
                     <div className="space-y-6">
                        {[
                          { key: 'hasSop', label: 'Statement of Purpose (SOP)', icon: FileText, color: 'text-blue-500' },
                          { key: 'hasCv', label: 'Professional CV', icon: User, color: 'text-purple-500' },
                          { key: 'hasFinancials', label: 'Financial Evidence / Bank Statement', icon: DollarSign, color: 'text-emerald-500' },
                        ].map((docItem) => (
                          <div key={docItem.key} className="p-6 rounded-[32px] bg-gray-50 dark:bg-[#0F172A] border border-gray-100 dark:border-slate-800 flex items-center justify-between gap-4">
                             <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl bg-white dark:bg-[#1E293B] shadow-sm ${docItem.color}`}>
                                   <docItem.icon className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{docItem.label}</span>
                             </div>
                             <div className="flex bg-white dark:bg-[#1E293B] p-1 rounded-2xl border border-gray-100 dark:border-slate-800">
                                <button
                                  type="button"
                                  onClick={() => handleChange(docItem.key as any, true)}
                                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData[docItem.key as keyof InterviewPack] === true ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
                                >
                                   Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleChange(docItem.key as any, false)}
                                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData[docItem.key as keyof InterviewPack] === false ? 'bg-rose-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
                                >
                                   No
                                </button>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-8">
                     <div className="pb-4 border-b border-gray-50 dark:border-slate-800">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Admission & CAS</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Details regarding your offer and financial commitment.</p>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">University Application ID</label>
                           <input value={formData.applicationId} onChange={e => handleChange('applicationId', e.target.value)} className={inputClasses} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">CAS Number (If Issued)</label>
                           <input value={formData.casNumber} onChange={e => handleChange('casNumber', e.target.value)} className={inputClasses} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Tuition Fee (£)</label>
                           <input type="number" value={formData.tuitionAmount} onChange={e => handleChange('tuitionAmount', e.target.value)} className={inputClasses} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Deposit Already Paid (£)</label>
                           <input type="number" value={formData.depositPaid} onChange={e => handleChange('depositPaid', e.target.value)} className={inputClasses} />
                        </div>
                     </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-8">
                     <div className="pb-4 border-b border-gray-50 dark:border-slate-800">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Justification & Intent</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Articulate your motivations for the UKVI Genuine Student Test.</p>
                     </div>
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Why choose the UK over your home country?</label>
                           <textarea rows={3} value={formData.reasonsForUK} onChange={e => handleChange('reasonsForUK', e.target.value)} className={textareaClasses} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Why this specific Institution & Campus?</label>
                           <textarea rows={3} value={formData.reasonsForUniversity} onChange={e => handleChange('reasonsForUniversity', e.target.value)} className={textareaClasses} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Post-Study Career Goals (Target Job & Salary)</label>
                           <textarea rows={3} value={formData.careerPlans} onChange={e => handleChange('careerPlans', e.target.value)} className={textareaClasses} />
                        </div>
                     </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-8">
                     <div className="pb-4 border-b border-gray-50 dark:border-slate-800">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Logistics & Sponsorship</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Final details regarding funding and travel.</p>
                     </div>
                     <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Financial Sponsor (Who is paying? Relation & Job)</label>
                           <input value={formData.sponsorInfo} onChange={e => handleChange('sponsorInfo', e.target.value)} className={inputClasses} placeholder="E.g. Father, Senior Surgeon at Lagos GH" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Intended Accommodation (Address & Distance to Campus)</label>
                           <input value={formData.accommodationDetails} onChange={e => handleChange('accommodationDetails', e.target.value)} className={inputClasses} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Timeline (Expected travel date & visa submission date)</label>
                           <input value={formData.timeline} onChange={e => handleChange('timeline', e.target.value)} className={inputClasses} />
                        </div>
                     </div>
                  </div>
                )}

                <div className="pt-8 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between">
                   {currentStep > 1 ? (
                     <button type="button" onClick={() => setCurrentStep(prev => prev - 1)} className="px-10 py-4 bg-gray-50 dark:bg-[#0F172A] text-gray-500 font-black rounded-full text-[10px] uppercase tracking-widest flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Previous Step</button>
                   ) : <div />}

                   {currentStep < 4 ? (
                     <button type="button" onClick={() => { handleSaveDraft(); setCurrentStep(prev => prev + 1); }} className="px-10 py-4 bg-[#1a73e8] text-white font-black rounded-full text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-500/20">Next Step <ArrowRight className="w-4 h-4" /></button>
                   ) : (
                     <button type="submit" className="px-12 py-5 bg-emerald-600 text-white font-black rounded-full text-sm uppercase tracking-widest shadow-2xl shadow-emerald-500/30 flex items-center gap-3 animate-pulse-scale"><CheckCircle2 className="w-5 h-5" /> Submit Full Dossier</button>
                   )}
                </div>
             </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}
