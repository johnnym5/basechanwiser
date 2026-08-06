export type AppRole = "Super Admin" | "Head of Compliance" | "Admin" | "Counselor" | "Student";

export interface UserProfile {
  uid: string;
  studentId?: string; // Unique short ID (e.g. BW-12345)
  email: string | null;
  displayName: string | null;
  role: AppRole;
  intake?: string;
  office?: string;
  targetUniversity?: string;
  targetCourse?: string;
  assignedPackIds?: string[];
  completedPackIds?: string[];
  currentModuleLevel?: number;
  moduleScores?: Record<string, number>;
  readinessStatus?: TrafficLightStatus;
  learningProgress?: number;
  gamifiedScore?: number;
  dayStreak?: number;
  lastLoginAt?: any;
  suspended?: boolean;
  status?: 'Active' | 'Suspended';
  photoURL?: string;
  documents?: Record<string, string>; // e.g. { passport: "url", transcript: "url" }

  // Advanced Counselor/Admin Preferences
  themePreference?: "light" | "dark" | "system";
  defaultDashboard?: "analytics" | "table";
  emailSignature?: string;
  twoFactorEnabled?: boolean;

  createdAt?: any;
  updatedAt?: any;
  mockInterview?: {
    videoUrl?: string;
    status?: string;
    submittedAt?: any;
    counselorNotes?: string;
    score?: number | null;
  };
  interviewPack?: {
    intendedUniversity: string;
    universityCity: string;
    courseOfStudy: string;
    academicHistory: string;
    studyGapReasons: string;
    fundingSource: string;
    postStudyPlans: string;
  };
  aiChatStats?: {
    lastMessageAt: any;
    date: string;
    count: number;
  };
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
  learningContent?: string;
  studyNotes?: string;
  requiresPreviousPass?: boolean;
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

  // Document Confirmation (Sent locally to counselor)
  hasSop: boolean;
  hasCv: boolean;
  hasFinancials: boolean;

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

// ── Module 12: Compliance Analytics Dashboard ──────────────────

export interface AnalyticsGlobalKPIs {
  totalPipeline: number;
  globalPassRate: number;
  averagePrepTimeDays: number;
  highRiskAlert: number;
}

export interface OfficePerformance {
  office: string;
  totalStudents: number;
  passRate: number;
}

export interface ReadinessFunnelStage {
  stage: string;
  count: number;
}

export interface CounselorWorkloadItem {
  counselorId: string;
  counselorName: string;
  studentCount: number;
}

export interface FailureReasonItem {
  reason: string;
  count: number;
}

export interface StudentRosterRow {
  uid: string;
  studentId?: string;
  displayName: string;
  email: string;
  office: string;
  readinessStatus: string;
  learningProgress: number;
  createdAt?: string;
}

export interface CounselorPerformanceRow {
  counselorId: string;
  counselorName: string;
  office: string;
  assignedStudents: number;
  evaluationsSubmitted: number;
  passRate: number;
}

export interface AnalyticsDashboardData {
  kpis: AnalyticsGlobalKPIs;
  officePerformance: OfficePerformance[];
  readinessFunnel: ReadinessFunnelStage[];
  counselorWorkload: CounselorWorkloadItem[];
  failureReasons: FailureReasonItem[];
  studentRoster: StudentRosterRow[];
  counselorPerformance: CounselorPerformanceRow[];
  generatedAt: string;
}

// ── Module 13: Notifications & Reminders ──────────────────

export interface AppNotification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string;
  createdAt: any;
}

export interface Reminder {
  id?: string;
  studentId: string;
  studentUid: string;
  counselorUid: string;
  message: string;
  triggerAt: number;
  isTriggered: boolean;
}
