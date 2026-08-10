import { TestQuestionSet } from "@/types/academy";

/**
 * Hardcoded Curriculum for Core UKVI Modules (1-5)
 * Adheres strictly to the Academy data schema.
 */
export const CORE_UKVI_MODULES: Partial<TestQuestionSet>[] = [
  {
    id: "core_ukvi_m1",
    title: "Module 1: Introduction to UKVI Compliance",
    timePerQuestionSeconds: 10,
    isRandomized: true,
    isArchived: false,
    isDefault: true,
    category: "core",
    orderIndex: 1,
    learningContent: `
      <div class="space-y-4">
        <h3 class="text-xl font-black text-blue-600 uppercase">Welcome to UKVI Compliance Foundations</h3>
        <p class="text-sm leading-relaxed">Before you enter the test arena, understand that the <strong>UK Visas and Immigration (UKVI)</strong> division of the Home Office evaluates international students based on their <strong>intent</strong> and <strong>credibility</strong>.</p>
        <div class="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
           <h4 class="text-xs font-black uppercase mb-2">Key Compliance Pillars:</h4>
           <ul class="list-disc list-inside text-xs space-y-1 font-bold">
              <li>Genuine Student Test: Proving your primary reason for travel is education.</li>
              <li>Immigration History: Full disclosure of previous visa refusals globally.</li>
              <li>Institutional Research: Deep knowledge of your chosen university and course.</li>
           </ul>
        </div>
        <p class="text-[10px] font-black uppercase text-gray-400">Mission Parameters: 10 Randomized Questions • 10 Seconds Per Question • 80% Required to Pass.</p>
      </div>
    `,
    questions: [
      { id: "m1_q1", prompt: "What does UKVI stand for?", options: [{ id: "o1", text: "UK Visas and Immigration" }, { id: "o2", text: "UK Visa Institute" }, { id: "o3", text: "United Kingdom Visa Int." }, { id: "o4", text: "University Knowledge & Visa Information" }], correctOptionId: "o1", explanation: "UKVI is the division of the Home Office responsible for the UK's visa system." },
      { id: "m1_q2", prompt: "Which government department is responsible for UKVI?", options: [{ id: "o1", text: "Department of Education" }, { id: "o2", text: "The Home Office" }, { id: "o3", text: "Foreign & Commonwealth Office" }, { id: "o4", text: "Department for Business" }], correctOptionId: "o2", explanation: "UKVI is a division of the Home Office." },
      { id: "m1_q3", prompt: "What is the primary purpose of the 'Credibility Interview'?", options: [{ id: "o1", text: "To check your English speaking speed" }, { id: "o2", text: "To verify if you are a genuine student" }, { id: "o3", text: "To take your fingerprints" }, { id: "o4", text: "To discuss UK tourist attractions" }], correctOptionId: "o2", explanation: "The interview ensures you genuinely intend to study and have researched your options." },
      { id: "m1_q4", prompt: "Which of these is a valid reason for a student visa refusal?", options: [{ id: "o1", text: "Having too many qualifications" }, { id: "o2", text: "Insufficient financial evidence" }, { id: "o3", text: "Applying 3 months early" }, { id: "o4", text: "Studying in a cold city" }], correctOptionId: "o2", explanation: "Financial non-compliance is a major reason for refusal." },
      { id: "m1_q5", prompt: "True or False: You can work 40 hours per week during term time.", options: [{ id: "o1", text: "True" }, { id: "o2", text: "False" }], correctOptionId: "o2", explanation: "Term-time work is usually restricted to 20 hours per week for degree-level students." },
      { id: "m1_q6", prompt: "What is the CAS in the student visa process?", options: [{ id: "o1", text: "Course Admission System" }, { id: "o2", text: "Confirmation of Acceptance for Studies" }, { id: "o3", text: "Certified Academic Statement" }, { id: "o4", text: "Customs and Security" }], correctOptionId: "o2" },
      { id: "m1_q7", prompt: "How long is a CAS valid for?", options: [{ id: "o1", text: "12 months" }, { id: "o2", text: "6 months" }, { id: "o3", text: "3 months" }, { id: "o4", text: "1 month" }], correctOptionId: "o2" },
      { id: "m1_q8", prompt: "What is the IHS?", options: [{ id: "o1", text: "International Health Surcharge" }, { id: "o2", text: "Immigration Home Service" }, { id: "o3", text: "Internal Housing System" }, { id: "o4", text: "Institute for Higher Studies" }], correctOptionId: "o1" },
      { id: "m1_q9", prompt: "Who must pay the International Health Surcharge?", options: [{ id: "o1", text: "Only students from the USA" }, { id: "o2", text: "Most visa applicants staying over 6 months" }, { id: "o3", text: "Only students with pre-existing conditions" }, { id: "o4", text: "No one, it is optional" }], correctOptionId: "o2" },
      { id: "m1_q10", prompt: "What is the RQF level for a Bachelor's degree?", options: [{ id: "o1", text: "Level 4" }, { id: "o2", text: "Level 6" }, { id: "o3", text: "Level 7" }, { id: "o4", text: "Level 8" }], correctOptionId: "o2" },
      { id: "m1_q11", prompt: "What is the RQF level for a Master's degree?", options: [{ id: "o1", text: "Level 5" }, { id: "o2", text: "Level 6" }, { id: "o3", text: "Level 7" }, { id: "o4", text: "Level 8" }], correctOptionId: "o3" },
      { id: "m1_q12", prompt: "Which document confirms your course details for the visa?", options: [{ id: "o1", text: "Birth Certificate" }, { id: "o2", text: "CAS" }, { id: "o3", text: "High School Diploma" }, { id: "o4", text: "Bank Statement" }], correctOptionId: "o2" },
      { id: "m1_q13", prompt: "How many months of maintenance funds are required for London?", options: [{ id: "o1", text: "6 months" }, { id: "o2", text: "9 months" }, { id: "o3", text: "12 months" }, { id: "o4", text: "The whole course" }], correctOptionId: "o2" },
      { id: "m1_q14", prompt: "What is the '28-day rule'?", options: [{ id: "o1", text: "Funds must be held for 28 consecutive days" }, { id: "o2", text: "You must apply 28 days after getting CAS" }, { id: "o3", text: "You must arrive 28 days before course starts" }, { id: "o4", text: "Refusal must be appealed in 28 days" }], correctOptionId: "o1" },
      { id: "m1_q15", prompt: "Where do you find the most accurate visa guidance?", options: [{ id: "o1", text: "Social Media" }, { id: "o2", text: "GOV.UK" }, { id: "o3", text: "Unverified blogs" }, { id: "o4", text: "Travel agents only" }], correctOptionId: "o2" },
      { id: "m1_q16", prompt: "What is a BRP?", options: [{ id: "o1", text: "Biometric Residence Permit" }, { id: "o2", text: "Basic Registration Paper" }, { id: "o3", text: "British Residency Pass" }, { id: "o4", text: "Boarding and Road Permit" }], correctOptionId: "o1" },
      { id: "m1_q17", prompt: "Do you need a visa to study in the UK if you are a non-EEA national?", options: [{ id: "o1", text: "No" }, { id: "o2", text: "Yes" }], correctOptionId: "o2" },
      { id: "m1_q18", prompt: "What is the maximum study limit for degree level study?", options: [{ id: "o1", text: "2 years" }, { id: "o2", text: "5 years (with exceptions)" }, { id: "o3", text: "Unlimited" }, { id: "o4", text: "10 years" }], correctOptionId: "o2" },
      { id: "m1_q19", prompt: "Which of these is NOT a student visa requirement?", options: [{ id: "o1", text: "Valid CAS" }, { id: "o2", text: "Financial proof" }, { id: "o3", text: "A job offer in the UK" }, { id: "o4", text: "English language proficiency" }], correctOptionId: "o3" },
      { id: "m1_q20", prompt: "What is SELT?", options: [{ id: "o1", text: "Secure English Language Test" }, { id: "o2", text: "Student Entry Level Training" }, { id: "o3", text: "System for Electronic Labour Tracking" }, { id: "o4", text: "Standard Entry Log Template" }], correctOptionId: "o1" },
      { id: "m1_q21", prompt: "Which body regulates UK universities?", options: [{ id: "o1", text: "Office for Students (OfS)" }, { id: "o2", text: "The Police" }, { id: "o3", text: "The NHS" }, { id: "o4", text: "BBC" }], correctOptionId: "o1" },
      { id: "m1_q22", prompt: "What is the TB test requirement for certain countries?", options: [{ id: "o1", text: "Tuberculosis screening" }, { id: "o2", text: "Technical Background check" }, { id: "o3", text: "Travel Booking verification" }, { id: "o4", text: "Total Budget assessment" }], correctOptionId: "o1" },
      { id: "m1_q23", prompt: "What happens if you use fake documents?", options: [{ id: "o1", text: "You get a warning" }, { id: "o2", text: "You are banned for up to 10 years" }, { id: "o3", text: "You pay a small fine" }, { id: "o4", text: "Nothing" }], correctOptionId: "o2" },
      { id: "m1_q24", prompt: "Can you switch your visa from within the UK?", options: [{ id: "o1", text: "Always" }, { id: "o2", text: "Never" }, { id: "o3", text: "Only under specific conditions" }, { id: "o4", text: "Only as a tourist" }], correctOptionId: "o3" },
      { id: "m1_q25", prompt: "What is the ATAS requirement?", options: [{ id: "o1", text: "Security clearance for certain sensitive courses" }, { id: "o2", text: "Academic Transcript Authentication Service" }, { id: "o3", text: "Advanced Travel Authorization System" }, { id: "o4", text: "Auto-Trip Approval Scheme" }], correctOptionId: "o1" },
      { id: "m1_q26", prompt: "Is your visa tied to a specific university?", options: [{ id: "o1", text: "Yes, the sponsor who issued your CAS" }, { id: "o2", text: "No, you can go anywhere" }], correctOptionId: "o1" },
      { id: "m1_q27", prompt: "What should you do if your contact details change?", options: [{ id: "o1", text: "Tell no one" }, { id: "o2", text: "Update the university and UKVI" }, { id: "o3", text: "Post on Instagram" }, { id: "o4", text: "Wait until graduation" }], correctOptionId: "o2" },
      { id: "m1_q28", prompt: "What is the minimum age for a Student Visa?", options: [{ id: "o1", text: "12" }, { id: "o2", text: "16" }, { id: "o3", text: "18" }, { id: "o4", text: "21" }], correctOptionId: "o2" },
      { id: "m1_q29", prompt: "Does a student visa lead to permanent residency automatically?", options: [{ id: "o1", text: "Yes" }, { id: "o2", text: "No" }], correctOptionId: "o2" },
      { id: "m1_q30", prompt: "What is the 'Graduate Route'?", options: [{ id: "o1", text: "A walking path on campus" }, { id: "o2", text: "A post-study work visa for 2-3 years" }, { id: "o3", text: "A bus route to London" }, { id: "o4", text: "A graduation ceremony" }], correctOptionId: "o2" }
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
