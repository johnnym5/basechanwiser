export type AppRole = "Super Admin" | "Head of Compliance" | "Admin" | "Counselor" | "Student";

export interface StaffPermissions {
  canDownloadDocs: boolean;
  canEditSettings: boolean;
  canManageModules: boolean;
}

export interface UserProfile {
  uid: string;
  studentId?: string; // Unique short ID (e.g. BW-12345)
  email: string | null;
  displayName: string | null;
  role: AppRole;
  permissions?: StaffPermissions;
  intake?: string;
  office?: string;
  targetUniversity?: string;
  targetCourse?: string;
  assignedCounselorId?: string; // UID of the counselor managing this student
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
  phoneNumber?: string;
  bio?: string;
  documents?: Record<string, string>; // e.g. { passport: "url", transcript: "url" }
  isOnline?: boolean;
  lastActive?: any; // Firestore Timestamp

  // Advanced Counselor/Admin Preferences
  assignedMockSetId?: string | null;
  assignedTestSetId?: string | null;
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
  summary?: string;
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

export interface LearningResource {
  heading: string;
  content: string;
}

export interface PoolQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
}

export interface LearningModule {
  id: string;
  order: number;
  title: string;
  summary: string;
  description?: string;
  videoUrl?: string;
  learningContent?: string;
  studyNotes?: string;
  learningResources: LearningResource[];
  questionPool: PoolQuestion[];
  requiresPreviousPass?: boolean;
  passScore: number; // strictly 80
  questions: Question[]; // Standardized version for the 10 randomized ones
  isDefault?: boolean;
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
  docsVerified?: boolean;
  updatedAt: any;
  createdAt?: any;

  // Document Confirmation (Sent locally to counselor)
  hasSop: boolean;
  hasCv: boolean;
  hasFinancials: boolean;

  // Academic & Admission Details
  universityName: string;
  courseName: string;
  courseStartDate: string;
  applicationId: string;
  casNumber: string;
  tuitionAmount: number;
  tuitionFee: string;
  depositPaid: number;
  universityRanking: string;
  modulesToStudy: string[];

  // Compliance & Intent (Text Fields)
  sponsorName: string;
  sponsorIncome: number;
  sponsorRelationship: string;
  sponsorFundSource: string;
  sponsorOccupation: string;
  sponsorMonthlyIncome: string;
  accommodationDetails: string; // Where they will live, distance to campus
  careerPlans: string; // Target jobs, expected salary back home
  reasonsForCourse: string;
  reasonsForUniversity: string;
  reasonsForUK: string;
  studyGapReason: string;
  whyUniversity: string; // legacy mapping
  whyThisUniversity: string;
  alternativeUniversities: string;
  coreModules: string;
  campusFacilities: string;
  monthlyLivingCosts: string;
  totalSavings: string;
  targetCompanies: string;
  expectedSalary: string;
  careerJustification: string;
  intentToReturn: string;

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

export interface InAppNotification {
  id?: string;
  targetUserId: string; // The counselor receiving the alert
  title: string;
  message: string;
  type: 'assignment' | 'alert' | 'message';
  isRead: boolean;
  createdAt: any; // Firestore Timestamp
  actionUrl?: string; // e.g., '/counselor/students/portfolio?id=...'
}

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
