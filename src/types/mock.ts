export interface MockQuestion {
  id: string;
  text: string;
  timeLimit: number; // in seconds
}

export interface MockQuestionSet {
  id: string;
  title: string; // e.g., "Standard UKVI Core"
  category?: 'core' | 'supplemental';
  timePerQuestionSeconds: number; // fallback/legacy
  isRandomized: boolean;
  questions: (string | MockQuestion)[]; // Supports both simple text and objects
  isDefault: boolean;
  isArchived?: boolean;
  createdAt: any;
}

export interface MockInterviewAnswer {
  questionId: string;
  questionText: string;
  videoUrl?: string; // specific URL for this chunk
}

export interface QuestionTimestamp {
  questionId: string;
  startTime: number;
}

export interface MockInterviewAttempt {
  id?: string;
  studentId: string;
  studentName: string;
  answers: MockInterviewAnswer[];
  videoUrl?: string; // fallback
  videoUrls: string[]; // List of all chunk URLs
  questionTimestamps?: QuestionTimestamp[];
  startedAt: any;
  submittedAt: any;
  timeTakenSeconds: number;
  status: 'in_progress' | 'completed' | 'timeout' | 'pending_review';
  setId: string;
  askedQuestions: string[];
}

