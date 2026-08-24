"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePDF } from "react-to-pdf";
import { useAuth } from "@/lib/auth/auth-context";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { formatDriveEmbedUrl } from "@/lib/utils/drive-helpers";
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
  Briefcase,
  GraduationCap,
  Banknote,
  Target,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Link2,
} from "lucide-react";

// ─── UKVI Study Guide State Shape ─────────────────────────────────────────────
interface StudyGuideData {
  // Existing credibility fields
  universityName: string;
  courseName: string;
  courseStartDate: string;
  tuitionFee: string;
  casNumber: string;
  sponsorName: string;
  sponsorRelationship: string;
  sponsorFundSource: string;
  // NEW: UKVI Credibility Fields
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

// ─── Document Vault File Map ──────────────────────────────────────────────────
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
  universityName: "",
  courseName: "",
  courseStartDate: "",
  tuitionFee: "",
  casNumber: "",
  sponsorName: "",
  sponsorRelationship: "",
  sponsorFundSource: "",
  alternativeUniversities: "",
  whyThisUniversity: "",
  coreModules: "",
  campusFacilities: "",
  monthlyLivingCosts: "",
  totalSavings: "",
  sponsorOccupation: "",
  sponsorMonthlyIncome: "",
  targetCompanies: "",
  expectedSalary: "",
  careerJustification: "",
  intentToReturn: "",
};

const EMPTY_VAULT: VaultData = {
  sop: null,
  cv: null,
  bankStatement: null,
  applicationDoc: null,
  casLetter: null,
};

// ─── Main Page Component ───────────────────────────────────────────────────────
export default function StudentPortfolioPage() {
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState<"guide" | "vault">("guide");
  const [guide, setGuide] = useState<StudyGuideData>(EMPTY_GUIDE);
  const [vault, setVault] = useState<VaultData>(EMPTY_VAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  // react-to-pdf: renders the hidden div referenced by targetRef into a PDF
  const { toPDF, targetRef } = usePDF({ filename: "UKVI_Defense_Brief.pdf" });

  // ── Fetch ────────────────────────────────────────────────────────────────────
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

  // ── Save Study Guide ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    await setDoc(doc(db, "Users", userId, "portfolio", "study_guide"), {
      ...guide,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    setSaving(false);
  };

  // ── Attach Vault Link (Replaced Upload) ───────────────────────────────────
  const handleVaultLink = async (fieldId: keyof VaultData, url: string) => {
    if (!userId || !url) return;
    setUploading(fieldId);
    try {
      const embedUrl = formatDriveEmbedUrl(url);
      const fileData: PackFile = {
        fileUrl: embedUrl,
        fileName: url.split('/').pop()?.split('?')[0] || "Linked Asset",
        uploadedAt: serverTimestamp()
      };
      const newVault = { ...vault, [fieldId]: fileData };
      setVault(newVault);
      await setDoc(doc(db, "Users", userId, "portfolio", "document_vault"), newVault, { merge: true });
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(null);
    }
  };

  // ── Remove Vault File ────────────────────────────────────────────────────────
  const handleVaultRemove = async (fieldId: keyof VaultData) => {
    if (!userId) return;
    const newVault = { ...vault, [fieldId]: null };
    setVault(newVault);
    await setDoc(doc(db, "Users", userId, "portfolio", "document_vault"), newVault, { merge: true });
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={40} className="animate-spin text-indigo-500" />
        </div>
      </AppShell>
    );
  }

  const uploadedCount = Object.values(vault).filter(Boolean).length;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6 pb-32">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-l-4 border-indigo-500 pl-6 py-2">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <FolderLock className="w-8 h-8 text-indigo-500" />
              My Portfolio
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Visa Defense Brief & Compliance Document Vault
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || activeTab !== "guide"}
              className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <FileCheck size={14} />}
              Save Progress
            </button>
            <button
              onClick={() => toPDF()}
              disabled={activeTab !== "guide"}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <Download size={14} />
              Export Defense Brief
            </button>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800/50 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("guide")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === "guide"
                ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <BookOpen size={14} />
            Study Guide
          </button>
          <button
            onClick={() => setActiveTab("vault")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === "vault"
                ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Link2 size={14} />
            Document Vault
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${uploadedCount === VAULT_FIELDS.length ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
              {uploadedCount}/{VAULT_FIELDS.length}
            </span>
          </button>
        </div>

        {/* ── Tab Content ─────────────────────────────────────────────────── */}
        {activeTab === "guide" ? (
          <StudyGuideTab guide={guide} setGuide={setGuide} />
        ) : (
          <DocumentVaultTab vault={vault} uploading={uploading} onLink={handleVaultLink} onRemove={handleVaultRemove} />
        )}

        {/* ── HIDDEN PDF TEMPLATE ─────────────────────────────────────────── */}
        {/* This div is off-screen and only used for PDF generation via react-to-pdf */}
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "800px" }}>
          <div ref={targetRef} style={{ width: "800px", padding: "48px", backgroundColor: "white", color: "black", fontFamily: "Georgia, 'Times New Roman', serif" }}>
            {/* PDF Header */}
            <div style={{ borderBottom: "3px solid black", paddingBottom: "20px", marginBottom: "32px" }}>
              <div style={{ fontSize: "11px", fontWeight: "bold", letterSpacing: "3px", textTransform: "uppercase", color: "#555", marginBottom: "8px" }}>
                Confidential — Visa Interview Preparation
              </div>
              <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: 0 }}>UKVI Credibility Defense Brief</h1>
              <div style={{ fontSize: "12px", color: "#444", marginTop: "8px" }}>
                Prepared for: <strong>{guide.universityName || "—"}</strong> · Course: <strong>{guide.courseName || "—"}</strong>
              </div>
            </div>

            {/* Section: Course & Academic Justification */}
            <PdfSection title="Part A — Course & Academic Justification">
              <PdfQA
                q="Q1. What is your CAS number and tuition fee for this programme?"
                a={`CAS Number: ${guide.casNumber || "—"} | Tuition Fee: ${guide.tuitionFee || "—"} | Start Date: ${guide.courseStartDate || "—"}`}
              />
              <PdfQA
                q="Q2. What alternative universities did you consider, and why did you ultimately choose this one?"
                a={guide.alternativeUniversities || "[Pending input]"}
              />
              <PdfQA
                q="Q3. Why is this specific university the best fit for your goals?"
                a={guide.whyThisUniversity || "[Pending input]"}
              />
              <PdfQA
                q="Q4. Can you name the core modules of your programme and explain what you will learn?"
                a={guide.coreModules || "[Pending input]"}
              />
              <PdfQA
                q="Q5. What campus facilities or resources are you looking forward to using?"
                a={guide.campusFacilities || "[Pending input]"}
              />
            </PdfSection>

            {/* Section: Financial Credibility */}
            <PdfSection title="Part B — Financial Credibility">
              <PdfQA
                q="Q6. Who is your financial sponsor, and what is their relationship to you?"
                a={`Sponsor: ${guide.sponsorName || "—"} | Relationship: ${guide.sponsorRelationship || "—"}`}
              />
              <PdfQA
                q="Q7. What is your sponsor's occupation and monthly income?"
                a={`Occupation: ${guide.sponsorOccupation || "—"} | Monthly Income: ${guide.sponsorMonthlyIncome || "—"}`}
              />
              <PdfQA
                q="Q8. How were the funds for your studies accumulated?"
                a={guide.sponsorFundSource || "[Pending input]"}
              />
              <PdfQA
                q="Q9. What are your estimated monthly living costs in the UK, and what are your total savings?"
                a={`Monthly Living Costs: ${guide.monthlyLivingCosts || "—"} | Total Savings Available: ${guide.totalSavings || "—"}`}
              />
            </PdfSection>

            {/* Section: Post-Study Intent */}
            <PdfSection title="Part C — Post-Study Plans & Future Intent">
              <PdfQA
                q="Q10. What companies do you intend to work for or what career path will you pursue after graduation?"
                a={guide.targetCompanies || "[Pending input]"}
              />
              <PdfQA
                q="Q11. What is your expected starting salary in the UK graduate job market?"
                a={guide.expectedSalary || "[Pending input]"}
              />
              <PdfQA
                q="Q12. How does this degree directly support your long-term career ambitions?"
                a={guide.careerJustification || "[Pending input]"}
              />
              <PdfQA
                q="Q13. Do you intend to return to your home country after your studies? Explain your ties."
                a={guide.intentToReturn || "[Pending input]"}
              />
            </PdfSection>

            {/* PDF Footer */}
            <div style={{ borderTop: "1px solid #ccc", marginTop: "40px", paddingTop: "16px", fontSize: "10px", color: "#888", display: "flex", justifyContent: "space-between" }}>
              <span>This document is for interview preparation purposes only.</span>
              <span>Generated via ChanWiser Student Portfolio</span>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}

// ─── Study Guide Tab ───────────────────────────────────────────────────────────
function StudyGuideTab({
  guide,
  setGuide,
}: {
  guide: StudyGuideData;
  setGuide: React.Dispatch<React.SetStateAction<StudyGuideData>>;
}) {
  const set = (key: keyof StudyGuideData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setGuide((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="space-y-8">

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-3xl p-5">
        <AlertCircle size={18} className="text-indigo-500 mt-0.5 shrink-0" />
        <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 leading-relaxed">
          Answer each question as if you are in the Visa Officer's interview. Be specific, honest, and consistent.
          When you're done, click <strong>Export Defense Brief</strong> to download your formatted PDF.
        </div>
      </div>

      {/* ── Section A: Course Essentials ───────────────────────────── */}
      <GuideSection icon={<GraduationCap size={18} />} title="Academic Justification" color="indigo">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GuideField label="University Name" hint="The full official name of your chosen institution.">
            <input type="text" value={guide.universityName} onChange={set("universityName")} placeholder="e.g. University of Manchester" className={inputCls} />
          </GuideField>
          <GuideField label="Course / Programme Name" hint="The exact title as shown on your offer letter.">
            <input type="text" value={guide.courseName} onChange={set("courseName")} placeholder="e.g. MSc Data Science" className={inputCls} />
          </GuideField>
          <GuideField label="CAS Number" hint="Your unique 14-character Confirmation of Acceptance code.">
            <input type="text" value={guide.casNumber} onChange={set("casNumber")} placeholder="e.g. X01234567890123" className={inputCls} />
          </GuideField>
          <GuideField label="Course Start Date" hint="The date listed on your CAS or offer letter.">
            <input type="text" value={guide.courseStartDate} onChange={set("courseStartDate")} placeholder="e.g. September 2025" className={inputCls} />
          </GuideField>
          <GuideField label="Annual Tuition Fee (£)" hint="Total tuition for the year, shown on CAS.">
            <input type="text" value={guide.tuitionFee} onChange={set("tuitionFee")} placeholder="e.g. £18,500" className={inputCls} />
          </GuideField>
        </div>

        <GuideField label="What other universities did you consider, and why did you choose THIS one?" hint="The Visa Officer wants to verify you made a deliberate, researched choice — not a random application. Name 2–3 alternatives and contrast their ranking, course structure, or location vs. your chosen university.">
          <textarea value={guide.alternativeUniversities} onChange={set("alternativeUniversities")} rows={4} placeholder="e.g. I also considered King's College London and the University of Leeds. I chose Manchester because it ranked #1 in the QS World Rankings for my subject, offered a dedicated Data Science research lab, and provided stronger industry placement support..." className={textareaCls} />
        </GuideField>

        <GuideField label="Why is this university the best fit for YOUR career goals specifically?" hint="Be personal. Link the university's specific strengths (research centres, professors, industry partners) to your post-study career plan.">
          <textarea value={guide.whyThisUniversity} onChange={set("whyThisUniversity")} rows={4} placeholder="e.g. The university's £8M Data Innovation Centre aligns directly with my goal of working in fintech data analysis. Professor X's research in algorithmic trading is closely linked to my dissertation topic..." className={textareaCls} />
        </GuideField>

        <GuideField label="Name the core modules of your programme and explain what you will study." hint="Research your course handbook. The Visa Officer expects you to know your own course structure. List 4–6 modules and a brief description of each.">
          <textarea value={guide.coreModules} onChange={set("coreModules")} rows={5} placeholder="e.g. 1. Machine Learning Fundamentals — covers supervised/unsupervised models. 2. Big Data Analytics — Hadoop and Spark pipelines. 3. Statistical Inference — Bayesian methods and hypothesis testing..." className={textareaCls} />
        </GuideField>

        <GuideField label="What campus facilities or resources are you looking forward to using?" hint="Mention specific facilities like the library, research labs, career centre, or student societies. This demonstrates genuine engagement.">
          <textarea value={guide.campusFacilities} onChange={set("campusFacilities")} rows={3} placeholder="e.g. The Alan Turing Building's computing labs, the 24-hour John Rylands Library access, and the Data Science Society where I plan to connect with industry mentors..." className={textareaCls} />
        </GuideField>
      </GuideSection>

      {/* ── Section B: Financial Credibility ───────────────────────── */}
      <GuideSection icon={<Banknote size={18} />} title="Financial Credibility" color="emerald">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GuideField label="Financial Sponsor's Full Name" hint="The person who will be funding your studies.">
            <input type="text" value={guide.sponsorName} onChange={set("sponsorName")} placeholder="e.g. Mr. Emmanuel Adeyemi" className={inputCls} />
          </GuideField>
          <GuideField label="Sponsor's Relationship to You" hint="e.g. Father, Uncle, Self-Funded.">
            <input type="text" value={guide.sponsorRelationship} onChange={set("sponsorRelationship")} placeholder="e.g. Father" className={inputCls} />
          </GuideField>
          <GuideField label="Sponsor's Occupation" hint="Their current job title and employer.">
            <input type="text" value={guide.sponsorOccupation} onChange={set("sponsorOccupation")} placeholder="e.g. Senior Civil Engineer at Dangote Group" className={inputCls} />
          </GuideField>
          <GuideField label="Sponsor's Monthly Income (approx.)" hint="In the local currency. The Visa Officer will assess if it's consistent with the savings shown.">
            <input type="text" value={guide.sponsorMonthlyIncome} onChange={set("sponsorMonthlyIncome")} placeholder="e.g. ₦850,000 per month" className={inputCls} />
          </GuideField>
          <GuideField label="Estimated Monthly Living Costs in the UK (£)" hint="Research your city's cost of living. London is typically £1,200–£1,800/month.">
            <input type="text" value={guide.monthlyLivingCosts} onChange={set("monthlyLivingCosts")} placeholder="e.g. £1,400/month" className={inputCls} />
          </GuideField>
          <GuideField label="Total Funds / Savings Available (£)" hint="Total amount shown in bank statements across the required period.">
            <input type="text" value={guide.totalSavings} onChange={set("totalSavings")} placeholder="e.g. £32,000" className={inputCls} />
          </GuideField>
        </div>

        <GuideField label="How were the funds for your studies accumulated over time?" hint="Explain the SOURCE of the money — salary savings, business proceeds, property sale, etc. This must match what's shown in the bank statements. Inconsistency is a red flag.">
          <textarea value={guide.sponsorFundSource} onChange={set("sponsorFundSource")} rows={4} placeholder="e.g. My father has worked as a civil engineer for 22 years and has been saving consistently since 2019 specifically for my education. The funds are accumulated from his monthly salary payments and annual bonuses..." className={textareaCls} />
        </GuideField>
      </GuideSection>

      {/* ── Section C: Post-Study Plans ─────────────────────────────── */}
      <GuideSection icon={<Target size={18} />} title="Future Plans & Post-Study Intent" color="rose">
        <GuideField label="What companies or sectors do you intend to work for after graduating?" hint="Be specific. Research actual graduate employers in your field in the UK or your home country. The Visa Officer assesses whether your plan is realistic and researched.">
          <textarea value={guide.targetCompanies} onChange={set("targetCompanies")} rows={4} placeholder="e.g. I intend to apply for Graduate Data Analyst roles at Deloitte, KPMG, or McKinsey in the UK on a Graduate Route visa, before returning to Nigeria to lead data strategy for a fintech startup..." className={textareaCls} />
        </GuideField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GuideField label="Expected Starting Salary (£)" hint="Research actual UK graduate salary data for your specific role. e.g. data from Glassdoor or graduate salary surveys.">
            <input type="text" value={guide.expectedSalary} onChange={set("expectedSalary")} placeholder="e.g. £32,000–£38,000 for a Graduate Data Analyst" className={inputCls} />
          </GuideField>
        </div>

        <GuideField label="How does this degree directly support your long-term career ambitions?" hint="Connect the degree to your future career in a logical, compelling way. Show the Visa Officer there is a clear, credible career arc.">
          <textarea value={guide.careerJustification} onChange={set("careerJustification")} rows={4} placeholder="e.g. Nigeria's data economy is growing at 35% annually. This MSc provides globally recognised technical skills and a UK alumni network that I can leverage to secure funding and launch a data consultancy serving West African financial institutions..." className={textareaCls} />
        </GuideField>

        <GuideField label="Do you intend to return to your home country? What ties do you have?" hint="Demonstrating strong home-country ties (family, business ownership, property) significantly strengthens credibility. Be specific about what calls you back.">
          <textarea value={guide.intentToReturn} onChange={set("intentToReturn")} rows={4} placeholder="e.g. Yes. After completing the 2-year Graduate Route, I plan to return to Nigeria where I have strong ties — my parents and siblings live in Lagos, I co-own a business with my brother registered in 2022, and I own land in Abuja..." className={textareaCls} />
        </GuideField>
      </GuideSection>

    </div>
  );
}

// ─── Document Vault Tab ───────────────────────────────────────────────────────
function DocumentVaultTab({
  vault,
  uploading,
  onLink,
  onRemove,
}: {
  vault: VaultData;
  uploading: string | null;
  onLink: (fieldId: keyof VaultData, url: string) => void;
  onRemove: (fieldId: keyof VaultData) => void;
}) {
  const [inputUrls, setInputUrls] = useState<Partial<Record<keyof VaultData, string>>>({});

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-3xl p-5">
        <ShieldCheck size={18} className="text-amber-500 mt-0.5 shrink-0" />
        <div className="text-xs font-bold text-amber-700 dark:text-indigo-300 leading-relaxed uppercase tracking-widest">
          All documents are now linked via secure direct URLs to prevent storage failures. Paste your Google Drive share links below.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {VAULT_FIELDS.map((field) => {
          const file = vault[field.id];
          const isProcessing = uploading === field.id;
          const isLinked = !!file;

          return (
            <div key={field.id} className="bg-white dark:bg-slate-800 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden transition-all hover:border-indigo-500/30">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${isLinked ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-gray-50 dark:bg-slate-700"}`}>
                    {isLinked ? (
                      <CheckCircle2 size={20} className="text-emerald-500" />
                    ) : (
                      <Link2 size={20} className="text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{field.label}</p>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">{field.hint}</p>
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
                  {isLinked && file ? (
                    <>
                       <div className="flex-1 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-700 hidden sm:block">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter truncate max-w-[120px]">{(file as PackFile).fileName}</p>
                       </div>
                      <a
                        href={(file as PackFile).fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-xl font-black text-xs uppercase tracking-widest border border-gray-100 dark:border-slate-600 hover:scale-105 transition-all"
                      >
                        <Eye size={13} /> View
                      </a>
                      <button
                        onClick={() => onRemove(field.id)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl font-black text-xs uppercase tracking-widest border border-rose-100 dark:border-rose-900/30 hover:scale-105 transition-all"
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </>
                  ) : (
                    <div className="w-full flex items-center gap-2">
                       <input
                         type="url"
                         placeholder="Paste Drive Link..."
                         value={inputUrls[field.id] || ""}
                         onChange={(e) => setInputUrls({...inputUrls, [field.id]: e.target.value})}
                         className="flex-1 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                       />
                       <button
                         disabled={!inputUrls[field.id] || isProcessing}
                         onClick={() => {
                            onLink(field.id, inputUrls[field.id]!);
                            setInputUrls({...inputUrls, [field.id]: ""});
                         }}
                         className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all disabled:opacity-30 flex items-center gap-2"
                       >
                         {isProcessing ? <Loader2 size={12} className="animate-spin" /> : "Link"}
                       </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function GuideSection({
  icon,
  title,
  color,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color: "indigo" | "emerald" | "rose";
  children: React.ReactNode;
}) {
  const colorMap = {
    indigo: "bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/30 text-indigo-600",
    emerald: "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30 text-emerald-600",
    rose: "bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800/30 text-rose-600",
  };
  const badgeCls = colorMap[color];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[40px] border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-7 pb-5 border-b border-gray-50 dark:border-slate-700/60">
        <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center ${badgeCls}`}>
          {icon}
        </div>
        <h2 className="text-sm font-black uppercase tracking-[0.15em] text-gray-700 dark:text-slate-300">{title}</h2>
      </div>
      <div className="p-7 space-y-7">{children}</div>
    </div>
  );
}

function GuideField({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-black text-gray-800 dark:text-white leading-snug">{label}</label>
      <p className="text-[11px] text-gray-400 dark:text-slate-500 font-medium leading-relaxed italic mb-2">{hint}</p>
      {children}
    </div>
  );
}

/** Renders a single Q&A block inside the hidden PDF template */
function PdfQA({ q, a }: { q: string; a: string }) {
  return (
    <div style={{ marginBottom: "20px", pageBreakInside: "avoid" }}>
      <p style={{ fontWeight: "bold", fontSize: "13px", color: "#1a1a1a", marginBottom: "6px" }}>{q}</p>
      <p style={{ fontSize: "13px", color: "#333", lineHeight: "1.7", paddingLeft: "16px", borderLeft: "3px solid #ccc" }}>{a}</p>
    </div>
  );
}

/** Renders a titled section block in the PDF */
function PdfSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "32px" }}>
      <div style={{ borderBottom: "1.5px solid #e0e0e0", paddingBottom: "8px", marginBottom: "18px" }}>
        <h2 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1.5px", color: "#444" }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Shared Input Styles ───────────────────────────────────────────────────────
const inputCls =
  "w-full bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all";

const textareaCls =
  "w-full bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none leading-relaxed";
