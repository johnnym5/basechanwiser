export type AppRole = "Super Admin" | "Admin" | "Counselor" | "Student";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: AppRole;
  intake?: string;
  office?: string;
  assignedPackIds?: string[];
  completedPackIds?: string[];
  currentModuleLevel?: number;
  moduleScores?: Record<string, number>;
  readinessStatus?: TrafficLightStatus;

  // Advanced Counselor/Admin Preferences
  themePreference?: "light" | "dark" | "system";
  defaultDashboard?: "analytics" | "table";
  emailSignature?: string;
  twoFactorEnabled?: boolean;

  createdAt?: any;
  updatedAt?: any;
}

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  questionText: string;
  options: Option[];
  explanation?: string;
}

export interface QuestionPack {
  id: string;
  title: string;
  description?: string;
  category: string; // e.g. "Financial", "Academic", "General Compliance", "University Specific"
  videoUrl?: string;
  passScore: number; // default 80
  isDefault: boolean; // if true, available to all students automatically
  questions: Question[];
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  questions: Question[];
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface StudentProgress {
  userId: string;
  completedModuleIds: string[];
  completedPackIds?: string[];
  moduleScores: Record<string, number>;
  overallStatus: "In Progress" | "Modules Completed" | "Pending Interview" | "Evaluated";
  readinessStatus: "Green" | "Yellow" | "Orange" | "Red";
}

export interface LearningModule {
  id: string;
  order: number;
  title: string;
  description?: string;
  videoUrl?: string;
  passScore: number; // strictly 80
  questions: Question[];
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
}

export interface InterviewPack {
  id?: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  status: 'Not Started' | 'In Progress' | 'Submitted' | 'Verified';
  updatedAt: any;
  createdAt?: any;

  // Document Uploads / Links
  sopUrl: string;
  cvUrl: string;
  financialEvidenceUrl: string;

  // Academic & Admission Details
  applicationId: string;
  casNumber: string;
  tuitionAmount: number;
  depositPaid: number;
  universityRanking: string;
  modulesToStudy: string[];

  // Compliance & Intent (Text Fields)
  sponsorName: string;
  sponsorIncome: number;
  sponsorInfo: string; // Who is paying and their occupation
  accommodationDetails: string; // Where they will live, distance to campus
  careerPlans: string; // Target jobs, expected salary back home
  reasonsForCourse: string;
  reasonsForUniversity: string;
  reasonsForUK: string;
  studyGapReason: string;
  whyUniversity: string; // legacy mapping

  // Logistics
  timeline: string; // Intended travel dates, visa application date
}

export type TrafficLightStatus = "Green" | "Yellow" | "Orange" | "Red" | "Gray";
export type EvaluationDecision = "Pass" | "Retry" | "Escalate";

export interface JuniorEvaluation {
  id?: string;
  studentId: string;
  counselorId: string;
  decision: EvaluationDecision;
  trafficLight: TrafficLightStatus;
  notes: string;
  createdAt?: any;
}
