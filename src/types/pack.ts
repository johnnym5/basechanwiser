export type PackFieldType = 'file' | 'short_text' | 'long_text' | 'select' | 'number';

export interface PackField {
  id: string;
  label: string;
  description?: string;
  type: PackFieldType;
  options?: string[];
  required: boolean;
  category: string;
  isCustom?: boolean;
}

export interface PackFile {
  fileUrl: string;
  fileName: string;
  uploadedAt: any;
}

export interface StudentPackData {
  [fieldId: string]: string | number | PackFile;
}

export interface StudentPackConfig {
  fields?: PackField[];
  customFields?: PackField[];
  updatedAt?: any;
}

export const DEFAULT_PACK_FIELDS: PackField[] = [
  // Academic & Admission Justification
  { id: "universityName", label: "University Name", type: "short_text", required: true, category: "Academic & Admission Justification" },
  { id: "courseName", label: "Course Name", type: "short_text", required: true, category: "Academic & Admission Justification" },
  { id: "casNumber", label: "CAS Number", type: "short_text", required: true, category: "Academic & Admission Justification" },
  { id: "courseStartDate", label: "Course Start Date", type: "short_text", required: false, category: "Academic & Admission Justification" },
  { id: "tuitionFee", label: "Tuition Fee (£)", type: "short_text", required: false, category: "Academic & Admission Justification" },
  { id: "depositPaid", label: "Deposit Paid (£)", type: "number", required: false, category: "Academic & Admission Justification" },
  { id: "universityRanking", label: "University Ranking", type: "short_text", required: false, category: "Academic & Admission Justification" },
  { id: "alternativeUniversities", label: "Alternative Universities Considered", description: "Which other unis did the student research?", type: "long_text", required: false, category: "Academic & Admission Justification" },
  { id: "whyThisUniversity", label: "Why This Specific University?", description: "Personal fit, facilities, research links...", type: "long_text", required: false, category: "Academic & Admission Justification" },
  { id: "coreModules", label: "Core Modules & Learning Outcomes", description: "What specific knowledge will they gain?", type: "long_text", required: false, category: "Academic & Admission Justification" },
  { id: "campusFacilities", label: "Campus Facilities", description: "Labs, libraries, societies...", type: "long_text", required: false, category: "Academic & Admission Justification" },

  // Financial Credibility
  { id: "sponsorName", label: "Sponsor Name", type: "short_text", required: false, category: "Financial Credibility" },
  { id: "sponsorRelationship", label: "Relationship", type: "short_text", required: false, category: "Financial Credibility" },
  { id: "sponsorOccupation", label: "Sponsor Occupation", type: "short_text", required: false, category: "Financial Credibility" },
  { id: "sponsorMonthlyIncome", label: "Monthly Income", type: "short_text", required: false, category: "Financial Credibility" },
  { id: "monthlyLivingCosts", label: "Living Costs (£)", type: "short_text", required: false, category: "Financial Credibility" },
  { id: "totalSavings", label: "Total Savings (£)", type: "short_text", required: false, category: "Financial Credibility" },
  { id: "accommodationDetails", label: "Accommodation Details", type: "short_text", required: false, category: "Financial Credibility" },
  { id: "sponsorFundSource", label: "Source of Funds", description: "How were the savings accumulated?", type: "long_text", required: false, category: "Financial Credibility" },

  // Future Plans & Intent
  { id: "targetCompanies", label: "Target Companies", type: "short_text", required: false, category: "Future Plans & Intent" },
  { id: "expectedSalary", label: "Expected Salary (£)", type: "short_text", required: false, category: "Future Plans & Intent" },
  { id: "careerJustification", label: "Career Justification", description: "How does this degree help their career?", type: "long_text", required: false, category: "Future Plans & Intent" },
  { id: "intentToReturn", label: "Intent to Return & Home Ties", description: "Reasons to return home after studies...", type: "long_text", required: false, category: "Future Plans & Intent" },
  { id: "careerPlans", label: "Legacy Career Plans", type: "long_text", required: false, category: "Future Plans & Intent" },
];
