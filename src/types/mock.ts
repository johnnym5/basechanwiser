export interface MockInterviewQuestion {
  id: string;
  text: string;
}

export interface MockInterviewConfig {
  questions: MockInterviewQuestion[];
  durationMinutes: number;
}

export interface MockInterviewAnswer {
  questionId: string;
  questionText: string;
  answerText?: string; // Text answer (optional now we have video)
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
  questionTimestamps: QuestionTimestamp[];
  videoUrl?: string;
  startedAt: any;
  submittedAt: any;
  timeTakenSeconds: number;
  status: 'completed' | 'timeout' | 'pending_review';
}
