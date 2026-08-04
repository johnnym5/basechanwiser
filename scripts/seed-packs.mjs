/**
 * seed-packs.mjs
 * ──────────────────────────────────────────────────────────────────────────
 * One-time seed script: writes the 3 default UKVI question packs to
 * Firestore using the Firebase REST API (no Admin SDK required).
 *
 * Usage (from project root):
 *   node scripts/seed-packs.mjs
 *
 * The script uses the publicly accessible Firestore REST API with the
 * project's API key so it can be run without a service account.
 * It will CREATE or OVERWRITE each pack document using a deterministic
 * document ID so re-running is safe (idempotent).
 * ──────────────────────────────────────────────────────────────────────────
 */

const PROJECT_ID = "basechanwiser";
const API_KEY = "AIzaSyDwFonu0V4hRkBVjq9OlxQ2RHGA-0sW6yo";
const COLLECTION = "question_packs";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Convert a plain JS value to a Firestore REST API value object */
function toFSValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number") {
    return Number.isInteger(val)
      ? { integerValue: String(val) }
      : { doubleValue: val };
  }
  if (typeof val === "string") return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFSValue) } };
  }
  if (typeof val === "object") {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFSValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

/** Convert a plain JS object to a Firestore REST document body */
function toDocument(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFSValue(v);
  }
  return { fields };
}

/** PATCH (upsert) a Firestore document via REST */
async function upsertDoc(docId, data) {
  const url =
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}/${docId}` +
    `?key=${API_KEY}&currentDocument.exists=false`;

  // First try to CREATE (will fail if exists)
  let res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}/${docId}?key=${API_KEY}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toDocument(data)),
    }
  );

  if (res.ok) {
    console.log(`  ✅  Upserted: ${docId}`);
  } else {
    const err = await res.json();
    console.error(`  ❌  Failed (${docId}):`, err.error?.message);
  }
}

// ── Pack Data ──────────────────────────────────────────────────────────────

const packs = [
  // ────────────────────────────────────────────────────────────────────────
  // PACK 1: UKVI General & Financial Compliance Drill
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "default-pack-ukvi-compliance",
    data: {
      title: "UKVI General & Financial Compliance Drill",
      description:
        "Master the key UKVI rules, financial requirements, and student visa conditions every applicant must know before their interview.",
      category: "General Compliance / Financial",
      passScore: 80,
      isDefault: true,
      createdBy: "system",
      questions: [
        {
          id: "q1",
          questionText:
            "What is the maximum allowed weekly work hours for international students during term time?",
          options: [
            { id: "a", text: "20 hours per week", isCorrect: true },
            { id: "b", text: "40 hours per week", isCorrect: false },
            { id: "c", text: "10 hours per week", isCorrect: false },
            { id: "d", text: "Unlimited hours", isCorrect: false },
          ],
        },
        {
          id: "q2",
          questionText:
            "How long must maintenance funds be held in a bank account before your visa application?",
          options: [
            { id: "a", text: "28 consecutive days", isCorrect: true },
            { id: "b", text: "14 days", isCorrect: false },
            { id: "c", text: "60 days", isCorrect: false },
            { id: "d", text: "3 months", isCorrect: false },
          ],
        },
        {
          id: "q3",
          questionText:
            "According to UKVI rules, who is officially permitted to act as your financial sponsor without requiring special legal documentation?",
          options: [
            {
              id: "a",
              text: "Myself, my parents, or my legal guardians",
              isCorrect: true,
            },
            { id: "b", text: "My uncle or aunt", isCorrect: false },
            {
              id: "c",
              text: "A family friend residing in the UK",
              isCorrect: false,
            },
            {
              id: "d",
              text: "Any relative with enough money",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q4",
          questionText:
            "Can you rely on part-time work in the UK to pay your remaining tuition fee balance?",
          options: [
            {
              id: "a",
              text: "No, I must prove I have the full funds available before I travel",
              isCorrect: true,
            },
            {
              id: "b",
              text: "Yes, as long as I work 20 hours a week",
              isCorrect: false,
            },
            {
              id: "c",
              text: "Yes, if I find a high-paying job",
              isCorrect: false,
            },
            {
              id: "d",
              text: "Yes, but only during the holidays",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q5",
          questionText: "What is the Immigration Health Surcharge (IHS)?",
          options: [
            {
              id: "a",
              text: "A mandatory fee paid during the visa application to access the UK National Health Service (NHS)",
              isCorrect: true,
            },
            {
              id: "b",
              text: "A private health insurance plan I must buy from my university",
              isCorrect: false,
            },
            {
              id: "c",
              text: "A tax taken out of my part-time wages",
              isCorrect: false,
            },
            {
              id: "d",
              text: "A fee paid at the airport upon arrival",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q6",
          questionText:
            "If your bank statements are not in English, what must you do before submitting them to UKVI?",
          options: [
            {
              id: "a",
              text: "Provide a fully certified translation by a professional translator",
              isCorrect: true,
            },
            {
              id: "b",
              text: "Translate them myself and sign the bottom",
              isCorrect: false,
            },
            {
              id: "c",
              text: "Ask the university to translate them",
              isCorrect: false,
            },
            {
              id: "d",
              text: "Submit them as they are; UKVI will translate them",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q7",
          questionText:
            "Are you permitted to claim \"Public Funds\" (such as UK government benefits or housing assistance) while on a Student Visa?",
          options: [
            {
              id: "a",
              text: "No, claiming public funds is a breach of visa conditions",
              isCorrect: true,
            },
            {
              id: "b",
              text: "Yes, if I cannot find a part-time job",
              isCorrect: false,
            },
            {
              id: "c",
              text: "Yes, but only after living in the UK for 6 months",
              isCorrect: false,
            },
            {
              id: "d",
              text: "Yes, but only during the holidays",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q8",
          questionText:
            "If you are applying to study a master's degree, can you bring your spouse or children as dependants?",
          options: [
            {
              id: "a",
              text: "Generally no, unless it is a PhD, doctoral qualification, or a research-based higher degree",
              isCorrect: true,
            },
            {
              id: "b",
              text: "Yes, all master's students can bring dependants",
              isCorrect: false,
            },
            {
              id: "c",
              text: "Yes, if I pay an extra fee",
              isCorrect: false,
            },
            {
              id: "d",
              text: "No, international students can never bring dependants",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q9",
          questionText:
            "What happens if you drop below the required attendance level for your course?",
          options: [
            {
              id: "a",
              text: "The university is legally obligated to report me to UKVI, which may result in visa cancellation",
              isCorrect: true,
            },
            {
              id: "b",
              text: "The university will just give me a warning",
              isCorrect: false,
            },
            {
              id: "c",
              text: "I will have to pay a fine to the university",
              isCorrect: false,
            },
            {
              id: "d",
              text: "Nothing, as long as I pass my final exams",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q10",
          questionText:
            "Can you set up your own business or act as a sole trader while on a Student Visa?",
          options: [
            {
              id: "a",
              text: "No, self-employment and business activity are strictly prohibited",
              isCorrect: true,
            },
            {
              id: "b",
              text: "Yes, as long as it does not interfere with my studies",
              isCorrect: false,
            },
            {
              id: "c",
              text: "Yes, but only online businesses",
              isCorrect: false,
            },
            {
              id: "d",
              text: "Yes, if I register the business in my home country",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q11",
          questionText:
            "When calculating your maintenance funds, what exchange rate does UKVI use?",
          options: [
            {
              id: "a",
              text: "OANDA on the date of your visa application",
              isCorrect: true,
            },
            {
              id: "b",
              text: "The exchange rate on the day the money was deposited",
              isCorrect: false,
            },
            {
              id: "c",
              text: "The black market/parallel market rate",
              isCorrect: false,
            },
            {
              id: "d",
              text: "The rate provided by my local bank",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q12",
          questionText:
            "If a UKVI officer suspects your funds are not genuinely available to you (e.g., a sudden large deposit), what can they do?",
          options: [
            {
              id: "a",
              text: "They can request the source of funds or refuse the visa on credibility grounds",
              isCorrect: true,
            },
            {
              id: "b",
              text: "Nothing, as long as it was there for 28 days",
              isCorrect: false,
            },
            {
              id: "c",
              text: "They will call my bank and seize the money",
              isCorrect: false,
            },
            {
              id: "d",
              text: "They will approve it but monitor my UK bank account",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q13",
          questionText:
            "What is a CAS, and how long is it valid for after being issued?",
          options: [
            {
              id: "a",
              text: "Confirmation of Acceptance for Studies; it is valid for 6 months",
              isCorrect: true,
            },
            {
              id: "b",
              text: "Certificate of Academic Status; it is valid for 1 year",
              isCorrect: false,
            },
            {
              id: "c",
              text: "Confirmation of Acceptance for Studies; it is valid for 3 months",
              isCorrect: false,
            },
            {
              id: "d",
              text: "College Admission Statement; it does not expire",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q14",
          questionText:
            "Are you allowed to work full-time hours (up to 40 hours) under any circumstances?",
          options: [
            {
              id: "a",
              text: "Yes, but strictly only outside of official university term times (e.g., during summer holidays)",
              isCorrect: true,
            },
            {
              id: "b",
              text: "No, I can never work more than 20 hours",
              isCorrect: false,
            },
            {
              id: "c",
              text: "Yes, if I need extra money to pay tuition",
              isCorrect: false,
            },
            {
              id: "d",
              text: "Yes, during my first semester",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q15",
          questionText:
            "If your CAS states you have paid a £3,000 deposit, but your total tuition is £15,000, how much must you show in your bank account for tuition?",
          options: [
            { id: "a", text: "£12,000", isCorrect: true },
            { id: "b", text: "£15,000", isCorrect: false },
            { id: "c", text: "£3,000", isCorrect: false },
            {
              id: "d",
              text: "Nothing, the deposit is enough",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q16",
          questionText: "What is a BRP and when must you collect it?",
          options: [
            {
              id: "a",
              text: "Biometric Residence Permit; usually within 10 days of arriving in the UK",
              isCorrect: true,
            },
            {
              id: "b",
              text: "British Residency Passport; at the airport",
              isCorrect: false,
            },
            {
              id: "c",
              text: "Border Registration Paper; before leaving my home country",
              isCorrect: false,
            },
            {
              id: "d",
              text: "Biometric Residence Permit; anytime during my first year",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q17",
          questionText:
            "If you decide you do not like your course after arriving in the UK, can you easily switch to a lower-level course (e.g., from Master's to Bachelor's)?",
          options: [
            {
              id: "a",
              text: "No, this usually requires leaving the UK and applying for a new visa",
              isCorrect: true,
            },
            {
              id: "b",
              text: "Yes, I just need to tell the university",
              isCorrect: false,
            },
            {
              id: "c",
              text: "Yes, as long as it is at the same university",
              isCorrect: false,
            },
            {
              id: "d",
              text: "Yes, I can switch at any time without notifying UKVI",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q18",
          questionText: "What is the ATAS certificate?",
          options: [
            {
              id: "a",
              text: "Academic Technology Approval Scheme; required for certain sensitive science and engineering courses",
              isCorrect: true,
            },
            {
              id: "b",
              text: "A mandatory English test for all students",
              isCorrect: false,
            },
            {
              id: "c",
              text: "A certificate proving my financial status",
              isCorrect: false,
            },
            {
              id: "d",
              text: "A medical clearance document",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q19",
          questionText:
            "Can you use a company bank account (e.g., your parent's business account) as proof of maintenance funds?",
          options: [
            {
              id: "a",
              text: "No, the funds must be in a personal bank account",
              isCorrect: true,
            },
            {
              id: "b",
              text: "Yes, as long as my parent owns the business",
              isCorrect: false,
            },
            {
              id: "c",
              text: "Yes, if the business has a high turnover",
              isCorrect: false,
            },
            {
              id: "d",
              text: "Yes, but only for postgraduate students",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q20",
          questionText:
            "What is the consequence of providing a fraudulent document (e.g., a fake bank statement) to UKVI?",
          options: [
            {
              id: "a",
              text: "Automatic visa refusal and a possible 10-year ban from entering the UK",
              isCorrect: true,
            },
            {
              id: "b",
              text: "They will just ask me to provide a real one",
              isCorrect: false,
            },
            {
              id: "c",
              text: "My university will cancel my CAS but I can apply again",
              isCorrect: false,
            },
            { id: "d", text: "I will get a warning letter", isCorrect: false },
          ],
        },
      ],
    },
  },

  // ────────────────────────────────────────────────────────────────────────
  // PACK 2: Academic Intent & University Knowledge
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "default-pack-academic-intent",
    data: {
      title: "Academic Intent & University Knowledge",
      description:
        "Demonstrate detailed knowledge of your specific course, university, and academic goals. Pass mark is 100% — you must know these perfectly.",
      category: "University Specific / Academic",
      passScore: 100,
      isDefault: true,
      createdBy: "system",
      questions: [
        {
          id: "q1",
          questionText:
            "When asked \"Why did you choose this specific university?\", which is the most acceptable approach for a UKVI interview?",
          options: [
            {
              id: "a",
              text: "Mentioning specific research facilities, unique course modules, or industry connections specific to the university",
              isCorrect: true,
            },
            {
              id: "b",
              text: "Stating that the university is highly ranked on Google",
              isCorrect: false,
            },
            {
              id: "c",
              text: "Saying it was the only university that gave an admission offer",
              isCorrect: false,
            },
            {
              id: "d",
              text: "Mentioning that the city is beautiful and has a good football team",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q2",
          questionText:
            "Why did you choose to study this course in the UK instead of your home country?",
          options: [
            {
              id: "a",
              text: "The UK offers a specialized 1-year master's blending theory with practical application not available locally",
              isCorrect: true,
            },
            {
              id: "b",
              text: "The education system in my home country is bad",
              isCorrect: false,
            },
            {
              id: "c",
              text: "I want to experience living in Europe",
              isCorrect: false,
            },
            {
              id: "d",
              text: "It is easier to pass exams in the UK",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q3",
          questionText:
            "If the interviewer asks about your accommodation, what information must you provide?",
          options: [
            {
              id: "a",
              text: "The exact address, the cost, the distance from the campus, and how I plan to commute",
              isCorrect: true,
            },
            { id: "b", text: "Just the name of the city", isCorrect: false },
            {
              id: "c",
              text: "That I will look for a place when I arrive",
              isCorrect: false,
            },
            {
              id: "d",
              text: "That I will stay with a friend on a sofa temporarily",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q4",
          questionText:
            "How should you answer if asked: \"Did you consider any other universities?\"",
          options: [
            {
              id: "a",
              text: "Name 2-3 other specific UK universities you researched, and explain why your chosen university is better for your specific goals",
              isCorrect: true,
            },
            {
              id: "b",
              text: "\"No, this was the only one my agent recommended.\"",
              isCorrect: false,
            },
            {
              id: "c",
              text: "\"Yes, I applied to 10 random universities and this one replied first.\"",
              isCorrect: false,
            },
            {
              id: "d",
              text: "\"No, I only wanted to go to this specific city.\"",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q5",
          questionText:
            "What level of qualification will you achieve upon completing a standard UK Master's degree?",
          options: [
            { id: "a", text: "RQF Level 7", isCorrect: true },
            { id: "b", text: "RQF Level 6", isCorrect: false },
            { id: "c", text: "RQF Level 8", isCorrect: false },
            { id: "d", text: "A diploma", isCorrect: false },
          ],
        },
        {
          id: "q6",
          questionText:
            "If asked to name the modules you will be studying, how many should you comfortably be able to discuss?",
          options: [
            {
              id: "a",
              text: "At least 3 to 4 core modules, explaining what they cover and why they interest me",
              isCorrect: true,
            },
            {
              id: "b",
              text: "None, I will learn what they are when I get there",
              isCorrect: false,
            },
            {
              id: "c",
              text: "I just need to say \"Management\" or \"Business\"",
              isCorrect: false,
            },
            {
              id: "d",
              text: "I only need to know the name of my final project",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q7",
          questionText: "How will your course be assessed?",
          options: [
            {
              id: "a",
              text: "I must state the specific breakdown for my course (e.g., a mix of coursework, written exams, presentations, and a final dissertation)",
              isCorrect: true,
            },
            {
              id: "b",
              text: "Mostly multiple-choice tests",
              isCorrect: false,
            },
            {
              id: "c",
              text: "Just attendance and participation",
              isCorrect: false,
            },
            {
              id: "d",
              text: "I don't know, it depends on the professor",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q8",
          questionText:
            "Why didn't you choose to study in the USA, Canada, or Australia?",
          options: [
            {
              id: "a",
              text: "UK Master's degrees are generally 1 year long, making them more cost-effective and allowing faster entry into the workforce",
              isCorrect: true,
            },
            {
              id: "b",
              text: "The visas for those countries are too hard to get",
              isCorrect: false,
            },
            {
              id: "c",
              text: "The flights to the UK are cheaper",
              isCorrect: false,
            },
            {
              id: "d",
              text: "I have relatives in the UK",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q9",
          questionText:
            "If you have a \"study gap\" (years between your last degree and this one), how must you explain it?",
          options: [
            {
              id: "a",
              text: "By detailing my relevant work experience, professional growth, or business ventures during that time",
              isCorrect: true,
            },
            {
              id: "b",
              text: "Say I was just resting and doing nothing",
              isCorrect: false,
            },
            {
              id: "c",
              text: "Refuse to answer as it is personal",
              isCorrect: false,
            },
            {
              id: "d",
              text: "Say I was trying to save money because I was broke",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q10",
          questionText: "What is a \"Pre-sessional English\" course?",
          options: [
            {
              id: "a",
              text: "A short course taken before the main degree to improve academic English skills to the required university standard",
              isCorrect: true,
            },
            {
              id: "b",
              text: "A course where I learn about British culture",
              isCorrect: false,
            },
            {
              id: "c",
              text: "A mandatory course for all international students, even if they speak perfect English",
              isCorrect: false,
            },
            {
              id: "d",
              text: "A tour of the university campus",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q11",
          questionText:
            "Does your chosen course offer professional accreditation (e.g., ACCA, RIBA, BPS)?",
          options: [
            {
              id: "a",
              text: "I must know exactly if my course has accreditation, what body provides it, and how it helps my career",
              isCorrect: true,
            },
            {
              id: "b",
              text: "Accreditation doesn't matter for international students",
              isCorrect: false,
            },
            {
              id: "c",
              text: "All UK degrees are automatically accredited by the government",
              isCorrect: false,
            },
            {
              id: "d",
              text: "I will find out after I graduate",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q12",
          questionText:
            "Who is the Vice-Chancellor or the Head of Department for your course?",
          options: [
            {
              id: "a",
              text: "I should have researched the names of key faculty members, especially my course leader or head of department",
              isCorrect: true,
            },
            {
              id: "b",
              text: "I don't need to know any staff names",
              isCorrect: false,
            },
            {
              id: "c",
              text: "The Prime Minister of the UK",
              isCorrect: false,
            },
            { id: "d", text: "My educational agent", isCorrect: false },
          ],
        },
        {
          id: "q13",
          questionText:
            "What is the difference between a lecture and a seminar in a UK university?",
          options: [
            {
              id: "a",
              text: "A lecture is a large presentation by a professor, while a seminar is a smaller, interactive group discussion",
              isCorrect: true,
            },
            {
              id: "b",
              text: "They are exactly the same thing",
              isCorrect: false,
            },
            {
              id: "c",
              text: "A lecture is online, a seminar is in person",
              isCorrect: false,
            },
            {
              id: "d",
              text: "Seminars are only for postgraduate students",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q14",
          questionText:
            "Where exactly is your university campus located?",
          options: [
            {
              id: "a",
              text: "I must know the specific city, the campus name/location, and general geography (e.g., \"It's in the Midlands, about 2 hours by train from London\")",
              isCorrect: true,
            },
            {
              id: "b",
              text: "\"In London.\" (Even if it is actually in Scotland)",
              isCorrect: false,
            },
            { id: "c", text: "\"In the UK.\"", isCorrect: false },
            {
              id: "d",
              text: "My agent knows the address, I will ask them",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q15",
          questionText:
            "How did you first find out about this university?",
          options: [
            {
              id: "a",
              text: "Through independent research online, attending an education fair, or reading specific academic journals",
              isCorrect: true,
            },
            {
              id: "b",
              text: "\"My agent did everything, I just signed the forms.\"",
              isCorrect: false,
            },
            {
              id: "c",
              text: "\"I saw an ad on Instagram.\"",
              isCorrect: false,
            },
            {
              id: "d",
              text: "\"My friend went there so I copied them.\"",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q16",
          questionText:
            "If your previous degree is completely unrelated to your new Master's (e.g., Engineering to Marketing), how do you justify it?",
          options: [
            {
              id: "a",
              text: "Explain how my career goals have shifted, supported by recent work experience in the new field that requires this specific academic upgrade",
              isCorrect: true,
            },
            {
              id: "b",
              text: "Say I just got bored of my old subject",
              isCorrect: false,
            },
            {
              id: "c",
              text: "Say this was the easiest course to get accepted into",
              isCorrect: false,
            },
            {
              id: "d",
              text: "Say it doesn't matter because it's just a degree",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q17",
          questionText:
            "How many credits are required to complete a standard UK Master's degree?",
          options: [
            {
              id: "a",
              text: "180 credits (usually 120 for taught modules and 60 for the dissertation)",
              isCorrect: true,
            },
            { id: "b", text: "120 credits", isCorrect: false },
            { id: "c", text: "360 credits", isCorrect: false },
            {
              id: "d",
              text: "It depends on how much tuition I pay",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q18",
          questionText:
            "What facilities does your chosen university have that will specifically aid your studies?",
          options: [
            {
              id: "a",
              text: "I should name specific facilities like a 24/7 library, specialized engineering labs, Bloomberg terminals, or media studios relevant to my course",
              isCorrect: true,
            },
            { id: "b", text: "A big cafeteria", isCorrect: false },
            {
              id: "c",
              text: "A nice gym and sports center",
              isCorrect: false,
            },
            { id: "d", text: "Free Wi-Fi", isCorrect: false },
          ],
        },
        {
          id: "q19",
          questionText:
            "What will your final dissertation or major project likely focus on?",
          options: [
            {
              id: "a",
              text: "I should have a rough proposal or topic in mind that aligns with my home country's industry needs and my future career goals",
              isCorrect: true,
            },
            {
              id: "b",
              text: "Whatever the professor tells me to write",
              isCorrect: false,
            },
            {
              id: "c",
              text: "Something easy so I can pass quickly",
              isCorrect: false,
            },
            {
              id: "d",
              text: "I'm not going to do a dissertation",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q20",
          questionText:
            "What is the primary teaching method for your course?",
          options: [
            {
              id: "a",
              text: "I should know the balance of independent study, lectures, and practical workshops as outlined on the course webpage",
              isCorrect: true,
            },
            {
              id: "b",
              text: "100% memorization from textbooks",
              isCorrect: false,
            },
            {
              id: "c",
              text: "Just listening to the teacher talk all day",
              isCorrect: false,
            },
            {
              id: "d",
              text: "Group work with my friends",
              isCorrect: false,
            },
          ],
        },
      ],
    },
  },

  // ────────────────────────────────────────────────────────────────────────
  // PACK 3: Career Progression & Genuine Intent (ROI)
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "default-pack-career-intent",
    data: {
      title: "Career Progression & Genuine Intent (ROI)",
      description:
        "Demonstrate clear career plans, genuine reasons for studying abroad, and a compelling return-home narrative to satisfy UKVI intent requirements.",
      category: "Career Plans / Genuine Student",
      passScore: 80,
      isDefault: true,
      createdBy: "system",
      questions: [
        {
          id: "q1",
          questionText:
            "What is the best way to explain your immediate plans after graduating from this UK university?",
          options: [
            {
              id: "a",
              text: "I will return to my home country to apply for specific roles (e.g., Senior Data Analyst) at target companies (e.g., MTN, KPMG)",
              isCorrect: true,
            },
            {
              id: "b",
              text: "I will look for any available job in the UK to get a work visa",
              isCorrect: false,
            },
            {
              id: "c",
              text: "I haven't decided yet, I will see what happens after I graduate",
              isCorrect: false,
            },
            {
              id: "d",
              text: "I want to stay in the UK because the economy is better",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q2",
          questionText:
            "How do you justify the high financial cost of this UK degree as a good investment?",
          options: [
            {
              id: "a",
              text: "By demonstrating how the expected starting salary for my target role back home will allow me to recoup the tuition costs over a realistic timeframe (e.g., 3-5 years)",
              isCorrect: true,
            },
            {
              id: "b",
              text: "By saying my parents are rich so the cost doesn't matter to me",
              isCorrect: false,
            },
            {
              id: "c",
              text: "By stating that UK degrees automatically guarantee jobs everywhere in the world",
              isCorrect: false,
            },
            {
              id: "d",
              text: "By explaining that I will make the money back working part-time in the UK while studying",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q3",
          questionText:
            "What specific ties do you have to your home country that will ensure your return after graduation?",
          options: [
            {
              id: "a",
              text: "Strong family ties, property/assets, or a concrete job offer/leave of absence from my current employer awaiting my return",
              isCorrect: true,
            },
            {
              id: "b",
              text: "I just like my home country's food better",
              isCorrect: false,
            },
            {
              id: "c",
              text: "I don't like the cold weather in the UK",
              isCorrect: false,
            },
            {
              id: "d",
              text: "My student visa will expire so I have to leave anyway",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q4",
          questionText:
            "If the interviewer asks about your expected starting salary in your home country after graduation, how should you answer?",
          options: [
            {
              id: "a",
              text: "I must state a specific, realistic figure in my local currency, based on actual job market research I have done",
              isCorrect: true,
            },
            {
              id: "b",
              text: "\"I will earn millions because I have a UK degree.\"",
              isCorrect: false,
            },
            {
              id: "c",
              text: "\"I don't know, whatever the company decides to pay me.\"",
              isCorrect: false,
            },
            {
              id: "d",
              text: "\"I will be paid in British Pounds even when I return home.\"",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q5",
          questionText:
            "How should you answer if the interviewer asks: \"What if you get a high-paying job offer in the UK after graduation?\"",
          options: [
            {
              id: "a",
              text: "State that while UK experience is valuable, my long-term career goals, family ties, and primary target industries are rooted in my home country",
              isCorrect: true,
            },
            {
              id: "b",
              text: "\"I would definitely accept it and stay in the UK forever.\"",
              isCorrect: false,
            },
            {
              id: "c",
              text: "\"I would take it because salaries back home are too low.\"",
              isCorrect: false,
            },
            {
              id: "d",
              text: "\"I don't want to work in the UK at all.\"",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q6",
          questionText:
            "If you are currently employed, how does this Master's degree relate to your current job?",
          options: [
            {
              id: "a",
              text: "It will bridge a specific skills gap, allowing me to secure a promotion to a managerial or senior specialist role upon my return",
              isCorrect: true,
            },
            {
              id: "b",
              text: "It has nothing to do with my job, I just wanted a break from working",
              isCorrect: false,
            },
            { id: "c", text: "My boss forced me to do it", isCorrect: false },
            {
              id: "d",
              text: "I want to use it to get a completely different job in the UK",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q7",
          questionText:
            "Why is a degree from this specific UK university better than getting the exact same degree from a university in your home country?",
          options: [
            {
              id: "a",
              text: "It offers global industry perspectives, specialized modules not taught locally, and is highly preferred by top multinational employers in my country",
              isCorrect: true,
            },
            {
              id: "b",
              text: "The universities in my home country are terrible and always on strike",
              isCorrect: false,
            },
            {
              id: "c",
              text: "Because a UK degree looks fancier on my CV",
              isCorrect: false,
            },
            {
              id: "d",
              text: "Because it is easier to pass exams in the UK",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q8",
          questionText:
            "If you state that you want to start your own business after graduating, what follow-up information MUST you be able to provide?",
          options: [
            {
              id: "a",
              text: "A clear business plan, target market research, and an explanation of how I will fund the startup capital",
              isCorrect: true,
            },
            {
              id: "b",
              text: "Just the name of the company I want to create",
              isCorrect: false,
            },
            {
              id: "c",
              text: "I just need to say I want to be a CEO",
              isCorrect: false,
            },
            {
              id: "d",
              text: "I will figure out the details after I graduate",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q9",
          questionText:
            "Can you name 2 or 3 specific companies in your home country that you will apply to after graduation?",
          options: [
            {
              id: "a",
              text: "Yes, I have researched specific companies (e.g., Zenith Bank, Shell, PwC) that actively recruit graduates with my specific skill set",
              isCorrect: true,
            },
            {
              id: "b",
              text: "No, I will apply to whatever is available",
              isCorrect: false,
            },
            {
              id: "c",
              text: "I will only apply to companies in London",
              isCorrect: false,
            },
            {
              id: "d",
              text: "I don't know the names of any companies yet",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q10",
          questionText:
            "What are your long-term career goals (5 to 10 years from now)?",
          options: [
            {
              id: "a",
              text: "To hold a senior leadership/director position in my industry, or to have successfully scaled my own specialized consultancy/business back home",
              isCorrect: true,
            },
            {
              id: "b",
              text: "To be retired and rich",
              isCorrect: false,
            },
            {
              id: "c",
              text: "To have a British passport",
              isCorrect: false,
            },
            {
              id: "d",
              text: "To still be looking for a job",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q11",
          questionText:
            "How exactly will the specific modules on your course help you in your daily work tasks when you get a job?",
          options: [
            {
              id: "a",
              text: "I can link specific modules (e.g., \"Advanced Data Modeling\") to specific tasks I will perform (e.g., \"Predicting consumer trends for my target employer\")",
              isCorrect: true,
            },
            {
              id: "b",
              text: "They just give me general knowledge",
              isCorrect: false,
            },
            {
              id: "c",
              text: "I will only use the skills to pass the university exams",
              isCorrect: false,
            },
            {
              id: "d",
              text: "The modules don't matter, only the final certificate matters",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q12",
          questionText:
            "If the interviewer asks about the UK Graduate Route (Post-Study Work Visa), how should you approach it?",
          options: [
            {
              id: "a",
              text: "If I plan to use it, I must explain that it is strictly to gain short-term international experience before returning home to achieve my primary career goals",
              isCorrect: true,
            },
            {
              id: "b",
              text: "Say it is my main reason for choosing the UK so I can immigrate",
              isCorrect: false,
            },
            {
              id: "c",
              text: "Say I plan to use it to pay back the loan I took for my tuition",
              isCorrect: false,
            },
            {
              id: "d",
              text: "Say I will use it to bring my extended family to the UK",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q13",
          questionText:
            "What is your \"Backup Plan\" if you cannot get a job at your top target companies?",
          options: [
            {
              id: "a",
              text: "I have researched secondary companies, alternative roles in related industries, or specialized graduate trainee programs in my home country",
              isCorrect: true,
            },
            {
              id: "b",
              text: "I don't have a backup plan, I will just stay in the UK",
              isCorrect: false,
            },
            {
              id: "c",
              text: "I will just apply for another Master's degree",
              isCorrect: false,
            },
            {
              id: "d",
              text: "I will give up and stay at home",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q14",
          questionText:
            "What professional body or regulatory association will you join in your home country after getting this degree?",
          options: [
            {
              id: "a",
              text: "I must name the specific local professional body relevant to my field (e.g., ICAN, COREN, NIM) that this degree will help me enter",
              isCorrect: true,
            },
            {
              id: "b",
              text: "I don't need to join any professional bodies",
              isCorrect: false,
            },
            {
              id: "c",
              text: "I will only join UK professional bodies",
              isCorrect: false,
            },
            {
              id: "d",
              text: "I don't know any professional bodies",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q15",
          questionText:
            "How did you research the job market and salaries in your home country?",
          options: [
            {
              id: "a",
              text: "By checking local job boards (e.g., LinkedIn, Jobberman), speaking to industry professionals, and analyzing current market trends",
              isCorrect: true,
            },
            {
              id: "b",
              text: "I just guessed the salary",
              isCorrect: false,
            },
            {
              id: "c",
              text: "My parents told me what I would earn",
              isCorrect: false,
            },
            {
              id: "d",
              text: "My educational agent gave me a random figure",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q16",
          questionText:
            "Why are you spending £15,000+ on a degree when the starting salary in your home country might only be the equivalent of £3,000 a year?",
          options: [
            {
              id: "a",
              text: "I must explain the long-term trajectory: while the starting salary might seem low compared to the UK, the degree accelerates my promotion path, leading to high-tier local salaries within 3-5 years",
              isCorrect: true,
            },
            {
              id: "b",
              text: "I didn't think about the math, I just want to travel",
              isCorrect: false,
            },
            {
              id: "c",
              text: "Because I actually plan to work in the UK to pay it off",
              isCorrect: false,
            },
            {
              id: "d",
              text: "The money is my parents' problem, not mine",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q17",
          questionText:
            "If your previous work experience is unrelated to your new degree, how do you explain your career switch?",
          options: [
            {
              id: "a",
              text: "By explaining a genuine \"trigger point\" or realization in my recent career that made me passionate about the new field, and showing I have researched what this new career entails",
              isCorrect: true,
            },
            {
              id: "b",
              text: "Say I just got bored and wanted to try something new",
              isCorrect: false,
            },
            {
              id: "c",
              text: "Say the new field pays more money, even though I know nothing about it",
              isCorrect: false,
            },
            {
              id: "d",
              text: "Say my agent told me this was an easy course",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q18",
          questionText:
            "What current industry trend in your home country makes your chosen degree highly relevant right now?",
          options: [
            {
              id: "a",
              text: "I must be able to discuss a specific current event, economic shift, or technological gap in my home country that my degree will help solve",
              isCorrect: true,
            },
            {
              id: "b",
              text: "There are no specific trends, I just want a degree",
              isCorrect: false,
            },
            {
              id: "c",
              text: "Everything in my country is perfect, I just want to study",
              isCorrect: false,
            },
            {
              id: "d",
              text: "I only follow UK industry trends",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q19",
          questionText:
            "How will the university's alumni network help you with your career goals?",
          options: [
            {
              id: "a",
              text: "I can connect with alumni from my home country who have successfully transitioned into the local industries I am targeting",
              isCorrect: true,
            },
            {
              id: "b",
              text: "It will help me find a wife/husband",
              isCorrect: false,
            },
            {
              id: "c",
              text: "They can lend me money to start a business",
              isCorrect: false,
            },
            {
              id: "d",
              text: "Alumni networks don't actually do anything",
              isCorrect: false,
            },
          ],
        },
        {
          id: "q20",
          questionText:
            "Ultimately, what is the single most important thing the UKVI interviewer needs to believe about you by the end of the interview?",
          options: [
            {
              id: "a",
              text: "That I am a genuine student with clear, well-researched intentions to study, and that I have compelling reasons to leave the UK at the end of my visa",
              isCorrect: true,
            },
            {
              id: "b",
              text: "That I have a lot of money in my bank account",
              isCorrect: false,
            },
            {
              id: "c",
              text: "That I speak perfect English",
              isCorrect: false,
            },
            {
              id: "d",
              text: "That I love British culture and the Royal Family",
              isCorrect: false,
            },
          ],
        },
      ],
    },
  },
];

// ── Main ───────────────────────────────────────────────────────────────────

console.log("\n🚀  Seeding 3 default question packs to Firestore...\n");

for (const pack of packs) {
  process.stdout.write(`📦  Writing: ${pack.data.title}... `);
  await upsertDoc(pack.id, pack.data);
}

console.log("\n✅  Done! All 3 packs written with isDefault: true\n");
console.log(
  "   Students will now see these packs automatically on the Learning page."
);
console.log(
  "   (The learning page filters: pack.isDefault === true || userAssignedIds.includes(pack.id))\n"
);
