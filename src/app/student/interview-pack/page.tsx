"use client";

import React, { useState, useEffect } from "react";
import { usePDF } from "react-to-pdf";
import { useAuth } from "@/lib/auth/auth-context";
import { db, storage } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { PackFile, StudentPackData } from "@/types/pack";
import AppShell from "@/components/layout/app-shell";
import {
  Loader2,
  FileCheck,
  Download,
  Trash2,
  Eye,
  ShieldCheck,
  UploadCloud,
  BookOpen,
  FolderLock,
  GraduationCap,
  Banknote,
  Target,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ─── UKVI Study Guide State Shape ─────────────────────────────────────────────
interface StudyGuideData {
  universityName: string;
  courseName: string;
  courseStartDate: string;
  tuitionFee: string;
  casNumber: string;
  sponsorName: string;
  sponsorRelationship: string;
  sponsorFundSource: string;
  alternativeUniversities: string;
  whyThisUniversity: string;
  coreModules: string;
  campusFacilities: string;
  monthlyLivingCosts: string;
  totalSavings: string;
  sponsorOccupation: string;
  sponsorMonthlyIncome: string;
  targetCompanies: string;
  expectedSalary: string;
  careerJustification: string;
  intentToReturn: string;
}

interface VaultData {
  sop: PackFile | null;
  cv: PackFile | null;
  bankStatement: PackFile | null;
  applicationDoc: PackFile | null;
  casLetter: PackFile | null;
}

const VAULT_FIELDS: { id: keyof VaultData; label: string; hint: string }[] = [
  { id: "sop", label: "Statement of Purpose (SOP)", hint: "Upload your personal statement / personal statement." },
  { id: "cv", label: "Curriculum Vitae (CV)", hint: "Upload your most recent professional resume." },
  { id: "bankStatement", label: "Bank Statement", hint: "Proof of maintenance funds (28-day rule applies)." },
  { id: "applicationDoc", label: "Admission Offer", hint: "Conditional or Unconditional offer letter." },
  { id: "casLetter", label: "CAS Statement", hint: "Confirmation of Acceptance for Studies." },
];

const EMPTY_GUIDE: StudyGuideData = {
  universityName: "", courseName: "", courseStartDate: "", tuitionFee: "", casNumber: "",
  sponsorName: "", sponsorRelationship: "", sponsorFundSource: "", alternativeUniversities: "",
  whyThisUniversity: "", coreModules: "", campusFacilities: "", monthlyLivingCosts: "",
  totalSavings: "", sponsorOccupation: "", sponsorMonthlyIncome: "", targetCompanies: "",
  expectedSalary: "", careerJustification: "", intentToReturn: "",
};

const EMPTY_VAULT: VaultData = { sop: null, cv: null, bankStatement: null, applicationDoc: null, casLetter: null };

export default function StudentInterviewPackPage() {
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState<"guide" | "vault">("guide");
  const [guide, setGuide] = useState<StudyGuideData>(EMPTY_GUIDE);
  const [vault, setVault] = useState<VaultData>(EMPTY_VAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const { toPDF, targetRef } = usePDF({ filename: "UKVI_Defense_Brief.pdf" });

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const guideSnap = await getDoc(doc(db, "Users", userId, "portfolio", "study_guide"));
        if (guideSnap.exists()) setGuide({ ...EMPTY_GUIDE, ...(guideSnap.data() as StudyGuideData) });

        const vaultSnap = await getDoc(doc(db, "Users", userId, "portfolio", "document_vault"));
        if (vaultSnap.exists()) setVault({ ...EMPTY_VAULT, ...(vaultSnap.data() as VaultData) });
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    await setDoc(doc(db, "Users", userId, "portfolio", "study_guide"), {
      ...guide,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    setSaving(false);
    alert("Progress Synced.");
  };

  const handleFileUpload = async (fieldId: keyof VaultData, file: File) => {
    if (!userId) return;
    setUploading(fieldId);
    try {
      const timestamp = Date.now();
      const storageRef = ref(storage, `student_packs/${userId}/${fieldId}/${timestamp}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      const fileData: PackFile = { fileUrl: downloadUrl, fileName: file.name, uploadedAt: serverTimestamp() };
      const newVault = { ...vault, [fieldId]: fileData };
      setVault(newVault);
      await setDoc(doc(db, "Users", userId, "portfolio", "document_vault"), newVault, { merge: true });
    } catch (e) {
      console.error(e);
      alert("Upload failed.");
    } finally {
      setUploading(null);
    }
  };

  const handleRemoveFile = async (fieldId: keyof VaultData) => {
    if (!userId) return;
    const newVault = { ...vault, [fieldId]: null };
    setVault(newVault);
    await setDoc(doc(db, "Users", userId, "portfolio", "document_vault"), newVault, { merge: true });
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  const uploadedCount = Object.values(vault).filter(Boolean).length;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8 pb-32">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-l-4 border-indigo-500 pl-6 py-2">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3 uppercase">
              <FolderLock className="w-8 h-8 text-indigo-500" /> My Portfolio
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">UKVI Defense Brief & Native Cloud Vault</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={saving || activeTab !== "guide"} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:scale-105 active:scale-95 transition-all">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <FileCheck size={14} />} Save Progress
            </button>
            <button onClick={() => toPDF()} disabled={activeTab !== "guide"} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all">
              <Download size={14} /> Export Brief
            </button>
          </div>
        </div>

        <div className="flex gap-2 bg-gray-100 dark:bg-slate-950 p-1.5 rounded-2xl w-fit">
          <TabButton active={activeTab === "guide"} onClick={() => setActiveTab("guide")} icon={<BookOpen size={14} />} label="Study Guide" />
          <TabButton active={activeTab === "vault"} onClick={() => setActiveTab("vault")} icon={<UploadCloud size={14} />} label="Document Vault" count={`${uploadedCount}/${VAULT_FIELDS.length}`} />
        </div>

        {activeTab === "guide" ? (
          <StudyGuideTab guide={guide} setGuide={setGuide} />
        ) : (
          <DocumentVaultTab vault={vault} uploading={uploading} onUpload={handleFileUpload} onRemove={handleRemoveFile} />
        )}

        <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "800px" }}>
          <div ref={targetRef} style={{ width: "800px", padding: "60px", backgroundColor: "white", color: "black", fontFamily: "serif", lineHeight: "1.6" }}>
             <h1 style={{ fontSize: "32px", fontWeight: "900", textTransform: "uppercase", textAlign: "center", marginBottom: "40px" }}>UKVI Defense Strategy Brief</h1>

             <section style={{ marginBottom: "30px" }}>
                <h2 style={{ fontSize: "18px", borderBottom: "2px solid black", paddingBottom: "5px", textTransform: "uppercase" }}>1. Academic Justification</h2>
                <p><strong>University:</strong> {guide.universityName}</p>
                <p><strong>Course:</strong> {guide.courseName}</p>
                <p><strong>Start Date:</strong> {guide.courseStartDate}</p>
                <p><strong>CAS Number:</strong> {guide.casNumber}</p>
                <p><strong>Tuition Fee:</strong> {guide.tuitionFee}</p>
                <p><strong>Alternative Universities:</strong> {guide.alternativeUniversities}</p>
                <p><strong>Choice Justification:</strong> {guide.whyThisUniversity}</p>
                <p><strong>Core Modules:</strong> {guide.coreModules}</p>
             </section>

             <section style={{ marginBottom: "30px" }}>
                <h2 style={{ fontSize: "18px", borderBottom: "2px solid black", paddingBottom: "5px", textTransform: "uppercase" }}>2. Financial Credibility</h2>
                <p><strong>Sponsor:</strong> {guide.sponsorName} ({guide.sponsorRelationship})</p>
                <p><strong>Sponsor Occupation:</strong> {guide.sponsorOccupation}</p>
                <p><strong>Sponsor Income:</strong> {guide.sponsorMonthlyIncome}</p>
                <p><strong>Funds Source:</strong> {guide.sponsorFundSource}</p>
                <p><strong>Total Savings:</strong> {guide.totalSavings}</p>
             </section>

             <section style={{ marginBottom: "30px" }}>
                <h2 style={{ fontSize: "18px", borderBottom: "2px solid black", paddingBottom: "5px", textTransform: "uppercase" }}>3. Career Progression</h2>
                <p><strong>Target Companies:</strong> {guide.targetCompanies}</p>
                <p><strong>Expected Salary:</strong> {guide.expectedSalary}</p>
                <p><strong>Value of Course:</strong> {guide.careerJustification}</p>
                <p><strong>Intent to Return:</strong> {guide.intentToReturn}</p>
             </section>

             <p style={{ marginTop: "50px", fontSize: "12px", fontStyle: "italic", textAlign: "center", borderTop: "1px solid #ccc", paddingTop: "20px" }}>
                Generated via BASECHANWISER Platform • Secure Compliance Data
             </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function TabButton({ active, onClick, icon, label, count }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${active ? "bg-white dark:bg-slate-800 text-indigo-500 shadow-sm border border-indigo-500/10" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
      {icon} {label} {count && <span className={`ml-1 px-2 py-0.5 rounded-full text-[8px] ${active ? "bg-indigo-50 text-indigo-600" : "bg-slate-200 text-slate-500"}`}>{count}</span>}
    </button>
  );
}

function StudyGuideTab({ guide, setGuide }: any) {
  const set = (key: keyof StudyGuideData) => (e: any) => setGuide((prev: any) => ({ ...prev, [key]: e.target.value }));
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Section 1: Academic Identity */}
      <div className="space-y-6">
        <h3 className="text-xs font-black uppercase text-blue-500 tracking-[0.2em] ml-2 flex items-center gap-2">
          <GraduationCap size={16} /> Academic & Admission Justification
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-900/50 p-10 rounded-[40px] border border-gray-100 dark:border-slate-800 shadow-xl">
          <Field label="University Name" value={guide.universityName} onChange={set("universityName")} placeholder="e.g. Coventry University" />
          <Field label="Course Name" value={guide.courseName} onChange={set("courseName")} placeholder="e.g. MSc Public Health" />
          <Field label="CAS Number" value={guide.casNumber} onChange={set("casNumber")} placeholder="e.g. E4G123456789" />
          <Field label="Course Start Date" value={guide.courseStartDate} onChange={set("courseStartDate")} placeholder="e.g. Sept 2025" />
          <Field label="Tuition Fee (£)" value={guide.tuitionFee} onChange={set("tuitionFee")} placeholder="e.g. 15000" />
          <div className="md:col-span-2 space-y-4">
            <TextAreaField label="Alternative Universities Considered" value={guide.alternativeUniversities} onChange={set("alternativeUniversities")} placeholder="List other unis you applied to and why you chose this one instead..." />
            <TextAreaField label="Why This University?" value={guide.whyThisUniversity} onChange={set("whyThisUniversity")} placeholder="Mention ranking, location, facilities, etc..." />
            <TextAreaField label="Core Modules & Learning Outcomes" value={guide.coreModules} onChange={set("coreModules")} placeholder="List at least 3 core modules and what you will learn..." />
            <TextAreaField label="Campus Facilities" value={guide.campusFacilities} onChange={set("campusFacilities")} placeholder="e.g. Library, Labs, Career Center..." />
          </div>
        </div>
      </div>

      {/* Section 2: Financial Credibility */}
      <div className="space-y-6">
        <h3 className="text-xs font-black uppercase text-emerald-500 tracking-[0.2em] ml-2 flex items-center gap-2">
          <Banknote size={16} /> Financial & Maintenance Evidence
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-900/50 p-10 rounded-[40px] border border-gray-100 dark:border-slate-800 shadow-xl">
          <Field label="Sponsor Name" value={guide.sponsorName} onChange={set("sponsorName")} placeholder="e.g. John Doe (Father)" />
          <Field label="Sponsor Relationship" value={guide.sponsorRelationship} onChange={set("sponsorRelationship")} placeholder="e.g. Father / Self / Employer" />
          <Field label="Sponsor Occupation" value={guide.sponsorOccupation} onChange={set("sponsorOccupation")} placeholder="e.g. Senior Engineer" />
          <Field label="Sponsor Monthly Income" value={guide.sponsorMonthlyIncome} onChange={set("sponsorMonthlyIncome")} placeholder="e.g. £3000" />
          <Field label="Source of Funds" value={guide.sponsorFundSource} onChange={set("sponsorFundSource")} placeholder="e.g. Personal Savings / Business Profit" />
          <Field label="Monthly Living Costs in UK" value={guide.monthlyLivingCosts} onChange={set("monthlyLivingCosts")} placeholder="e.g. £1023 (Outside London)" />
          <Field label="Total Savings for Maintenance" value={guide.totalSavings} onChange={set("totalSavings")} placeholder="e.g. £15000" />
        </div>
      </div>

      {/* Section 3: Career Progression & Ties */}
      <div className="space-y-6">
        <h3 className="text-xs font-black uppercase text-purple-500 tracking-[0.2em] ml-2 flex items-center gap-2">
          <Target size={16} /> Future Career Strategy & Home Ties
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-900/50 p-10 rounded-[40px] border border-gray-100 dark:border-slate-800 shadow-xl">
          <Field label="Target Companies" value={guide.targetCompanies} onChange={set("targetCompanies")} placeholder="List 3 companies you plan to work for..." />
          <Field label="Expected Starting Salary" value={guide.expectedSalary} onChange={set("expectedSalary")} placeholder="Expected salary in your home country..." />
          <div className="md:col-span-2 space-y-4">
            <TextAreaField label="Career Justification" value={guide.careerJustification} onChange={set("careerJustification")} placeholder="How does this specific course help you get these target jobs?" />
            <TextAreaField label="Intent to Return & Ties" value={guide.intentToReturn} onChange={set("intentToReturn")} placeholder="Explain your family/economic ties and your definitive plan to return home..." />
          </div>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-8 rounded-[32px] flex items-start gap-4">
         <AlertCircle className="text-amber-500 shrink-0" />
         <p className="text-xs font-bold text-amber-800 dark:text-amber-200 leading-relaxed uppercase tracking-widest">Answer all questions consistently. This brief generates your formal defense strategy for the UKVI interview.</p>
      </div>
    </div>
  );
}

function DocumentVaultTab({ vault, uploading, onUpload, onRemove }: any) {
  return (
    <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {VAULT_FIELDS.map((field) => {
        const file = vault[field.id];
        const isUploading = uploading === field.id;
        return (
          <div key={field.id} className="bg-white dark:bg-slate-900/50 rounded-[40px] border border-gray-100 dark:border-slate-800 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm transition-all hover:border-indigo-500/30">
            <div className="flex items-center gap-5">
               <div className={`w-14 h-14 rounded-3xl flex items-center justify-center border-2 ${file ? "bg-emerald-50 border-emerald-100 text-emerald-500" : "bg-gray-50 border-gray-100 text-slate-400 dark:bg-slate-800 dark:border-slate-700"}`}>
                  {file ? <ShieldCheck size={28} /> : <UploadCloud size={28} />}
               </div>
               <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tighter">{field.label}</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{file ? `FILE SECURED: ${file.fileName}` : field.hint}</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               {file ? (
                 <>
                    <a href={file.fileUrl} target="_blank" rel="noreferrer" className="px-6 py-3 bg-gray-50 dark:bg-slate-800 text-blue-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all border border-gray-100 dark:border-slate-700 flex items-center gap-2"><Eye size={16} /> View</a>
                    <button onClick={() => onRemove(field.id)} className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-2xl hover:bg-rose-600 hover:text-white transition-all border border-rose-100 dark:border-rose-900/30"><Trash2 size={20} /></button>
                 </>
               ) : (
                 <label className="relative cursor-pointer">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files?.[0] && onUpload(field.id, e.target.files[0])} disabled={!!uploading} />
                    <div className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 ${isUploading ? "bg-indigo-100 text-indigo-500" : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-900/20"}`}>
                       {isUploading ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                       {isUploading ? "Pushing Binary..." : "Upload Native"}
                    </div>
                 </label>
               )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{label}</label>
      <input type="text" value={value} onChange={onChange} placeholder={placeholder} className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white shadow-inner" />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={4}
        className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-[32px] px-6 py-5 text-sm font-medium leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white shadow-inner resize-none"
      />
    </div>
  );
}
