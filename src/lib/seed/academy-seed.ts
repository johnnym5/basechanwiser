import { TestQuestionSet } from "@/types/academy";

/**
 * Hardcoded Curriculum for Core UKVI Modules (1-5)
 * Adheres strictly to the Academy data schema.
 */
export const CORE_UKVI_MODULES: Partial<TestQuestionSet>[] = [
  {
    id: "core_ukvi_m1",
    title: "Module 1: Introduction to UKVI Compliance",
    timePerQuestionSeconds: 30,
    isRandomized: true,
    isArchived: false,
    isDefault: true,
    category: "core",
    orderIndex: 1,
    questions: [
      {
        id: "m1_q1",
        prompt: "What does UKVI stand for?",
        options: [
          { id: "o1", text: "UK Visas and Immigration" },
          { id: "o2", text: "UK Virtual International" },
          { id: "o3", text: "United Kingdom Visa Institute" },
          { id: "o4", text: "University Knowledge & Visa Information" }
        ],
        correctOptionId: "o1",
        explanation: "UKVI is the division of the Home Office responsible for the UK's visa system."
      }
    ]
  },
  {
    id: "core_ukvi_m2",
    title: "Module 2: Financial Requirements & Evidence",
    timePerQuestionSeconds: 45,
    isRandomized: true,
    isArchived: false,
    isDefault: true,
    category: "core",
    orderIndex: 2,
    questions: [
      {
        id: "m2_q1",
        prompt: "For how many consecutive days must funds be held in your bank account?",
        options: [
          { id: "o1", text: "28 days" },
          { id: "o2", text: "14 days" },
          { id: "o3", text: "7 days" },
          { id: "o4", text: "31 days" }
        ],
        correctOptionId: "o1",
        explanation: "UKVI requires the 28-day rule for financial evidence."
      }
    ]
  },
  {
    id: "core_ukvi_m3",
    title: "Module 3: Academic Progression & Intent",
    timePerQuestionSeconds: 30,
    isRandomized: true,
    isArchived: false,
    isDefault: true,
    category: "core",
    orderIndex: 3,
    questions: [
      {
        id: "m3_q1",
        prompt: "What is 'Academic Progression' in the context of a student visa?",
        options: [
          { id: "o1", text: "Moving to a higher level of study than previous UK studies" },
          { id: "o2", text: "Increasing your GPA every semester" },
          { id: "o3", text: "Taking the same course twice at different universities" },
          { id: "o4", text: "Graduating on time" }
        ],
        correctOptionId: "o1",
        explanation: "New courses must typically be at a higher level than previous UK-based courses."
      }
    ]
  },
  {
    id: "core_ukvi_m4",
    title: "Module 4: The Credibility Interview Prep",
    timePerQuestionSeconds: 60,
    isRandomized: true,
    isArchived: false,
    isDefault: true,
    category: "core",
    orderIndex: 4,
    questions: [
      {
        id: "m4_q1",
        prompt: "Which of these is a critical factor evaluated during a credibility interview?",
        options: [
          { id: "o1", text: "Your knowledge of the university's location and campus facilities" },
          { id: "o2", text: "Your favorite food in the UK" },
          { id: "o3", text: "The brand of your laptop" },
          { id: "o4", text: "How many friends you have in London" }
        ],
        correctOptionId: "o1",
        explanation: "Interviewer evaluates if you are a genuine student based on your research of the institution."
      }
    ]
  },
  {
    id: "core_ukvi_m5",
    title: "Module 5: Post-Arrival Obligations",
    timePerQuestionSeconds: 30,
    isRandomized: true,
    isArchived: false,
    isDefault: true,
    category: "core",
    orderIndex: 5,
    questions: [
      {
        id: "m5_q1",
        prompt: "What is the maximum number of hours you can work per week on a standard Student Visa during term time?",
        options: [
          { id: "o1", text: "20 hours" },
          { id: "o2", text: "40 hours" },
          { id: "o3", text: "10 hours" },
          { id: "o4", text: "0 hours" }
        ],
        correctOptionId: "o1",
        explanation: "Degree-level students are usually permitted 20 hours per week of part-time work."
      }
    ]
  }
];

export const CORE_UKVI_MOCK_SET = {
  id: "core_mock_default",
  title: "Official UKVI Mock Interview (Core)",
  timePerQuestionSeconds: 60,
  isRandomized: true,
  isDefault: true,
  category: "core",
  questions: [
    "Why did you choose the UK over other countries like USA, Canada or Australia?",
    "Why this specific university and why not a similar course in your home country?",
    "Can you explain your study gap if any, and what did you do during that time?",
    "How will this course help your career plans in your home country?",
    "Who is sponsoring your studies and what is their occupation/annual income?",
    "What are your plans after completing your course in the UK?",
    "Where will you be staying in the UK and how far is it from the campus?",
    "What are the modules you will be studying in this course?"
  ]
};
