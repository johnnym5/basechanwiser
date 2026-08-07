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
  answerText: string;
}

export interface MockInterviewAttempt {
  id?: string;
  studentId: string;
  studentName: string;
  answers: MockInterviewAnswer[];
  startedAt: any;
  submittedAt: any;
  timeTakenSeconds: number;
  status: 'completed' | 'timeout';
}
