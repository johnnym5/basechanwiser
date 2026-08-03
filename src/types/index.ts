export type AppRole = "Admin" | "Counselor" | "Student";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: AppRole;
  intake?: string;
  office?: string;
  assignedPackIds?: string[];
  completedPackIds?: string[];
  readinessStatus?: TrafficLightStatus;
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

export interface InterviewPack {
  id?: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  passportNo: string;
  casNumber: string;
  offerLetterLink: string;
  tuitionAmount: number;
  depositPaid: number;
  sponsorName: string;
  sponsorIncome: number;
  studyGapReason: string;
  careerPlans: string;
  whyUniversity: string;
  status: "Draft" | "Submitted";
  createdAt?: any;
  updatedAt?: any;
}

export type TrafficLightStatus = "Green" | "Yellow" | "Orange" | "Red";
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
