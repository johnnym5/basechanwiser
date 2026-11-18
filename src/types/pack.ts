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

// Canonical fields from the student's built-in Study Guide form.
// Keep these aligned with the corresponding fields in `/student/interview-pack`.
export const STUDENT_GUIDE_FIELDS: PackField[] = [
  { id: "universityName", label: "University Name", description: "e.g. Coventry University", type: "short_text", required: true, category: "Academic & Admission Justification" },
  { id: "courseName", label: "Course Name", description: "e.g. MSc Public Health", type: "short_text", required: true, category: "Academic & Admission Justification" },
  { id: "casNumber", label: "CAS Number", description: "e.g. 0123456789", type: "short_text", required: true, category: "Academic & Admission Justification" },
  { id: "courseStartDate", label: "Course Start Date", description: "e.g. Sept 2025", type: "short_text", required: false, category: "Academic & Admission Justification" },
  { id: "tuitionFee", label: "Tuition Fee (£)", description: "e.g. £15,000", type: "short_text", required: false, category: "Academic & Admission Justification" },
  { id: "alternativeUniversities", label: "Alternative Universities Considered", description: "List other universities you applied to and why you chose this one instead...", type: "long_text", required: false, category: "Academic & Admission Justification" },
  { id: "whyThisUniversity", label: "Why This University", description: "Mention rankings, location, facilities, etc...", type: "long_text", required: false, category: "Academic & Admission Justification" },
  { id: "coreModules", label: "Core Modules & Learning Outcomes", description: "List at least 3 core modules and what you will learn...", type: "long_text", required: false, category: "Academic & Admission Justification" },
  { id: "campusFacilities", label: "Campus Facilities", description: "e.g. Library, Labs, Career Centre...", type: "long_text", required: false, category: "Academic & Admission Justification" },
  { id: "sponsorName", label: "Sponsor Name", description: "e.g. John Doe (Father)", type: "short_text", required: false, category: "Financial & Maintenance Evidence" },
  { id: "sponsorRelationship", label: "Sponsor Relationship", description: "e.g. Father / Self / Employer", type: "short_text", required: false, category: "Financial & Maintenance Evidence" },
  { id: "sponsorOccupation", label: "Sponsor Occupation", description: "e.g. Senior Engineer", type: "short_text", required: false, category: "Financial & Maintenance Evidence" },
  { id: "sponsorMonthlyIncome", label: "Sponsor Monthly Income", description: "e.g. £3,000", type: "short_text", required: false, category: "Financial & Maintenance Evidence" },
  { id: "sponsorFundSource", label: "Source of Funds", description: "e.g. Personal Savings / Business Profit", type: "long_text", required: false, category: "Financial & Maintenance Evidence" },
  { id: "monthlyLivingCosts", label: "Monthly Living Costs in UK", description: "e.g. £1,023 (Outside London)", type: "short_text", required: false, category: "Financial & Maintenance Evidence" },
  { id: "totalSavings", label: "Total Savings for Maintenance", description: "e.g. £15,000", type: "short_text", required: false, category: "Financial & Maintenance Evidence" },
  { id: "targetCompanies", label: "Target Companies", description: "List 3 companies you plan to work for...", type: "short_text", required: false, category: "Future Career Strategy & Home Ties" },
  { id: "expectedSalary", label: "Expected Starting Salary", description: "Expected salary in your home country...", type: "short_text", required: false, category: "Future Career Strategy & Home Ties" },
  { id: "careerJustification", label: "Career Justification", description: "How does this specific course help you get these target jobs?", type: "long_text", required: false, category: "Future Career Strategy & Home Ties" },
  { id: "intentToReturn", label: "Intent to Return & Ties", description: "Explain your family/economic ties and your definitive plan to return home...", type: "long_text", required: false, category: "Future Career Strategy & Home Ties" },
];

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
