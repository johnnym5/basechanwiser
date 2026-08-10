export interface QuizOption {
  id: string;
  text: string;
}

export interface TestQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation?: string;
}

export interface TestQuestionSet {
  id: string;
  title: string;
  timePerQuestionSeconds: number;
  isRandomized: boolean; // Shuffles questions AND options
  isArchived: boolean;
  isDefault: boolean;
  questions: TestQuestion[];
  createdAt: any;
  category: 'core' | 'supplemental'; // STRICT TAXONOMY
  orderIndex?: number; // Used to sort Core Modules (1, 2, 3, 4, 5) to enforce linear progression
  summary?: string;
  description?: string;
  learningResources?: { heading: string; content: string }[];
  passScore?: number;
}

export interface AskedQuestion {
  prompt: string;
  shuffledOptions: string[];
  correctAnswerIndex: number;
  explanation?: string;
}

export interface TestAttempt {
  id?: string;
  studentId: string;
  studentName?: string;
  setId: string;
  askedQuestions: AskedQuestion[];
  studentAnswers: (number | null)[];
  scorePercentage: number;
  gamifiedScore: number;
  correctCount: number;
  totalQuestions: number;
  submittedAt: any;
}
