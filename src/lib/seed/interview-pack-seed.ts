import { db } from "@/lib/firebase/config";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { PackField } from "@/types/pack";

const DEFAULT_FIELDS: PackField[] = [
  { id: "sop", label: "Statement of Purpose (SOP)", type: "file", required: true, category: "Documents" },
  { id: "cv", label: "Curriculum Vitae (CV)", type: "file", required: true, category: "Documents" },
  { id: "application_doc", label: "Application Document", type: "file", required: true, category: "Documents" },
  { id: "cas_details", label: "CAS Details / Statement", type: "long_text", required: true, category: "CAS & Fees" },
  { id: "tuition_fees", label: "Tuition Fee & Deposit Paid", type: "short_text", required: true, category: "CAS & Fees" },
  { id: "sponsor_info", label: "Sponsor Information", type: "select", options: ["Self", "Parents", "Government", "Loan"], required: true, category: "Financials" },
  { id: "financial_evidence", label: "Financial Evidence / Bank Statements", type: "file", required: true, category: "Financials" },
  { id: "modules_rqf", label: "Modules & RQF Level", type: "short_text", required: true, category: "Academic" },
  { id: "uni_ranking", label: "University Ranking", type: "short_text", required: true, category: "Academic" },
  { id: "accommodation", label: "Accommodation Details", type: "select", options: ["Campus Dorm", "Private Rental", "Living with Relatives"], required: true, category: "Logistics" },
  { id: "career_plans", label: "Career Plans", type: "long_text", required: true, category: "Future" },
  { id: "reasons_course", label: "Reasons for Course / University / UK", type: "long_text", required: true, category: "Future" },
  { id: "timeline", label: "Timeline & Intake Date", type: "short_text", required: true, category: "Logistics" }
];

export async function seedDefaultPackConfig() {
  const configRef = doc(db, "interview_pack_configs", "default");
  const snap = await getDoc(configRef);

  if (!snap.exists()) {
    await setDoc(configRef, {
      fields: DEFAULT_FIELDS
    });
    console.log("Default interview pack config seeded.");
  }
}
