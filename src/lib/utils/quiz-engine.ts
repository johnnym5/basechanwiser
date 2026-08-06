/**
 * Utility functions for randomizing and grading the UKVI quizzes.
 */

export interface Question {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
}

export interface ShuffledQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerText: string;
  explanation?: string;
}

// Standard Fisher-Yates Shuffle
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Takes the pool of 30 questions and prepares 10 randomized ones for the student.
 */
export function generateModuleQuiz(questionPool: Question[]): ShuffledQuestion[] {
  // 1. Pick 10 random questions
  const selectedQuestions = shuffleArray(questionPool).slice(0, 10);

  // 2. Shuffle options for each and lock the correct answer string
  return selectedQuestions.map((q) => {
    const correctAnswerText = q.options[q.answerIndex];
    const shuffledOptions = shuffleArray(q.options);

    return {
      id: q.id,
      question: q.question,
      options: shuffledOptions,
      correctAnswerText, // Keep track of the text since index changes
      explanation: (q as any).explanation,
    };
  });
}

/**
 * Calculates the final score based on the low-points scale (1 sec = 1 pt).
 */
export function calculateQuizScore({
  userAnswers,
  quizQuestions,
  timeRemainingSeconds,
}: {
  userAnswers: Record<string, string>; // questionId -> selectedOptionText
  quizQuestions: ShuffledQuestion[];
  timeRemainingSeconds: number;
}) {
  let correctCount = 0;

  quizQuestions.forEach((q) => {
    if (userAnswers[q.id] === q.correctAnswerText) {
      correctCount += 1;
    }
  });

  const BASE_POINTS_PER_QUESTION = 10;
  const baseScore = correctCount * BASE_POINTS_PER_QUESTION;
  const timeBonus = Math.max(0, timeRemainingSeconds);
  const totalScore = baseScore + timeBonus;

  return {
    correctCount,
    totalQuestions: quizQuestions.length,
    baseScore,
    timeBonus,
    totalScore,
    scorePercentage: quizQuestions.length > 0 ? Math.round((correctCount / quizQuestions.length) * 100) : 0
  };
}
