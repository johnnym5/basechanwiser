import { adminDb } from '@/lib/firebaseAdmin';

/**
 * seedManager.ts
 * Consolidates all Academy Learning Track data into the `test_question_sets` collection.
 * Enforces a strict taxonomy: 'core' vs 'supplemental'.
 */

// ============================================================================
// DATA SEED DEFINITIONS
// ============================================================================

const CORE_MODULES = [
  {
    id: "module_1",
    orderIndex: 1,
    title: "Module 1: Fundamentals of University & UKVI Credibility Interviews",
    summary: "Core topics: Purpose of interviews, Home Office guidelines, university vs. UKVI expectations.",
    learningResources: [
      { heading: "1. Purpose", content: "Verify applicant's primary purpose is study, not illegal work." },
      { heading: "2. Framework", content: "Pre-CAS (University) vs. UKVI Credibility (Home Office)." }
    ],
    questionPool: [
      { id: "m1_q1", question: "What is the primary objective of a UKVI Credibility Interview?", options: ["Permanent residency", "Confirm genuine student status", "Full-time work test", "Fitness levels"], answerIndex: 1 },
      { id: "m1_q2", question: "Who conducts the Pre-CAS interview?", options: ["Home Office ECO", "University admissions/compliance team", "Embassy security", "High Commissioner"], answerIndex: 1 }
    ]
  },
  {
    id: "module_2",
    orderIndex: 2,
    title: "Module 2: CAS & Financial Compliance",
    summary: "Core topics: What CAS is, strict 28-day financial rules, acceptable fund sources.",
    learningResources: [
      { heading: "1. CAS", content: "Unique 14-character reference number generated via SMS." },
      { heading: "2. 28-Day Rule", content: "Funds must remain for 28 consecutive days without dropping below minimum." }
    ],
    questionPool: [
      { id: "m2_q1", question: "What does CAS stand for?", options: ["Academic Status", "Acceptance for Studies", "Academic Standards", "Admission Sponsorship"], answerIndex: 1 },
      { id: "m2_q4", question: "Required holding period for funds?", options: ["7 days", "14 days", "28 days", "90 days"], answerIndex: 2 }
    ]
  },
  {
    id: "module_3",
    orderIndex: 3,
    title: "Module 3: Academic & Course Knowledge",
    summary: "Core topics: Articulating course structure, modules, RQF levels, and assessment methods.",
    learningResources: [
      { heading: "1. Course Knowledge", content: "Must articulate specific modules and assessment methods." }
    ],
    questionPool: [
      { id: "m3_q1", question: "Best answer for 'Why this course?'", options: ["Parents chose", "Cheapest", "Specific modules & alignment with goals", "Visit UK"], answerIndex: 2 }
    ]
  },
  {
    id: "module_4",
    orderIndex: 4,
    title: "Module 4: Career Progression & ROI",
    summary: "Core topics: Post-study career path, ROI, and ties to home country.",
    learningResources: [
      { heading: "1. Career Strategy", content: "State specific target job titles and employers in home country." }
    ],
    questionPool: [
      { id: "m4_q1", question: "Plans after graduation?", options: ["Stay permanently", "Return home for specific roles", "No plans yet", "Apply for asylum"], answerIndex: 1 }
    ]
  },
  {
    id: "module_5",
    orderIndex: 5,
    title: "Module 5: Interview Delivery & Behavioral Excellence",
    summary: "Core topics: Communication standards, body language, and avoiding scripted answers.",
    learningResources: [
      { heading: "1. Delivery", content: "Avoid memorized answers. Speak naturally and maintain eye contact." }
    ],
    questionPool: [
      { id: "m5_q1", question: "Biggest technical mistake?", options: ["Dark suit", "Reading off notes/screens", "Sitting near window", "Drinking water"], answerIndex: 1 }
    ]
  }
];

const SUPPLEMENTAL_PACKS = [
  {
    id: "supplemental_compliance_drill",
    title: "UKVI General & Financial Compliance Drill",
    description: "Master the key UKVI rules and student visa conditions.",
    questions: [
      {
        id: "sq1",
        questionText: "Max weekly work hours during term time?",
        options: [
          { id: "a", text: "20 hours per week", isCorrect: true },
          { id: "b", text: "40 hours per week", isCorrect: false }
        ]
      }
    ]
  },
  {
    id: "supplemental_academic_intent",
    title: "Academic Intent & University Knowledge",
    description: "Deep dive into your specific university choice.",
    questions: [
      {
        id: "sq2",
        questionText: "Why this specific university?",
        options: [
          { id: "a", text: "Specific facilities & modules", isCorrect: true },
          { id: "b", text: "High Google rank", isCorrect: false }
        ]
      }
    ]
  }
];

// ============================================================================
// SEEDING LOGIC
// ============================================================================

export async function runBulkModuleSeed() {
  try {
    const setsRef = adminDb.collection('test_question_sets');

    // 1. DELETE OLD COLLECTIONS (Cleanup)
    const oldModules = await adminDb.collection('learning_modules').get();
    const oldPacks = await adminDb.collection('question_packs').get();
    const existingSets = await setsRef.get();

    const batch = adminDb.batch();
    oldModules.forEach(d => batch.delete(d.ref));
    oldPacks.forEach(d => batch.delete(d.ref));
    existingSets.forEach(d => batch.delete(d.ref));

    await batch.commit();
    console.log("Cleaned up old learning data.");

    // 2. SEED CONSOLIDATED TRACK
    const finalBatch = adminDb.batch();
    const now = new Date().toISOString();

    // Map Core
    CORE_MODULES.forEach(mod => {
      const questions = mod.questionPool.map(q => ({
        id: q.id,
        prompt: q.question,
        options: q.options.map((opt, i) => ({ id: `opt_${i}`, text: opt })),
        correctOptionId: `opt_${mod.questionPool.find(p => p.id === q.id)!.answerIndex}`
      }));

      finalBatch.set(setsRef.doc(mod.id), {
        id: mod.id,
        title: mod.title,
        summary: mod.summary,
        category: 'core',
        orderIndex: mod.orderIndex,
        questions,
        learningResources: mod.learningResources,
        timePerQuestionSeconds: 15,
        isRandomized: true,
        isArchived: false,
        isDefault: true,
        passScore: 80,
        createdAt: now
      });
    });

    // Map Supplemental
    SUPPLEMENTAL_PACKS.forEach(pack => {
      const questions = pack.questions.map(q => ({
        id: q.id,
        prompt: q.questionText,
        options: q.options.map((opt, i) => ({ id: opt.id, text: opt.text })),
        correctOptionId: q.options.find(o => o.isCorrect)!.id
      }));

      finalBatch.set(setsRef.doc(pack.id), {
        id: pack.id,
        title: pack.title,
        description: pack.description,
        category: 'supplemental',
        questions,
        timePerQuestionSeconds: 20,
        isRandomized: true,
        isArchived: false,
        isDefault: true,
        passScore: 80,
        createdAt: now
      });
    });

    await finalBatch.commit();
    console.log("Successfully seeded consolidated Academy track.");

    return { success: true, message: "Academy track consolidated and seeded." };
  } catch (error) {
    console.error("Seeding error:", error);
    return { success: false, error };
  }
}
