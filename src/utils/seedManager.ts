import { adminDb } from '@/lib/firebaseAdmin';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export interface SeedModule {
  id: string;
  title: string;
  summary: string;
  learningResources: { heading: string; content: string }[];
  questionPool: {
    id: string;
    question: string;
    options: string[];
    answerIndex: number;
    explanation?: string;
  }[];
}

// ============================================================================
// THE 5 MODULES SEED DATA
// ============================================================================

export const UKVI_MODULES_SEED: SeedModule[] = [
  {
    id: "module_1",
    title: "Module 1: Fundamentals of University & UKVI Credibility Interviews",
    summary: "Core topics: Purpose of interviews, Home Office guidelines, university vs. UKVI expectations, genuine student status (GTE/Genuine Student Test).",
    learningResources: [
      {
        heading: "1. Purpose of the Credibility Interview",
        content: "• The 'Genuine Student' Rule: UK Visas and Immigration (UKVI) and UK universities conduct credibility interviews to verify that an applicant's primary purpose for coming to the UK is academic study, not illegal work or permanent settlement.\n• Entry Clearance Officer (ECO) Role: The ECO assesses whether the candidate possesses sufficient English proficiency, genuine academic intent, and realistic financial backing.\n• University Pre-CAS Interviews: Before issuing a Confirmation of Acceptance for Studies (CAS), universities conduct internal credibility interviews to safeguard their UKVI Student Sponsor License."
      },
      {
        heading: "2. Institutional Framework",
        content: "• Pre-CAS Interview (University): Conducted by admissions or compliance teams. Focuses on academic background, suitability for the course, and basic financial capability.\n• UKVI Credibility Interview (Home Office): Conducted online or via phone (often by video link). Focuses on detailed verification of financial sources, course details, and long-term career logic."
      },
      {
        heading: "3. Key Assessment Indicators",
        content: "• Academic Fit & Progression: Explaining why this specific degree is a logical next step based on prior qualifications or work history.\n• Language Proficiency: Candidates must converse fluently without relying on interpreters, scripts, or external help.\n• Relevance of Choice: Ability to explain why the applicant chose the UK over their home country or alternative destinations."
      }
    ],
    questionPool: [
      { id: "m1_q1", question: "What is the primary objective of a UKVI Credibility Interview?", options: ["To assess if the student qualifies for permanent residency", "To confirm the applicant is a genuine student with authentic intentions to study", "To test the student's ability to work full-time in the UK", "To evaluate the student's fitness levels for entry"], answerIndex: 1 },
      { id: "m1_q2", question: "Who conducts the Pre-CAS interview?", options: ["Home Office Entry Clearance Officer", "The university's admissions or compliance team", "The local embassy security team", "The British High Commissioner"], answerIndex: 1 },
      { id: "m1_q3", question: "Why do UK universities conduct pre-CAS interviews before issuing a CAS?", options: ["To collect extra application fees", "To protect their UKVI Student Sponsor License by preventing visa refusals", "To rank students for automatic full scholarships", "To assign student accommodation locations"], answerIndex: 1 },
      { id: "m1_q4", question: "What happens if a student fails a UKVI credibility interview?", options: ["They are granted a work visa instead", "Their visa application is refused under genuine student rules", "They are allowed to re-interview unlimited times in the same week", "Their passport is permanently revoked"], answerIndex: 1 },
      { id: "m1_q5", question: "Which of the following is an ECO assessing during an interview?", options: ["Ability to memorize long scripts verbatim", "English language competence, course awareness, and financial credibility", "Political views on UK government policies", "Detailed knowledge of UK geography and transit lines"], answerIndex: 1 },
      { id: "m1_q6", question: "UKVI credibility interviews are typically conducted through which medium?", options: ["In-person at the applicant's home", "Video call/phone call during the visa application process", "Written postal examination", "Group debate sessions"], answerIndex: 1 },
      { id: "m1_q7", question: "If an applicant uses an interpreter during a UKVI credibility interview, what is the likely outcome?", options: ["Bonus points for multi-language skills", "Automatic approval", "Visa refusal due to lack of required English language competence", "Referral to a foundation year program"], answerIndex: 2 },
      { id: "m1_q8", question: "What does 'GTE' or 'Genuine Student' evaluation mean?", options: ["Ensuring the student has zero family members living globally", "Evaluating if the applicant's main purpose of travel is quality education", "Checking if the candidate holds dual citizenship", "Testing student knowledge of British sports"], answerIndex: 1 },
      { id: "m1_q9", question: "A student states, 'I am going to the UK primarily to earn money and send it back home.' How will the ECO view this?", options: ["Positively, as a show of responsibility", "Negatively, leading to immediate refusal as it violates student visa intent", "Neutrally, since working is encouraged on a student visa", "Positively, if the salary target is high"], answerIndex: 1 },
      { id: "m1_q10", question: "What risk does a university face if too many of its CAS-issued students get visa refusals?", options: ["They must pay a fine to every applicant", "Loss or suspension of their UKVI Student Sponsor License", "Mandatory decrease in tuition fees", "Total closure of the campus"], answerIndex: 1 },
      { id: "m1_q11", question: "Which document establishes the basic contractual agreement of study between the university and UKVI?", options: ["Personal Statement", "Confirmation of Acceptance for Studies (CAS)", "Travel Itinerary", "Recommendation Letter"], answerIndex: 1 },
      { id: "m1_q12", question: "What is the standard duration allowed to answer questions in an interview?", options: ["Direct, clear, and comprehensive responses without unnecessary ramble", "One-word answers exclusively", "Reading 5-minute pre-written speeches for every question", "Remaining silent until prompted three times"], answerIndex: 0 },
      { id: "m1_q13", question: "Why must a student explain why they chose the UK over their home country?", options: ["To demonstrate awareness of comparative educational value and international standards", "To prove they dislike their home country", "To confirm they will never return home", "To rank international travel preferences"], answerIndex: 0 },
      { id: "m1_q14", question: "Which entity sets the legal framework for UK Student Visas?", options: ["The British Council", "UK Visas and Immigration (UKVI) / Home Office", "UCAS", "The Department for Education"], answerIndex: 1 },
      { id: "m1_q15", question: "An ECO asks about an applicant's study gap of 4 years. What should the applicant provide?", options: ["No response, as past gaps are irrelevant", "A clear, verified explanation detailing work experience or development during that time", "A claim that they were on vacation the entire time", "An apology for taking time off"], answerIndex: 1 },
      { id: "m1_q16", question: "What is the main focus of a pre-CAS interview compared to a UKVI interview?", options: ["Pre-CAS verifies academic capability and eligibility; UKVI checks legal visa entry criteria", "Pre-CAS tests athletic ability; UKVI tests academic writing", "Pre-CAS is conducted by border officials; UKVI is conducted by university lecturers", "There is no difference between the two"], answerIndex: 0 },
      { id: "m1_q17", question: "Can an applicant bring a friend or parent into the UKVI interview room to answer for them?", options: ["Yes, if the parent is funding the study", "No, the applicant must complete the interview independently", "Yes, provided the friend speaks fluent English", "Yes, for moral support"], answerIndex: 1 },
      { id: "m1_q18", question: "What is the consequence of providing misleading information during an interview?", options: ["Minor warning", "Immediate refusal and possible 10-year ban for deception", "Reduced course length", "Mandatory transfer to a different course"], answerIndex: 1 },
      { id: "m1_q19", question: "How does an interviewer evaluate if an answer is genuine versus memorized?", options: ["By assessing tone, flexibility when answering follow-up questions, and natural speech flow", "By counting the exact number of words spoken", "By timing if the answer is under 5 seconds", "By checking if the applicant uses complex poetic vocabulary"], answerIndex: 0 },
      { id: "m1_q20", question: "If a student is asked 'Why not study in your home country?', an acceptable response highlights:", options: ["Higher academic standards, specific course modules not available at home, and international exposure", "Statements that home country degrees are completely useless", "Intention to abandon home country citizenship", "Desire to move away from family"], answerIndex: 0 },
      { id: "m1_q21", question: "Who makes the final decision on a student visa application?", options: ["The University Admissions Tutor", "The UKVI Entry Clearance Officer (ECO)", "The Education Agent", "The Airport Security Officer"], answerIndex: 1 },
      { id: "m1_q22", question: "Which factor indicates to an interviewer that an applicant is NOT a genuine student?", options: ["Clear understanding of the university modules", "Inability to explain what subject the course covers", "Proof of sufficient, liquid funds", "Well-articulated career plans"], answerIndex: 1 },
      { id: "m1_q23", question: "What role do education agents play in the official UKVI interview?", options: ["They can sit in and answer questions for the student", "None; the interview is strictly between the applicant and the interviewer", "They issue the final visa decision", "They act as legal representatives during the interview"], answerIndex: 1 },
      { id: "m1_q24", question: "When should a student begin preparing for their credibility interview?", options: ["5 minutes before the call starts", "Well in advance, while researching universities and writing their personal statement", "After arriving in the UK", "Only if they receive a refusal notice"], answerIndex: 1 },
      { id: "m1_q25", question: "Which of the following best defines a 'Genuine Student'?", options: ["Anyone who pays full tuition fees upfront", "An applicant whose main intention is to obtain a quality education and who has the capability to complete it", "An applicant who intends to work 40 hours a week illegally", "Anyone who has a relative in London"], answerIndex: 1 },
      { id: "m1_q26", question: "Why do interviewers cross-check interview responses with the visa application documents?", options: ["To test for consistency and detect fraudulent claims", "To check spelling errors in the form", "To see if the student changed their name", "To copy data into marketing lists"], answerIndex: 0 },
      { id: "m1_q27", question: "What is the expected behavior if an applicant does not understand an interviewer's question?", options: ["Make up an unrelated answer", "Politeness asking the interviewer to repeat or clarify the question", "Disconnect the call immediately", "Remain silent for the remainder of the test"], answerIndex: 1 },
      { id: "m1_q28", question: "A student applying for a Master's degree in Data Science cannot name a single programming language taught in the course. This demonstrates:", options: ["High level of preparation", "Lack of course research, raising serious credibility doubts", "Standard student knowledge", "Excellent focus on practical skills"], answerIndex: 1 },
      { id: "m1_q29", question: "Which outcome is direct evidence of a successful interview?", options: ["Issuance of a CAS (for pre-CAS) or clearance for visa approval (for UKVI)", "Immediate cash reward", "Free flight ticket to London", "Exemption from paying tuition fees"], answerIndex: 0 },
      { id: "m1_q30", question: "Credibility assessment is mandatory under which UK immigration route?", options: ["Standard Visitor Visa", "Student Route (formerly Tier 4)", "Skilled Worker Visa", "Transit Visa"], answerIndex: 1 }
    ]
  },
  {
    id: "module_2",
    title: "Module 2: CAS & Financial Compliance",
    summary: "Core topics: What CAS is, issuance rules, strict 28-day financial rules, acceptable fund sources, tuition deposits, dependent/living expense calculations.",
    learningResources: [
      {
        heading: "1. Understanding the CAS (Confirmation of Acceptance for Studies)",
        content: "• Definition: A unique 14-character alphanumeric reference number generated by a licensed UK university via the Home Office's Sponsor Management System (SMS).\n• Validity: Valid for 6 months from the date of issue and can only be used once for a visa application."
      },
      {
        heading: "2. Information Stored on a CAS",
        content: "• Personal details (Full name, nationality, passport number).\n• Course details (Title, RQF level, start/end dates, campus location).\n• Financial details (Total tuition fee, tuition deposit paid, official accommodation payments made).\n• Academic background used to assess suitability (e.g., previous degree, English language assessment method)."
      },
      {
        heading: "3. UKVI Financial Requirements & Evidence Rules",
        content: "• Required Funds Calculation:\n  - Tuition Fees: Unpaid balance of Year 1 tuition fees.\n  - Living Expenses (Maintenance): Inner London: £1,334 per month (up to max 9 months = £12,006). Outer London / Rest of UK: £1,023 per month (up to max 9 months = £9,207).\n• The 28-Day Rule: The total required money must remain in the bank account for a continuous 28 consecutive days. The bank balance must not fall below the required minimum for even a single day during this 28-day window.\n• 31-Day Rule for Statement Age: The closing date of the 28-day bank statement must be within 31 days of the visa application submission date."
      },
      {
        heading: "4. Acceptable vs. Unacceptable Financial Sources",
        content: "• Acceptable: Cash funds in personal bank accounts (student or biological parents/legal guardians), official government or corporate sponsorship letters, approved educational loans.\n• Unacceptable: Company bank accounts (unless sole trader with proper legal linkage), uncle/aunts/friends' accounts, credit cards, stocks/shares, real estate valuation, non-liquid assets."
      }
    ],
    questionPool: [
      { id: "m2_q1", question: "What does the acronym 'CAS' stand for?", options: ["Certificate of Academic Status", "Confirmation of Acceptance for Studies", "Council of Academic Standards", "Certified Admission and Sponsorship"], answerIndex: 1 },
      { id: "m2_q2", question: "What is a CAS?", options: ["A physical paper visa sticker", "A unique 14-character reference number generated by a university via UKVI's system", "A stamped receipt for flight bookings", "An English language proficiency certificate"], answerIndex: 1 },
      { id: "m2_q3", question: "How long is a CAS valid for from its date of issue?", options: ["3 months", "6 months", "12 months", "Until the course finishes"], answerIndex: 1 },
      { id: "m2_q4", question: "Under UKVI rules, what is the continuous holding period required for liquid funds in a bank account?", options: ["7 consecutive days", "14 consecutive days", "28 consecutive days", "90 consecutive days"], answerIndex: 2 },
      { id: "m2_q5", question: "The closing balance date of a bank statement submitted for a visa application must be within how many days of the application submission date?", options: ["7 days", "14 days", "31 days", "60 days"], answerIndex: 2 },
      { id: "m2_q6", question: "What happens if an account balance falls £1 below the required amount on day 20 of the 28-day cycle?", options: ["The bank tops it up automatically", "The 28-day timer resets, and the financial test is failed", "UKVI approves it with a minor deduction", "The student can pay a fine to correct it"], answerIndex: 1 },
      { id: "m2_q7", question: "Whose bank account can be used for a student visa financial evidence without third-party affidavit issues?", options: ["The applicant or their biological parents/legal guardians", "The applicant's uncle or aunt", "The applicant's cousin", "The applicant's best friend"], answerIndex: 0 },
      { id: "m2_q8", question: "Which of the following financial sources is UNACCEPTABLE for UKVI student visa financial proof?", options: ["Personal savings account balance held for 28 days", "Official government sponsorship letter", "Shares, stocks, property valuations, or credit cards", "Official education loan from a recognized bank"], answerIndex: 2 },
      { id: "m2_q9", question: "How many months of living expenses must a student show if their course lasts 12 months?", options: ["6 months", "9 months (maximum required duration)", "12 months", "24 months"], answerIndex: 1 },
      { id: "m2_q10", question: "What is the official monthly living allowance requirement for studying outside London?", options: ["£800 per month", "£1,023 per month", "£1,334 per month", "£1,500 per month"], answerIndex: 1 },
      { id: "m2_q11", question: "What is the official monthly living allowance requirement for studying in Inner London?", options: ["£1,023 per month", "£1,200 per month", "£1,334 per month", "£2,000 per month"], answerIndex: 2 },
      { id: "m2_q12", question: "If a student has paid £3,000 towards their tuition fees directly to the university, how is this reflected?", options: ["It is ignored completely", "It is deducted from the total tuition fee amount required on the CAS", "It increases the maintenance money required", "It converts the visa into a work permit"], answerIndex: 1 },
      { id: "m2_q13", question: "Can funds held in a company/business bank account be used directly by the applicant?", options: ["Yes, without any extra documents", "No, unless the student can legally prove the company is a sole proprietorship and they control the funds", "Yes, if the company is big", "Yes, with an email from a manager"], answerIndex: 1 },
      { id: "m2_q14", question: "What document must be provided if using funds in a parent's bank account?", options: ["Parent's original birth certificate/student birth certificate, consent letter, and bank statement", "Parents' marriage certificate only", "High school diploma of the parent", "Parent's utility bill only"], answerIndex: 0 },
      { id: "m2_q15", question: "A student receives a CAS for a course starting in September. Can they apply for their visa from outside the UK 8 months prior?", options: ["Yes, anytime", "No, the earliest they can apply outside the UK is 6 months before the course start date", "No, they can only apply 1 week before", "Yes, if fees are paid"], answerIndex: 1 },
      { id: "m2_q16", question: "What is the consequence of submitting a fraudulent bank statement?", options: ["Temporary delay", "Mandatory visa refusal and a potential 10-year ban under General Grounds for Refusal", "Re-submission request within 48 hours", "A small fee penalty"], answerIndex: 1 },
      { id: "m2_q17", question: "How many times can a single CAS number be used to apply for a visa?", options: ["Once", "Twice", "Three times", "Unlimited times within 6 months"], answerIndex: 0 },
      { id: "m2_q18", question: "What should a student do if there is a mistake in their passport number on their CAS statement?", options: ["Ignore it; UKVI does not check personal details", "Contact the university immediately to issue a CAS update/correction on the SMS system before applying", "Correct it by hand with a pen on the printout", "Submit the visa application and hope for the best"], answerIndex: 1 },
      { id: "m2_q19", question: "Are fixed deposit accounts acceptable for UKVI financial proof?", options: ["Never", "Yes, provided the terms state the money can be withdrawn/released at any time", "Only if locked for over 5 years", "Only if issued by a British bank"], answerIndex: 1 },
      { id: "m2_q20", question: "If an applicant relies on an educational loan, what document is required?", options: ["An informal SMS screenshot", "An official loan sanction letter from a regulated financial institution", "A handwritten note from a bank clerk", "A signed promise from a friend"], answerIndex: 1 },
      { id: "m2_q21", question: "Does accommodation money paid to a private landlord count towards reducing the visa maintenance requirement?", options: ["Yes, up to £5,000", "No, only payments made directly to the university for university accommodation reduce maintenance required (up to £1,334 max)", "Yes, full amount", "Yes, if paid in cash"], answerIndex: 1 },
      { id: "m2_q22", question: "Which currency rate does UKVI use to evaluate bank statements in non-GBP currencies?", options: ["The current day's black market rate", "OANDA exchange rate on the date of application submission", "Rates provided by local currency exchangers", "The exchange rate at the end of the year"], answerIndex: 1 },
      { id: "m2_q23", question: "What does 'RQF' stand for in UK higher education course levels noted on a CAS?", options: ["Registered Qualification Standard", "Regulated Qualifications Framework", "Royal Quality Foundation", "Required Quota Function"], answerIndex: 1 },
      { id: "m2_q24", question: "A Master's degree in the UK typically corresponds to which RQF level on a CAS?", options: ["RQF Level 3", "RQF Level 5", "RQF Level 7", "RQF Level 8"], answerIndex: 2 },
      { id: "m2_q25", question: "A Bachelor's degree in the UK corresponds to which RQF level?", options: ["RQF Level 4", "RQF Level 6", "RQF Level 7", "RQF Level 8"], answerIndex: 1 },
      { id: "m2_q26", question: "If an applicant gets a visa refusal after submitting a CAS, can they re-use the exact same CAS number for a second application?", options: ["Yes", "No, a new CAS must be issued by the university", "Yes, if applied within 7 days", "Yes, by paying a small fee"], answerIndex: 1 },
      { id: "m2_q27", question: "Which entity issues the CAS reference number?", options: ["Home Office via the University's Sponsor Management System", "The British Embassy local branch", "The Student's High School", "The local bank"], answerIndex: 0 },
      { id: "m2_q28", question: "Financial documents must clearly show which of the following details?", options: ["Bank name, account holder name, account number, date range, and available balance", "Bank manager's home address", "List of all past purchases over 10 years", "The currency rate forecast for next year"], answerIndex: 0 },
      { id: "m2_q29", question: "If a student is fully sponsored by a recognized government body, what financial proof is needed?", options: ["28-day personal bank statements", "An official letter of sponsorship confirming full coverage of tuition and living expenses", "Credit card statements", "Tax return receipts only"], answerIndex: 1 },
      { id: "m2_q30", question: "Why is paying a tuition fee deposit recommended before CAS issuance?", options: ["It lowers the total visa application fee", "It demonstrates financial commitment to the institution and reduces the remaining balance required in the bank account", "It guarantees a top-grade pass in the degree", "It grants an automatic work visa"], answerIndex: 1 }
    ]
  },
  {
    id: "module_3",
    title: "Module 3: Academic, University & Course Knowledge Assessment",
    summary: "Core topics: Articulating course structure, modules, RQF levels, assessment methods, university location/facilities, comparison with home country & other UK institutions.",
    learningResources: [
      {
        heading: "1. In-Depth Course Knowledge",
        content: "• Module Awareness: Interviewees must articulate specific core and elective modules by exact title, avoiding vague statements like 'I will learn business.'\n• Assessment Methods: Knowledge of how the course is evaluated (e.g., written examinations, practical coursework, group presentations, individual dissertation).\n• Credit Structure: Understanding the credit system (e.g., standard UK Master's degrees require 180 credits total; Bachelor's require 360 credits over 3 years)."
      },
      {
        heading: "2. University Selection Rationale",
        content: "• Location Factors: Why study in that specific city (e.g., Manchester, Birmingham, London, Glasgow) regarding industry links, study environment, and accessibility.\n• Campus & Facilities: Knowledge of specific university labs, libraries, research centers, or industry-standard software available.\n• Comparative Research: Ability to explain why this university was chosen over at least 2 other UK universities researched (comparing tuition fees, rankings, module combinations, and graduate outcomes)."
      },
      {
        heading: "3. Academic Progression & Gaps",
        content: "• Academic Logic: Explaining how the new degree builds logically upon previous studies (e.g., BSc Computer Science to MSc Cybersecurity).\n• Career Shifts: If changing fields (e.g., BA History to MSc Management), the applicant must justify the shift using relevant work experience or new career goals.\n• Study Gap Justification: Explaining any periods of non-study with evidence of professional work, certifications, or personal development."
      }
    ],
    questionPool: [
      { id: "m3_q1", question: "When an interviewer asks 'Why did you choose this course?', what is the most effective answer?", options: ["'My parents chose it for me.'", "'It was the cheapest course available.'", "Specific details on module content, learning outcomes, and how it aligns with career goals", "'Because I want to visit the UK.'"], answerIndex: 2 },
      { id: "m3_q2", question: "How many total credits does a standard 1-year UK Master's degree comprise?", options: ["60 credits", "120 credits", "180 credits", "360 credits"], answerIndex: 2 },
      { id: "m3_q3", question: "How many total credits are standard for a 3-year UK Bachelor's degree?", options: ["120 credits", "180 credits", "240 credits", "360 credits"], answerIndex: 3 },
      { id: "m3_q4", question: "What should a student know about their course assessment methods?", options: ["Nothing, as teachers decide on the spot", "Whether assessment is based on coursework, written exams, presentations, or a final dissertation", "That all UK courses only have multiple-choice tests", "That no assessments take place in UK universities"], answerIndex: 1 },
      { id: "m3_q5", question: "When comparing their chosen UK university to other options, what should a candidate highlight?", options: ["The color of the campus buildings", "Differences in specific modules, tuition costs, campus facilities, and industry connections", "How fast the university cafeteria serves food", "Which university has the largest football stadium"], answerIndex: 1 },
      { id: "m3_q6", question: "What is an RQF level 7 qualification equivalent to in the UK education system?", options: ["High school diploma", "Bachelor's Degree", "Master's Degree / Postgraduate Diploma", "Doctorate (PhD)"], answerIndex: 2 },
      { id: "m3_q7", question: "What is an RQF level 6 qualification equivalent to?", options: ["Master's Degree", "Bachelor's Degree / Undergraduate Diploma", "Foundation degree", "PhD"], answerIndex: 1 },
      { id: "m3_q8", question: "If an applicant is switching fields from Humanities to Data Analytics, how should they justify it?", options: ["Say that Humanities was a mistake", "Highlight transferable skills, recent short courses, work experience, and new career objectives", "Blame their former university", "Refuse to answer"], answerIndex: 1 },
      { id: "m3_q9", question: "Why is vague knowledge about course modules a major failure trigger in interviews?", options: ["It shows the student relies on an agent and lacks genuine interest in studying the subject", "It confuses the microphone", "It indicates the student doesn't speak English", "It lowers the university's ranking"], answerIndex: 0 },
      { id: "m3_q10", question: "What does the term 'Dissertation' mean in a UK Master's program context?", options: ["An oral speech given on day one", "An independent research project/thesis completed towards the end of the course", "A preliminary English entrance test", "A group field trip"], answerIndex: 1 },
      { id: "m3_q11", question: "If an interviewer asks 'Where is your university located?', what should the student know?", options: ["Just the country name 'UK'", "The exact city, campus name, surrounding region, and distance from major transport hubs", "The exact GPS coordinates only", "'Somewhere near London' regardless of actual city"], answerIndex: 1 },
      { id: "m3_q12", question: "What is a key reason to study in the UK compared to taking an online degree at home?", options: ["Interactive learning, research access, practical exposure, and international academic environment", "Online degrees are forbidden everywhere", "UK degrees take 10 years to complete", "Online degrees are more expensive"], answerIndex: 0 },
      { id: "m3_q13", question: "Which of the following shows GOOD preparation for a course question?", options: ["Naming 3-4 specific modules and explaining what key skills they teach", "Saying 'I will check the syllabus when classes start'", "Reading the course homepage description word-for-word from a paper", "Naming modules from a different university by mistake"], answerIndex: 0 },
      { id: "m3_q14", question: "What is the standard duration of a full-time taught Master's degree in the UK?", options: ["6 months", "1 year", "3 years", "4 years"], answerIndex: 1 },
      { id: "m3_q15", question: "Why do UK Master's degrees often appeal to international students compared to 2-year degrees in other countries?", options: ["They allow students to skip all exams", "They offer an intensive, high-quality, 1-year structure that saves time and living costs", "They do not require English proficiency", "They grant automatic permanent residency"], answerIndex: 1 },
      { id: "m3_q16", question: "What is an ATAS certificate?", options: ["An extra academic certificate for sports", "Academic Technology Approval Scheme clearance required for certain sensitive postgraduate subjects (e.g., engineering, medicine, tech)", "An alternative to a passport", "A discount voucher for travel"], answerIndex: 1 },
      { id: "m3_q17", question: "If a student is asked about campus facilities, which answer shows authentic research?", options: ["'I know there are classrooms and chairs.'", "Mentioning specific libraries, specialized laboratories, software platforms, or student support hubs", "'I have never looked at campus images.'", "'Facilities do not matter to me.'"], answerIndex: 1 },
      { id: "m3_q18", question: "What does 'Academic Progression' mean to UKVI?", options: ["Demonstrating that the new course represents an advance in learning depth beyond past qualifications", "Getting 100% marks in every single class", "Studying the exact same course twice at different universities", "Completing a lower-level course after finishing a higher-level degree"], answerIndex: 0 },
      { id: "m3_q19", question: "An applicant has completed a Bachelor's in Business Administration and now applies for another Bachelor's in Business Administration in the UK. How will UKVI view this?", options: ["Highly positive", "Suspicious, as repeating the same RQF level in the same subject lacks academic progression", "Standard practice", "Mandatory requirement"], answerIndex: 1 },
      { id: "m3_q20", question: "If asked about teaching methods at a UK university, what should a student mention?", options: ["Lectures, seminars, workshops, tutorials, and self-directed study", "Television broadcasts only", "Memorization drills", "Student-led teaching without professors"], answerIndex: 0 },
      { id: "m3_q21", question: "Why is it important to know who the key course leaders or professors are?", options: ["To get their home phone numbers", "To show deep research into the department's academic strength and research expertise", "It is legally mandatory for all visa applications", "To request private tutoring"], answerIndex: 1 },
      { id: "m3_q22", question: "What does 'Blended Learning' mean?", options: ["Combining cooking with academic studies", "A mix of face-to-face classroom teaching and online learning materials", "Studying at two different universities on alternative days", "Taking classes only at night"], answerIndex: 1 },
      { id: "m3_q23", question: "If asked about the university's ranking, what is the best approach?", options: ["Quote exact numbers from recognized sources (e.g., QS, Times Higher Education, Complete University Guide) or mention specific subject-level strengths", "Claim the university is #1 in the world without proof", "State that rankings are irrelevant", "Guess a random number"], answerIndex: 0 },
      { id: "m3_q24", question: "What is the difference between a core module and an elective module?", options: ["Core is compulsory; elective is an optional module chosen based on student interest", "Core is for international students; elective is for UK students", "Core is non-credit; elective awards all credits", "Core is evaluated; elective has no exams"], answerIndex: 0 },
      { id: "m3_q25", question: "Which document contains official details of the academic qualification used by the university to assess entry eligibility?", options: ["Bank Statement", "Confirmation of Acceptance for Studies (CAS)", "Tenancy Agreement", "Medical Report"], answerIndex: 1 },
      { id: "m3_q26", question: "Why would a student choose a university outside London over one in London?", options: ["Lower cost of living, specialized facilities, quieter study environment, or campus-based community", "Absence of rules outside London", "London does not have accredited universities", "Courses outside London take half the time"], answerIndex: 0 },
      { id: "m3_q27", question: "What is the main objective of a dissertation module?", options: ["To test speed typing", "To conduct independent research and apply taught methodologies to a complex topic", "To work full-time for an external company", "To teach basic grammar skills"], answerIndex: 1 },
      { id: "m3_q28", question: "An applicant cannot recall the exact name of the degree program they applied for during the interview. What is the outcome?", options: ["Passing grade", "High risk of refusal due to lack of basic credibility", "Rescheduling without consequence", "Automatic scholarship"], answerIndex: 1 },
      { id: "m3_q29", question: "What is a 'Pre-sessional English Course'?", options: ["An English course taken before the main degree to meet the required language proficiency level", "A holiday English program after graduation", "A course for native English speakers", "An exam for visa renewal"], answerIndex: 0 },
      { id: "m3_q30", question: "Demonstrating knowledge of the university's Student Support Services (e.g., career guidance, mental health support) shows:", options: ["That the student expects to fail", "Thorough research and realistic preparation for living as an international student", "Intent to work for the university", "Excessive worry"], answerIndex: 1 }
    ]
  },
  {
    id: "module_4",
    title: "Module 4: Career Progression, Return Intentions & Financial Justification",
    summary: "Core topics: Post-study career path, ROI (Return on Investment), tying qualifications to home-country job markets, avoiding immigration/work-intent red flags.",
    learningResources: [
      {
        heading: "1. Articulating Career Strategy",
        content: "• Target Roles: Candidates must state specific target job titles (e.g., 'Senior Data Analyst,' 'Supply Chain Manager'), not generic goals ('I want a good job').\n• Target Employers: Knowledge of prominent companies in the home country that hire graduates with this qualification.\n• Salary ROI: Demonstrating that the financial investment in a UK degree will yield a realistic salary increase in their home country job market."
      },
      {
        heading: "2. Ties to Home Country (Establishing Intent to Return)",
        content: "• Economic & Professional Ties: Future job offers, ongoing family business opportunities, or specialized skill shortages in the home country.\n• Social & Personal Ties: Family commitments, assets, property, or deep community roots.\n• Crucial Rule: Candidates must never state or imply an intention to overstay their visa or remain permanently in the UK unlawfully."
      },
      {
        heading: "3. Clear Financial Justification",
        content: "• Sponsor Relationship: If parents/sponsors fund the studies, the candidate must articulate their sponsor's occupation, annual income, and capability to afford the fees.\n• Understanding Total Costs: Being able to state exact breakdown numbers (Tuition fee + Living expenses + Flight/Insurance costs).\n• Work Restrictions Awareness: Acknowledging that student visa work allowances (20 hours/week during term time) are strictly for supplemental pocket money/experience and cannot be relied upon to pay tuition or main living costs."
      }
    ],
    questionPool: [
      { id: "m4_q1", question: "When asked 'What are your career plans after graduation?', what is the expected response?", options: ["'I plan to stay in the UK permanently by any means necessary.'", "'I will return to my home country to pursue specific roles such as [Job Title] at companies like [Target Employers].'", "'I have no plans yet; I will think about it later.'", "'I want to apply for asylum.'"], answerIndex: 1 },
      { id: "m4_q2", question: "Why is showing a clear Return on Investment (ROI) important in an interview?", options: ["To show the ECO that paying high tuition fees makes logical financial sense for the student's career growth back home", "To ask the UK government for a refund", "To lower tax rates in the UK", "To justify buying luxury products"], answerIndex: 0 },
      { id: "m4_q3", question: "What is the maximum allowed work hour limit for a full-time Student Visa holder during term time at degree level?", options: ["10 hours per week", "20 hours per week", "40 hours per week", "Unlimited hours"], answerIndex: 1 },
      { id: "m4_q4", question: "Can an international student rely on part-time work earnings in the UK to pay for their tuition fees or main living expenses?", options: ["Yes, that is expected by UKVI", "No, UKVI strictly mandates that students must have full funds prior to travel without relying on part-time work", "Yes, if they work 3 jobs", "Yes, during summer only"], answerIndex: 1 },
      { id: "m4_q5", question: "What are international students on a Student Visa STRICTLY FORBIDDEN from doing regarding employment?", options: ["Working 20 hours a week in a supermarket", "Being self-employed, doing business activity, or working as a professional sportsperson/entertainer", "Interning as part of their course", "Volunteering at a charity"], answerIndex: 1 },
      { id: "m4_q6", question: "How should a candidate explain financial sponsorship by their parents?", options: ["'My parents have money in the bank, but I don't know where it comes from.'", "State the parents' exact profession, annual income source, and confirm their full commitment to funding the education", "'My parents signed a paper, that's all.'", "'I don't like discussing my parents' finances.'"], answerIndex: 1 },
      { id: "m4_q7", question: "If an interviewer asks 'Why won't you stay in the UK long-term?', an effective answer emphasizes:", options: ["Strong personal, family, and lucrative career ties in the home country", "Claiming the UK is a bad place to live", "Stating that jobs do not exist in the UK", "Promising to move to a third country immediately"], answerIndex: 0 },
      { id: "m4_q8", question: "What is the standard work hour allowance during official university vacation/break periods for degree-level students?", options: ["0 hours", "20 hours per week", "Up to 40 hours per week (full-time)", "60 hours per week"], answerIndex: 2 },
      { id: "m4_q9", question: "A candidate states: 'I will use part-time work income to pay off my remaining £10,000 tuition balance.' What will be the visa outcome?", options: ["Visa approval", "Immediate visa refusal due to reliance on unauthorized/unproven financial means", "Automatic grant of a work visa", "Issuance of a student discount card"], answerIndex: 1 },
      { id: "m4_q10", question: "What is a 'Graduate Route' (Post-Study Work) visa in the UK?", options: ["An automatic grant of UK citizenship", "An optional 2-year post-study work visa allowing graduates to gain work experience in the UK after completing their degree", "A mandatory requirement for all student visa applicants", "A visa that pays full tuition retroactively"], answerIndex: 1 },
      { id: "m4_q11", question: "Even if a student intends to apply for the Graduate Route visa post-study, why must they still articulate long-term home country ties?", options: ["Because the Graduate Route is a temporary work visa, not a permanent migration pathway", "They don't need to show home country ties anymore", "UKVI forbids applying for the Graduate Route", "It is a trick question"], answerIndex: 0 },
      { id: "m4_q12", question: "What does 'Economic Tie' to one's home country refer to?", options: ["Financial investments, property ownership, job offers, or family business waiting back home", "Owning a local currency coin collection", "Having a bank debt in the host country", "Paying home country streaming subscriptions"], answerIndex: 0 },
      { id: "m4_q13", question: "An applicant is asked: 'What is your sponsor's monthly income?' What should the applicant do?", options: ["Give an accurate, verifiable number that aligns with submitted tax and bank records", "Guess a high figure on the spot", "Refuse to answer due to privacy", "Say 'I don't know'"], answerIndex: 0 },
      { id: "m4_q14", question: "What is the estimated total cost calculation a student should be prepared to discuss in an interview?", options: ["Tuition fee balance + mandatory maintenance living costs + initial travel/flight/IHS costs", "Just the cost of the plane ticket", "Shopping expenses for clothes", "Zero, as universities are free"], answerIndex: 0 },
      { id: "m4_q15", question: "What does 'IHS' stand for in the UK visa application process?", options: ["International Health Service", "Immigration Health Surcharge", "Internal Housing Scheme", "Integrated High School"], answerIndex: 1 },
      { id: "m4_q16", question: "Why do students pay the Immigration Health Surcharge (IHS)?", options: ["To get private room hospital access", "To access the UK's National Health Service (NHS) during their stay", "To buy health insurance in their home country", "To cover gym memberships in the UK"], answerIndex: 1 },
      { id: "m4_q17", question: "A student has a job offer letter waiting for them in their home country upon course completion. How does this help their interview?", options: ["It serves as concrete proof of career progression and strong return intention", "It has no effect", "It prevents them from receiving a student visa", "It forces the university to lower fees"], answerIndex: 0 },
      { id: "m4_q18", question: "If a sponsor's income is far lower than the tuition and living expenses required, what will the ECO conclude?", options: ["The funds are non-credible or sourced suspiciously from third parties, leading to refusal", "The university will pay the difference", "The student gets a scholarship", "The visa is approved out of sympathy"], answerIndex: 0 },
      { id: "m4_q19", question: "What is the risk of mentioning distant relatives living in the UK during an interview without clear reason?", options: ["It might suggest an intention to rely on them for settlement rather than genuine study", "It automatically increases tuition fees", "It delays flight bookings", "It has zero impact under any circumstance"], answerIndex: 0 },
      { id: "m4_q20", question: "If asked 'How much will your accommodation cost in the UK?', the student should provide:", options: ["A realistic estimate based on university dorm rates or local rental market research", "'I expect it to be 100% free.'", "'I haven't checked any prices.'", "'£10 per month.'"], answerIndex: 0 },
      { id: "m4_q21", question: "Why is it inappropriate to say 'I chose the UK so I can easily settle there permanently'?", options: ["Because student visas are temporary non-immigrant routes requiring genuine intent to complete study", "Settle is a word not understood in English", "UKVI only accepts tourists", "Settle implies buying a house on day 1"], answerIndex: 0 },
      { id: "m4_q22", question: "How does an applicant demonstrate realistic expectations of home country salary after graduation?", options: ["Quoting industry average salaries for UK-qualified candidates in their target home market", "Claiming they will earn 1 million dollars a month immediately", "Stating they will work without a salary", "Copying UK domestic salary figures for home country roles"], answerIndex: 0 },
      { id: "m4_q23", question: "What is a key indicator of a non-genuine sponsor?", options: ["Sudden large deposits into an account right before application without clear origin (funds parking)", "Regular monthly salary transfers over years", "Official bank letters with verifiable seal", "Tax return documents matching savings balance"], answerIndex: 0 },
      { id: "m4_q24", question: "Can an international student on a Student Visa engage in full-time permanent employment in the UK before graduation?", options: ["Yes, anytime", "No, taking a full-time permanent vacancy is strictly illegal under student visa conditions", "Yes, if they pay extra tax", "Yes, if their manager permits"], answerIndex: 1 },
      { id: "m4_q25", question: "What does the term 'Fund Parking' mean in visa assessment?", options: ["Depositing temporary money from an agent/third party into a student's account just to pass the 28-day check", "Paying for car parking spaces at university", "Saving money in a high-yield account for 10 years", "Direct government scholarship funding"], answerIndex: 0 },
      { id: "m4_q26", question: "If an applicant's studies are self-funded from personal business profits, what proof must they understand?", options: ["Business registration, tax clearance, and profit history proving earnings generate the saved money", "Just a verbal promise", "A business card only", "A social media page screenshot"], answerIndex: 0 },
      { id: "m4_q27", question: "Why do ECOs ask about an applicant's current employment status in their home country?", options: ["To assess current financial standing, relevant experience, and career continuity", "To notify their current boss to fire them", "To tax their current salary", "Out of random curiosity"], answerIndex: 0 },
      { id: "m4_q28", question: "What is the main danger of giving generic answers like 'I want to gain global exposure'?", options: ["It lacks substance, making the student appear uncommitted and unprepared", "It is considered offensive", "It uses too many words", "It violates grammar rules"], answerIndex: 0 },
      { id: "m4_q29", question: "If a student is taking an educational loan, who is responsible for repaying it?", options: ["The UK Home Office", "The student or their designated financial sponsor according to bank terms", "The host UK university", "The local embassy"], answerIndex: 1 },
      { id: "m4_q30", question: "A student's post-study plan is to set up a startup business in their home country. What should they highlight?", options: ["How the specific modules (e.g., Entrepreneurship, Finance) provide the exact tools to build the enterprise", "Claiming they don't need a degree to run a business", "Asking the ECO for investment funds", "Explaining how they will run the home business remotely while staying in London"], answerIndex: 0 }
    ]
  },
  {
    id: "module_5",
    title: "Module 5: Interview Delivery, Common Failure Reasons & Behavioral Excellence",
    summary: "Core topics: Top refusal triggers, communication standards, body language, tone, avoiding memorized answers, managing technical/logistical issues.",
    learningResources: [
      {
        heading: "1. Primary Reasons for Visa/Credibility Interview Failure",
        content: "• Coached / Memorized Answers: Reciting pre-written essays without directly answering the specific question asked.\n• Inconsistencies: Discrepancies between spoken answers and submitted CAS/financial documentation.\n• Poor English Fluency: Inability to express ideas independently, frequent reliance on pauses, or failure to comprehend simple questions.\n• Lack of Autonomy: Indication that education agents or parents made all decisions without the student's active involvement."
      },
      {
        heading: "2. Behavioral Guidelines & Professional Conduct",
        content: "• Punctuality & Environment: Joining the digital interview 10-15 minutes early in a quiet, well-lit, private room without background noise or third-party presence.\n• Body Language & Tone: Maintain direct eye contact with the camera, clear posture, confident tone, and professional courtesy.\n• Active Listening: Listen completely to the question before answering; politely ask for clarification if audio cuts out."
      },
      {
        heading: "3. Handling Complex/Unexpected Scenarios",
        content: "• Technical Glitches: Immediately inform the interviewer if audio/video drops rather than guessing what was asked.\n• Prohibited Behaviors: Looking off-screen at notes, having someone whisper answers, checking smartphones, or arguing with the interviewer."
      }
    ],
    questionPool: [
      { id: "m5_q1", question: "What is the single biggest technical mistake an applicant can make during a video interview?", options: ["Wearing a dark suit", "Reading answers off hidden notes or screens off-camera", "Sitting near a window", "Drinking water"], answerIndex: 1 },
      { id: "m5_q2", question: "What should an applicant do if the interviewer's audio freezes while asking a question?", options: ["Make up an answer to a random question", "Politely state that the audio froze and ask the interviewer to repeat the question", "End the call immediately without explanation", "Sit quietly for 10 minutes"], answerIndex: 1 },
      { id: "m5_q3", question: "Why do interviewers dislike 'coached' or 'scripted' answers?", options: ["They sound unnatural, obscure genuine student intent, and fail to prove independent language ability", "They take too short to recite", "Scripted answers are against British accent rules", "Interviewers prefer poetry"], answerIndex: 0 },
      { id: "m5_q4", question: "What is the ideal environment for a remote online credibility interview?", options: ["A busy coffee shop with public Wi-Fi", "A quiet, well-lit, private room with a stable internet connection and zero background noise", "A room full of friends giving advice", "Inside a moving vehicle"], answerIndex: 1 },
      { id: "m5_q5", question: "How should an applicant react if they do not know the answer to a specific minor detail?", options: ["Panic and lie", "Remain calm, answer honestly based on their research, and avoid making up false information", "Start arguing with the interviewer", "Pretend the microphone is broken"], answerIndex: 1 },
      { id: "m5_q6", question: "What is the impression given when a candidate repeatedly looks to the side before answering?", options: ["That they are thinking deeply", "That someone in the room is prompting or giving them answers, leading to failure", "That they have great eye control", "That they are checking the time"], answerIndex: 1 },
      { id: "m5_q7", question: "Which tone of voice is most effective during a UKVI credibility interview?", options: ["Aggressive and demanding", "Monotone and whispering", "Professional, confident, clear, and natural", "Overly dramatic"], answerIndex: 2 },
      { id: "m5_q8", question: "If a student's CAS states tuition is £15,000, but in the interview they claim it is £8,000, what issue arises?", options: ["Minor mistake, ignored", "Serious document-interview discrepancy, raising doubts about credibility", "The university lowers the fee to £8,000", "The interviewer fixes the error automatically"], answerIndex: 1 },
      { id: "m5_q9", question: "What should an applicant wear for a video credibility interview?", options: ["Casual pajamas", "Neat, professional/smart-casual attire", "Party costume", "Formal sportswear"], answerIndex: 1 },
      { id: "m5_q10", question: "Why is prompt attendance (logging in 10-15 minutes early) essential?", options: ["To test audio/video setup and show reliability and respect for the process", "To skip the interview", "To force the interviewer to start early", "It is required to get a free visa"], answerIndex: 0 },
      { id: "m5_q11", question: "An applicant is asked 'Who filled out your visa application form?' What is the correct reflection of a genuine student?", options: ["'My agent filled everything and I don't know what is inside.'", "'I completed it myself (or thoroughly reviewed and verified every detail filled with my assistance).'", "'A stranger at an internet café.'", "'I don't know.'"], answerIndex: 1 },
      { id: "m5_q12", question: "What does frequent hesitation, long silence, or reliance on fill words ('uhm', 'ah') suggest to the ECO?", options: ["High level of expertise", "Lack of confidence, poor English proficiency, or unpreparedness", "Deep philosophical thinking", "Computer lag"], answerIndex: 1 },
      { id: "m5_q13", question: "What is the best strategy if an interviewer asks a follow-up question that challenges your choice of course?", options: ["Change your mind immediately and pick a new course", "Defend your choice logically using your personal goals, academic interest, and prior research", "Refuse to discuss the course further", "Blame the university for offering it"], answerIndex: 1 },
      { id: "m5_q14", question: "Can an interviewer cut an answer short during the session?", options: ["Yes, if they have gathered the information needed; the applicant should stay calm and listen to the next question", "No, it is illegal to interrupt", "Yes, but the student should demand to finish their 10-minute speech", "Interruptions mean automatic failure"], answerIndex: 0 },
      { id: "m5_q15", question: "A student answers every question by reading verbatim from a prepared PDF on their screen. What is the probable outcome?", options: ["Refusal based on non-genuine/coached performance", "Distinction grade", "Instant visa issuance", "A request to send the PDF by email"], answerIndex: 0 },
      { id: "m5_q16", question: "Which of the following is considered improper body language during an interview?", options: ["Sitting upright and looking into the camera", "Slouching, fidgeting constantly, resting head on hands, or avoiding camera focus", "Smiling politely when greeting", "Nodding to acknowledge understanding"], answerIndex: 1 },
      { id: "m5_q17", question: "How should an applicant handle a question about a previous visa refusal from any country?", options: ["Hide it and claim zero past refusals", "Be completely honest, explain the reason for past refusal, and show how the current application rectifies it", "Blame the embassy of that country", "Disconnect the interview"], answerIndex: 1 },
      { id: "m5_q18", question: "What is the consequence of hiding a previous visa refusal when asked?", options: ["Mandatory refusal under deception/misrepresentation rules, leading to potential bans", "No consequence if it was over a year ago", "A small note on the passport", "The interviewer will appreciate the modesty"], answerIndex: 0 },
      { id: "m5_q19", question: "What should a candidate do with their mobile phone during a laptop-based interview?", options: ["Keep it on loud and answer incoming calls", "Put it on silent/off and set it out of sight to prevent distractions", "Use it to search for answers during the interview", "Hold it in front of the camera"], answerIndex: 1 },
      { id: "m5_q20", question: "If the ECO asks a simple 'Yes/No' question, what is the best approach?", options: ["Answer 'Yes' or 'No' and provide a brief, relevant context/explanation", "Speak for 15 minutes continuously", "Answer only in nod gestures without speaking", "Ignore the question"], answerIndex: 0 },
      { id: "m5_q21", question: "Why is it important to ensure proper lighting during a video interview?", options: ["So the interviewer can clearly see your face and identity without shadow distortions", "To make the video look like a film", "Lighting has zero purpose", "To check skin tone"], answerIndex: 0 },
      { id: "m5_q22", question: "An applicant starts arguing heatedly with an interviewer over a question. What does this demonstrate?", options: ["High intelligence", "Unprofessional behavior and lack of emotional control, harming credibility", "Great debate skills for UK law", "Strong leadership"], answerIndex: 1 },
      { id: "m5_q23", question: "What does 'active listening' during an interview mean?", options: ["Interrupting the interviewer mid-sentence", "Listening completely without interrupting, processing the question, and responding directly", "Writing down every single word spoken by the interviewer", "Wearing large noise-cancelling headphones without speaking"], answerIndex: 1 },
      { id: "m5_q24", question: "If an interviewer asks 'Are you alone in the room?', what is the expected situation?", options: ["You must be entirely alone in a private space", "You can have 3 friends helping you", "You can sit with an agent", "You can be in a crowded classroom"], answerIndex: 0 },
      { id: "m5_q25", question: "What is the primary purpose of cross-examining interview responses with submitted documents?", options: ["To verify authenticity, identify discrepancies, and prevent fraud", "To waste the applicant's time", "To test the database speed", "To award extra travel points"], answerIndex: 0 },
      { id: "m5_q26", question: "If an applicant relies on memory cues, what is the best practice?", options: ["Rely on thorough understanding of their own study plan rather than memorized lines", "Keep 20 sticky notes pasted around the computer screen", "Have an agent hold up flashcards behind the webcam", "Read directly from a notebook"], answerIndex: 0 },
      { id: "m5_q27", question: "What should you do at the end of the interview?", options: ["Close the laptop without saying anything", "Politely thank the interviewer for their time and wait for them to end the call", "Demand an instant visa decision", "Ask the interviewer for personal contact details"], answerIndex: 1 },
      { id: "m5_q28", question: "A student gives different answers for their father's occupation between the pre-CAS and UKVI interviews. What does this trigger?", options: ["Immediate red flag for potential document misrepresentation or unverified financial backing", "Automatic correction by the system", "A request for a written essay", "No impact at all"], answerIndex: 0 },
      { id: "m5_q29", question: "What is the best way to practice for a credibility interview?", options: ["Conducting mock interviews with peers/mentors, focusing on clear spoken English and spontaneous, honest answers", "Memorizing 100 pages of text word-for-word", "Paying someone else to attend the interview", "Avoiding any preparation to stay natural"], answerIndex: 0 },
      { id: "m5_q30", question: "What overall impression guarantees the highest chance of passing a credibility interview?", options: ["Demonstrating genuine enthusiasm for learning, clear financial capability, independent research, and transparent plans to return home post-study", "Proving you have maximum relatives living in the UK", "Showing you can work 60 hours a week", "Repeating university web pages word-for-word"], answerIndex: 0 }
    ]
  }
];

// ============================================================================
// FIREBASE ADMIN BULK OPERATION
// ============================================================================

/**
 * Server-side function to completely wipe existing modules and import the fresh 5
 */
export async function runBulkModuleSeed() {
  try {
    const modulesRef = adminDb.collection('learning_modules');
    const existingDocs = await modulesRef.get();

    // 1. DELETE EXISTING
    const batchDelete = adminDb.batch();
    existingDocs.forEach((doc) => {
      batchDelete.delete(doc.ref);
    });

    if (existingDocs.size > 0) {
        await batchDelete.commit();
        console.log(`Deleted ${existingDocs.size} old modules.`);
    }

    // 2. IMPORT NEW
    const batchInsert = adminDb.batch();
    UKVI_MODULES_SEED.forEach((mod, index) => {
      const docRef = modulesRef.doc(mod.id);
      batchInsert.set(docRef, {
        ...mod,
        order: index + 1,
        passScore: 80, // Default 80% to pass
        createdAt: new Date().toISOString(),
      });
    });

    await batchInsert.commit();
    console.log(`Successfully seeded ${UKVI_MODULES_SEED.length} new modules.`);
    return { success: true, message: "Modules successfully refreshed." };

  } catch (error) {
    console.error("Failed to seed modules:", error);
    return { success: false, message: "Failed to run seed operation.", error };
  }
}
