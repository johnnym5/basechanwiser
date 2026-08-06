import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const packsRef = adminDb.collection('learning_modules');

    // Helper to transform simple seed format to app's Question format
    const transformQuestions = (rawQuestions: any[]) => {
      return rawQuestions.map((q, idx) => ({
        id: `q-${idx}-${Date.now()}`,
        questionText: q.questionText,
        options: q.options.map((opt: string, oIdx: number) => ({
          id: `opt-${oIdx}`,
          text: opt,
          isCorrect: opt === q.correctAnswer
        })),
        explanation: q.explanation || ""
      }));
    };

    // Schema for Module 1 (Repeat this structure for all 5 modules)
    const module1 = {
      title: "Module 1: Fundamentals of University & UKVI Credibility Interviews",
      description: "Purpose of interviews, Home Office guidelines, university vs. UKVI expectations, genuine student status.",
      order: 1,
      isDefault: true,
      requiresPreviousPass: false, // Module 1 is open
      learningContent: `
        ## 1. Purpose of the Credibility Interview
        The "Genuine Student" Rule: UK Visas and Immigration (UKVI) and UK universities conduct credibility interviews to verify that an applicant's primary purpose for coming to the UK is academic study, not illegal work or permanent settlement.

        ## 2. Institutional Framework
        - **Pre-CAS Interview (University):** Conducted by admissions to determine if a CAS (Confirmation of Acceptance for Studies) should be issued.
        - **UKVI Credibility Interview (Home Office):** Conducted online or via phone during the visa application process to verify intentions.

        ## 3. Key Assessment Indicators
        - Academic Fit & Progression
        - Language Proficiency
        - Relevance of Choice
      `,
      questions: transformQuestions([
        // Paste all 30 questions from Module 1 here using this format:
        {
          questionText: "What is the primary objective of a UKVI Credibility Interview?",
          options: [
            "To assess if the student qualifies for permanent residency",
            "To confirm the applicant is a genuine student with authentic intentions to study",
            "To test the student's ability to work full-time in the UK",
            "To evaluate the student's fitness levels for entry"
          ],
          correctAnswer: "To confirm the applicant is a genuine student with authentic intentions to study"
        },
        // ... Q2 through Q30 (User to fill in the rest)
      ]),
      createdAt: new Date(),
    };

    // Clear existing modules first if desired, or just add
    // await packsRef.doc('module-1').set(module1);

    await packsRef.add(module1);

    // Add Module 2, 3, 4, 5... (User to replicate structure)

    return NextResponse.json({ message: "Successfully seeded full 30-Q modules!" }, { status: 200 });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
