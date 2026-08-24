"use client";

import React, { useState, useEffect } from "react";
import { usePDF } from "react-to-pdf";
import { useAuth } from "@/lib/auth/auth-context";
import { db, storage } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { PackFile, StudentPackData, PackField } from "@/types/pack";
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
  Briefcase,
  GraduationCap,
  Banknote,
  Target,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Building2,
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
  { id: "sop", label: "Statement of Purpose (SOP)", hint: "Upload your finalised personal statement / SOP." },
  { id: "cv", label: "Curriculum Vitae (CV)", hint: "Upload your most recent CV / resume." },
  { id: "bankStatement", label: "Bank Statement", hint: "3–6 months of bank statements showing adequate funds." },
  { id: "applicationDoc", label: "University Offer Letter", hint: "Upload your unconditional or conditional offer letter." },
  { id: "casLetter", label: "CAS Letter / Statement", hint: "Your Confirmation of Acceptance for Studies (CAS)." },
];

const EMPTY_GUIDE: StudyGuideData = {
  universityName: "", courseName: "", courseStartDate: "", tuitionFee: "", casNumber: "",
  sponsorName: "", sponsorRelationship: "", sponsorFundSource: "", alternativeUniversities: "",
  whyThisUniversity: "", coreModules: "", campusFacilities: "", monthlyLivingCosts: "",
  totalSavings: "", sponsorOccupation: "", sponsorMonthlyIncome: "", targetCompanies: "",
  expectedSalary: "", careerJustification: "", intentToReturn: "",
};

const EMPTY_VAULT: VaultData = { sop: null, cv: null, bankStatement: null, applicationDoc: null, casLetter: null };

export default function InterviewPackForm() {
  const { userId } = useAuth();
  const [fields, setFields] = useState<PackField[]>([]);
  const [data, setData] = useState<StudentPackData>({});
  const [guide, setGuide] = useState<StudyGuideData>(EMPTY_GUIDE);
  const [vault, setVault] = useState<VaultData>(EMPTY_VAULT);
  const [activeTab, setActiveTab] = useState<"guide" | "vault">("guide");
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

        // Also fetch general dossier data for categories
        const configSnap = await getDoc(doc(db, "interview_pack_configs", "default"));
        if (configSnap.exists()) {
          setFields(configSnap.data().fields as PackField[]);
        }

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
    alert("Dossier saved successfully!");
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
    <div className="max-w-5xl mx-auto space-y-6 pb-32">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-l-4 border-indigo-500 pl-6 py-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <FolderLock className="w-8 h-8 text-indigo-500" /> My Portfolio
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Visa Defense Brief & Compliance Document Vault</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving || activeTab !== "guide"} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:scale-105 active:scale-95 transition-all">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <FileCheck size={14} />} Save Progress
          </button>
          <button onClick={() => toPDF()} disabled={activeTab !== "guide"} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all">
            <Download size={14} /> Export Brief
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800/50 p-1 rounded-2xl w-fit">
        <button onClick={() => setActiveTab("guide")} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase transition-all ${activeTab === "guide" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}><BookOpen size={14} /> Study Guide</button>
        <button onClick={() => setActiveTab("vault")} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase transition-all ${activeTab === "vault" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}><UploadCloud size={14} /> Document Vault <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${uploadedCount === VAULT_FIELDS.length ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{uploadedCount}/{VAULT_FIELDS.length}</span></button>
      </div>

      {activeTab === "guide" ? <StudyGuideTab guide={guide} setGuide={setGuide} /> : <DocumentVaultTab vault={vault} uploading={uploading} onUpload={handleFileUpload} onRemove={handleRemoveFile} />}

      <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "800px" }}>
        <div ref={targetRef} style={{ width: "800px", padding: "48px", backgroundColor: "white", color: "black", fontFamily: "Georgia, serif" }}>
           <h1 style={{ fontSize: "24px" }}>UKVI Defense Brief</h1>
           <p>University: {guide.universityName}</p>
        </div>
      </div>
    </div>
  );
}

function StudyGuideTab({ guide, setGuide }: { guide: StudyGuideData, setGuide: any }) {
  const set = (key: keyof StudyGuideData) => (e: any) => setGuide((prev: any) => ({ ...prev, [key]: e.target.value }));
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-gray-100 dark:border-slate-700 shadow-sm">
        <Field label="University Name" value={guide.universityName} onChange={set("universityName")} />
        <Field label="Course Name" value={guide.courseName} onChange={set("courseName")} />
        <Field label="CAS Number" value={guide.casNumber} onChange={set("casNumber")} />
        <Field label="Start Date" value={guide.courseStartDate} onChange={set("courseStartDate")} />
      </div>
    </div>
  );
}

function DocumentVaultTab({ vault, uploading, onUpload, onRemove }: { vault: VaultData, uploading: string | null, onUpload: any, onRemove: any }) {
  return (
    <div className="grid grid-cols-1 gap-5 animate-in fade-in duration-300">
      {VAULT_FIELDS.map((field) => {
        const file = vault[field.id];
        const isUploading = uploading === field.id;
        return (
          <div key={field.id} className="bg-white dark:bg-slate-800 rounded-[32px] border border-gray-100 dark:border-slate-700 p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${file ? "bg-emerald-50 text-emerald-500" : "bg-gray-50 text-slate-400"}`}>{file ? <CheckCircle2 /> : <UploadCloud />}</div>
               <div>
                  <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{field.label}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{file ? file.fileName : field.hint}</p>
               </div>
            </div>
            <div className="flex items-center gap-2">
               {file ? (
                 <>
                    <a href={file.fileUrl} target="_blank" rel="noreferrer" className="p-3 bg-gray-50 dark:bg-slate-900 text-blue-500 rounded-xl hover:scale-105 transition-all"><Eye size={18} /></a>
                    <button onClick={() => onRemove(field.id)} className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl hover:scale-105 transition-all"><Trash2 size={18} /></button>
                 </>
               ) : (
                 <label className="relative cursor-pointer">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files?.[0] && onUpload(field.id, e.target.files[0])} disabled={!!uploading} />
                    <div className={`px-6 py-3 rounded-xl font-black text-xs uppercase transition-all ${isUploading ? "bg-indigo-100 text-indigo-500" : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg"}`}>
                       {isUploading ? "Uploading..." : "Upload File"}
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

function Field({ label, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-gray-400 ml-1">{label}</label>
      <input type="text" value={value} onChange={onChange} className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white shadow-inner" />
    </div>
  );
}
