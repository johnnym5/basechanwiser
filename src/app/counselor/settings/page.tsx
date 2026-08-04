"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc, serverTimestamp, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Resource, SystemSettings } from "@/types/resource";
import { QuestionPack, LearningModule, UserProfile } from "@/types";
import { Settings, Video, FileText, Music, ExternalLink, Trash2, Edit, Plus, X, PackageCheck, Loader2, CheckCircle2, GraduationCap, LayoutGrid, Monitor, Shield, Mail, Tag, Calendar, Eye, Download, Users, Lock, Sparkles, AlertCircle } from "lucide-react";

// ── Default Learning Modules (UKVI Progressive System) ───────────────────
const DEFAULT_LEARNING_MODULES: Omit<LearningModule, "createdAt" | "updatedAt">[] = [
  {
    id: "module_1",
    order: 1,
    title: "Module 1: Fundamentals of University & UKVI Credibility Interviews",
    description: "Purpose of interviews, Home Office guidelines, university vs. UKVI expectations, and the Genuine Student Test (GST).",
    passScore: 80,
    createdBy: "system",
    questions: [
      { id: "m1_q1", questionText: "What is the primary purpose of a UKVI Credibility Interview?", options: [{ id: "m1_q1_a", text: "To verify that you are a genuine student with the intention and ability to study in the UK", isCorrect: true }, { id: "m1_q1_b", text: "To test your English accent", isCorrect: false }, { id: "m1_q1_c", text: "To check if you have paid for your flight tickets", isCorrect: false }] },
      { id: "m1_q2", questionText: "Which UK government department oversees the student visa process?", options: [{ id: "m1_q2_a", text: "Department of Education", isCorrect: false }, { id: "m1_q2_b", text: "Home Office", isCorrect: true }, { id: "m1_q2_c", text: "Foreign Office", isCorrect: false }] },
      { id: "m1_q3", questionText: "What does 'GST' stand for in the current UKVI framework?", options: [{ id: "m1_q3_a", text: "Global Student Transfer", isCorrect: false }, { id: "m1_q3_b", text: "Genuine Student Test", isCorrect: true }, { id: "m1_q3_c", text: "General Study Tier", isCorrect: false }] },
      { id: "m1_q4", questionText: "Why might a university conduct a pre-CAS interview?", options: [{ id: "m1_q4_a", text: "To decide whether to issue a Confirmation of Acceptance for Studies", isCorrect: true }, { id: "m1_q4_b", text: "To help you find a part-time job", isCorrect: false }, { id: "m1_q4_c", text: "To process your tuition fee payment", isCorrect: false }] },
      { id: "m1_q5", questionText: "Which of these is a core component of the Genuine Student Test?", options: [{ id: "m1_q5_a", text: "Your social media following", isCorrect: false }, { id: "m1_q5_b", text: "Your sincere intention to study the chosen course", isCorrect: true }, { id: "m1_q5_c", text: "Your knowledge of British sports", isCorrect: false }] },
      { id: "m1_q6", questionText: "What is the 'Genuineness' requirement?", options: [{ id: "m1_q6_a", text: "Proving you are a real person", isCorrect: false }, { id: "m1_q6_b", text: "Demonstrating that your primary motive for going to the UK is to study", isCorrect: true }, { id: "m1_q6_c", text: "Proving you have visited the UK before", isCorrect: false }] },
      { id: "m1_q7", questionText: "How is a UKVI interview typically conducted for international students?", options: [{ id: "m1_q7_a", text: "Via a video link or telephone call", isCorrect: true }, { id: "m1_q7_b", text: "In person at the university", isCorrect: false }, { id: "m1_q7_c", text: "By email correspondence", isCorrect: false }] },
      { id: "m1_q8", questionText: "What should you do if you don't understand an interviewer's question?", options: [{ id: "m1_q8_a", text: "Make up an answer", isCorrect: false }, { id: "m1_q8_b", text: "Ask them to repeat or rephrase the question", isCorrect: true }, { id: "m1_q8_c", text: "Stay silent", isCorrect: false }] },
      { id: "m1_q9", questionText: "Why is it important to be consistent with your Statement of Purpose (SOP)?", options: [{ id: "m1_q9_a", text: "Consistency proves you are a genuine applicant with a clear plan", isCorrect: true }, { id: "m1_q9_b", text: "The SOP is a legal contract", isCorrect: false }, { id: "m1_q9_c", text: "Interviewer will only ask questions from the SOP", isCorrect: false }] },
      { id: "m1_q10", questionText: "What is a 'refusal on credibility grounds'?", options: [{ id: "m1_q10_a", text: "Refusal because your bank statement was invalid", isCorrect: false }, { id: "m1_q10_b", text: "Refusal because the officer does not believe you are a genuine student", isCorrect: true }, { id: "m1_q10_c", text: "Refusal because the university closed down", isCorrect: false }] },
      { id: "m1_q11", questionText: "Which of these is NOT a goal of the interview?", options: [{ id: "m1_q11_a", text: "Assessing your academic intent", isCorrect: false }, { id: "m1_q11_b", text: "Testing your English language ability in a live setting", isCorrect: false }, { id: "m1_q11_c", text: "Checking your physical fitness for travel", isCorrect: true }] },
      { id: "m1_q12", questionText: "What should you do if you have had a previous visa refusal?", options: [{ id: "m1_q12_a", text: "Conceal it to avoid prejudice", isCorrect: false }, { id: "m1_q12_b", text: "Declare it honestly and explain the circumstances", isCorrect: true }, { id: "m1_q12_c", text: "Say it was a mistake by the embassy", isCorrect: false }] },
      { id: "m1_q13", questionText: "What is the Home Office's primary concern regarding international students?", options: [{ id: "m1_q13_a", text: "Maximizing tuition fee revenue", isCorrect: false }, { id: "m1_q13_b", text: "Ensuring students do not breach visa conditions or overstay", isCorrect: true }, { id: "m1_q13_c", text: "Promoting UK tourism", isCorrect: false }] },
      { id: "m1_q14", questionText: "Is the interview recorded?", options: [{ id: "m1_q14_a", text: "Yes, usually a transcript or recording is kept for assessment", isCorrect: true }, { id: "m1_q14_b", text: "No, it is informal", isCorrect: false }, { id: "m1_q14_c", text: "Only if you ask for it", isCorrect: false }] },
      { id: "m1_q15", questionText: "What happens if you fail to attend a scheduled UKVI interview without a valid reason?", options: [{ id: "m1_q15_a", text: "Your application will likely be refused", isCorrect: true }, { id: "m1_q15_b", text: "They will reschedule automatically", isCorrect: false }, { id: "m1_q15_c", text: "You will be fined", isCorrect: false }] },
      { id: "m1_q16", questionText: "What level of English is generally expected during the interview?", options: [{ id: "m1_q16_a", text: "Native proficiency", isCorrect: false }, { id: "m1_q16_b", text: "Sufficient to discuss your course and plans without a translator", isCorrect: true }, { id: "m1_q16_c", text: "Basic understanding only", isCorrect: false }] },
      { id: "m1_q17", questionText: "Why does UKVI ask about your daily routine?", options: [{ id: "m1_q17_a", text: "To check if you are active and focused on your current status", isCorrect: true }, { id: "m1_q17_b", text: "To see if you have time for a job", isCorrect: false }, { id: "m1_q17_c", text: "To check your sleep schedule", isCorrect: false }] },
      { id: "m1_q18", questionText: "What is 'deception' in a visa application?", options: [{ id: "m1_q18_a", text: "Making a small spelling mistake", isCorrect: false }, { id: "m1_q18_b", text: "Providing false information or documents intentionally", isCorrect: true }, { id: "m1_q18_c", text: "Applying two days late", isCorrect: false }] },
      { id: "m1_q19", questionText: "What is the 'Immigration Health Surcharge' (IHS)?", options: [{ id: "m1_q19_a", text: "A fee for private insurance", isCorrect: false }, { id: "m1_q19_b", text: "A mandatory payment to access the UK's National Health Service", isCorrect: true }, { id: "m1_q19_c", text: "A tax on medicines", isCorrect: false }] },
      { id: "m1_q20", questionText: "How should you answer if asked about your choice of the UK over other countries?", options: [{ id: "m1_q20_a", text: "Say the UK is the only country you like", isCorrect: false }, { id: "m1_q20_b", text: "Explain the specific benefits of the UK education system for your career", isCorrect: true }, { id: "m1_q20_c", text: "Say it was the easiest visa to get", isCorrect: false }] },
      { id: "m1_q21", questionText: "What is 'credibility'?", options: [{ id: "m1_q21_a", text: "The amount of money in your account", isCorrect: false }, { id: "m1_q21_b", text: "The quality of being trusted and believed in", isCorrect: true }, { id: "m1_q21_c", text: "Your academic grade point average", isCorrect: false }] },
      { id: "m1_q22", questionText: "Why is independent research important?", options: [{ id: "m1_q22_a", text: "It shows you are taking your education seriously", isCorrect: true }, { id: "m1_q22_b", text: "It is required for the CAS", isCorrect: false }, { id: "m1_q22_c", text: "It helps you find cheap flights", isCorrect: false }] },
      { id: "m1_q23", questionText: "Which of these demonstrates 'genuine intent'?", options: [{ id: "m1_q23_a", text: "Having a clear career path that requires this specific degree", isCorrect: true }, { id: "m1_q23_b", text: "Paying the full tuition fee in advance", isCorrect: false }, { id: "m1_q23_c", text: "Booking a return ticket", isCorrect: false }] },
      { id: "m1_q24", questionText: "What is a 'pre-sessional' course?", options: [{ id: "m1_q24_a", text: "A course taken after graduation", isCorrect: false }, { id: "m1_q24_b", text: "An English or foundation course taken before the main degree", isCorrect: true }, { id: "m1_q24_c", text: "A summer holiday program", isCorrect: false }] },
      { id: "m1_q25", questionText: "Why might an interviewer ask about your hobbies?", options: [{ id: "m1_q25_a", text: "To check if you are a well-rounded individual", isCorrect: false }, { id: "m1_q25_b", text: "To see if you will spend too much time on them instead of studying", isCorrect: true }, { id: "m1_q25_c", text: "To be friendly", isCorrect: false }] },
      { id: "m1_q26", questionText: "What is the impact of a 10-year ban?", options: [{ id: "m1_q26_a", text: "You cannot apply for a visa for 10 years", isCorrect: true }, { id: "m1_q26_b", text: "You must pay a 10-year tax", isCorrect: false }, { id: "m1_q26_c", text: "You can only visit for 10 days", isCorrect: false }] },
      { id: "m1_q27", questionText: "What should you know about your university city?", options: [{ id: "m1_q27_a", text: "The name of the local football team", isCorrect: false }, { id: "m1_q27_b", text: "Basic geography, campus location, and travel time", isCorrect: true }, { id: "m1_q27_c", text: "The mayor's name", isCorrect: false }] },
      { id: "m1_q28", questionText: "Why does UKVI compare university vs UKVI expectations?", options: [{ id: "m1_q28_a", text: "To ensure both institutions agree on the student's quality", isCorrect: true }, { id: "m1_q28_b", text: "To see who gives more money", isCorrect: false }, { id: "m1_q28_c", text: "To check for errors", isCorrect: false }] },
      { id: "m1_q29", questionText: "What is the 'Statement of Service'?", options: [{ id: "m1_q29_a", text: "A document for workers", isCorrect: false }, { id: "m1_q29_b", text: "A letter from an employer confirming your roles", isCorrect: true }, { id: "m1_q29_c", text: "A visa application form", isCorrect: false }] },
      { id: "m1_q30", questionText: "Final check: What is the most important thing to bring to the interview?", options: [{ id: "m1_q30_a", text: "Your passport", isCorrect: false }, { id: "m1_q30_b", text: "Honesty and detailed knowledge of your plans", isCorrect: true }, { id: "m1_q30_c", text: "A calculator", isCorrect: false }] }
    ]
  },
  {
    id: "module_2",
    order: 2,
    title: "Module 2: CAS & Financial Compliance",
    description: "Deep dive into CAS issuance, the 28-day financial rule, fund sources, and living expense calculations.",
    passScore: 80,
    createdBy: "system",
    questions: [
      { id: "m2_q1", questionText: "What is a CAS?", options: [{ id: "m2_q1_a", text: "Confirmation of Acceptance for Studies", isCorrect: true }, { id: "m2_q1_b", text: "Certificate of Academic Status", isCorrect: false }, { id: "m2_q1_c", text: "College Admission Statement", isCorrect: false }] },
      { id: "m2_q2", questionText: "How long is a CAS valid for after being issued?", options: [{ id: "m2_q2_a", text: "6 months", isCorrect: true }, { id: "m2_q2_b", text: "3 months", isCorrect: false }, { id: "m2_q2_c", text: "12 months", isCorrect: false }] },
      { id: "m2_q3", questionText: "What is the '28-day rule' for financial evidence?", options: [{ id: "m2_q3_a", text: "Funds must be held in the account for at least 28 consecutive days", isCorrect: true }, { id: "m2_q3_b", text: "You must apply within 28 days of getting your CAS", isCorrect: false }, { id: "m2_q3_c", text: "You must pay your fees 28 days before travel", isCorrect: false }] },
      { id: "m2_q4", questionText: "Who can be your financial sponsor without special legal documentation?", options: [{ id: "m2_q4_a", text: "Any relative", isCorrect: false }, { id: "m2_q4_b", text: "Yourself, parents, or legal guardians", isCorrect: true }, { id: "m2_q4_c", text: "Your employer", isCorrect: false }] },
      { id: "m2_q5", questionText: "What is the required monthly living expense for students outside London (2025 estimate)?", options: [{ id: "m2_q5_a", text: "£1,023", isCorrect: true }, { id: "m2_q5_b", text: "£1,334", isCorrect: false }, { id: "m2_q5_c", text: "£800", isCorrect: false }] },
      { id: "m2_q6", questionText: "What is the required monthly living expense for students inside London (2025 estimate)?", options: [{ id: "m2_q6_a", text: "£1,023", isCorrect: false }, { id: "m2_q6_b", text: "£1,334", isCorrect: true }, { id: "m2_q6_c", text: "£1,500", isCorrect: false }] },
      { id: "m2_q7", questionText: "For how many months must you show living expenses (max)?", options: [{ id: "m2_q7_a", text: "9 months", isCorrect: true }, { id: "m2_q7_b", text: "12 months", isCorrect: false }, { id: "m2_q7_c", text: "6 months", isCorrect: false }] },
      { id: "m2_q8", questionText: "Can you use a business bank account as proof of funds?", options: [{ id: "m2_q8_a", text: "Yes, if it's your father's business", isCorrect: false }, { id: "m2_q8_b", text: "No, it must be a personal account", isCorrect: true }, { id: "m2_q8_c", text: "Yes, if the business is successful", isCorrect: false }] },
      { id: "m2_q9", questionText: "What exchange rate source does UKVI use?", options: [{ id: "m2_q9_a", text: "OANDA", isCorrect: true }, { id: "m2_q9_b", text: "Google Finance", isCorrect: false }, { id: "m2_q9_c", text: "Local Bank Rate", isCorrect: false }] },
      { id: "m2_q10", questionText: "What date does UKVI use to check the exchange rate?", options: [{ id: "m2_q10_a", text: "The date you deposited the money", isCorrect: false }, { id: "m2_q10_b", text: "The date of your visa application", isCorrect: true }, { id: "m2_q10_c", text: "The date the CAS was issued", isCorrect: false }] },
      { id: "m2_q11", questionText: "If your tuition is £15,000 and you paid a £3,000 deposit, how much tuition funds must you show?", options: [{ id: "m2_q11_a", text: "£15,000", isCorrect: false }, { id: "m2_q11_b", text: "£12,000", isCorrect: true }, { id: "m2_q11_c", text: "£3,000", isCorrect: false }] },
      { id: "m2_q12", questionText: "Which document is required if you are using your parents' bank statements?", options: [{ id: "m2_q12_a", text: "Birth certificate and a letter of consent", isCorrect: true }, { id: "m2_q12_b", text: "A copy of their passport", isCorrect: false }, { id: "m2_q12_c", text: "Their employment contract", isCorrect: false }] },
      { id: "m2_q13", questionText: "What is an 'acceptable' source of funds?", options: [{ id: "m2_q13_a", text: "Cash savings or an education loan", isCorrect: true }, { id: "m2_q13_b", text: "Cryptocurrency", isCorrect: false }, { id: "m2_q13_c", text: "Shares and stocks", isCorrect: false }] },
      { id: "m2_q14", questionText: "Can you use a joint account as proof of funds?", options: [{ id: "m2_q14_a", text: "Only if your name is one of the account holders", isCorrect: true }, { id: "m2_q14_b", text: "Yes, any joint account", isCorrect: false }, { id: "m2_q14_c", text: "No, never", isCorrect: false }] },
      { id: "m2_q15", questionText: "What must you do if your bank statements are not in English?", options: [{ id: "m2_q15_a", text: "Translate them yourself", isCorrect: false }, { id: "m2_q15_b", text: "Provide a certified professional translation", isCorrect: true }, { id: "m2_q15_c", text: "Ask the bank to stamp them in English", isCorrect: false }] },
      { id: "m2_q16", questionText: "What is the consequence of the balance falling below the required amount even for one day?", options: [{ id: "m2_q16_a", text: "Automatic refusal of the visa", isCorrect: true }, { id: "m2_q16_b", text: "You will get a warning", isCorrect: false }, { id: "m2_q16_c", text: "Nothing, if the average is high enough", isCorrect: false }] },
      { id: "m2_q17", questionText: "What is the 'Immigration Health Surcharge'?", options: [{ id: "m2_q17_a", text: "A fee for private hospitals", isCorrect: false }, { id: "m2_q17_b", text: "A mandatory fee for NHS access paid during application", isCorrect: true }, { id: "m2_q17_c", text: "A tax on travelers", isCorrect: false }] },
      { id: "m2_q18", questionText: "Can a student rely on future part-time work to meet the financial requirement?", options: [{ id: "m2_q18_a", text: "Yes", isCorrect: false }, { id: "m2_q18_b", text: "No, the full funds must be available upfront", isCorrect: true }, { id: "m2_q18_c", text: "Only for postgraduate students", isCorrect: false }] },
      { id: "m2_q19", questionText: "What is the 'Financial Requirement' for dependants?", options: [{ id: "m2_q19_a", text: "The same as the main applicant", isCorrect: false }, { id: "m2_q19_b", text: "A specific additional amount per dependant for up to 9 months", isCorrect: true }, { id: "m2_q19_c", text: "Nothing, they are free", isCorrect: false }] },
      { id: "m2_q20", questionText: "What is a 'certificate of deposit'?", options: [{ id: "m2_q20_a", text: "A receipt for tuition", isCorrect: false }, { id: "m2_q20_b", text: "A document from a bank confirming funds are held for a specific period", isCorrect: true }, { id: "m2_q20_c", text: "A graduation certificate", isCorrect: false }] },
      { id: "m2_q21", questionText: "Why does UKVI check the source of large deposits?", options: [{ id: "m2_q21_a", text: "To ensure the money is genuinely available for your studies", isCorrect: true }, { id: "m2_q21_b", text: "To collect tax", isCorrect: false }, { id: "m2_q21_c", text: "To check for money laundering", isCorrect: false }] },
      { id: "m2_q22", questionText: "What happens to your CAS once a visa application is refused?", options: [{ id: "m2_q22_a", text: "It remains valid", isCorrect: false }, { id: "m2_q22_b", text: "It is usually marked as 'USED' or 'CANCELLED'", isCorrect: true }, { id: "m2_q22_c", text: "It is extended automatically", isCorrect: false }] },
      { id: "m2_q23", questionText: "Can you use a pension fund as evidence?", options: [{ id: "m2_q23_a", text: "Yes, if it can be withdrawn immediately", isCorrect: true }, { id: "m2_q23_b", text: "No, never", isCorrect: false }, { id: "m2_q23_c", text: "Only if you are over 50", isCorrect: false }] },
      { id: "m2_q24", questionText: "What is the 'Differentiation Arrangement' (ST 22.1)?", options: [{ id: "m2_q24_a", text: "A rule for students from certain low-risk countries", isCorrect: true }, { id: "m2_q24_b", text: "A way to pay less fees", isCorrect: false }, { id: "m2_q24_c", text: "A rule for older students", isCorrect: false }] },
      { id: "m2_q25", questionText: "What should you do if your sponsor's income is from multiple sources?", options: [{ id: "m2_q25_a", text: "Only mention the biggest one", isCorrect: false }, { id: "m2_q25_b", text: "Provide evidence for all significant sources mentioned", isCorrect: true }, { id: "m2_q25_c", text: "Say it's a gift", isCorrect: false }] },
      { id: "m2_q26", questionText: "Is an education loan from a regulated bank acceptable?", options: [{ id: "m2_q26_a", text: "Yes, provided it meets UKVI criteria", isCorrect: true }, { id: "m2_q26_b", text: "No, only cash is accepted", isCorrect: false }, { id: "m2_q26_c", text: "Only if it is already paid to the university", isCorrect: false }] },
      { id: "m2_q27", questionText: "What is the 'tuition fee deposit'?", options: [{ id: "m2_q27_a", text: "A payment to secure your seat and CAS", isCorrect: true }, { id: "m2_q27_b", text: "A fee for the visa application", isCorrect: false }, { id: "m2_q27_c", text: "A library fee", isCorrect: false }] },
      { id: "m2_q28", questionText: "Can you name a common reason for CAS withdrawal?", options: [{ id: "m2_q28_a", text: "Failure to pay the deposit or provide correct financial evidence", isCorrect: true }, { id: "m2_q28_b", text: "Attending all classes", isCorrect: false }, { id: "m2_q28_c", text: "Having a high GPA", isCorrect: false }] },
      { id: "m2_q29", questionText: "What is the 'financial requirement' for a 1-year Master's outside London?", options: [{ id: "m2_q29_a", text: "Tuition + £9,207 (£1,023 x 9)", isCorrect: true }, { id: "m2_q29_b", text: "Tuition + £12,006", isCorrect: false }, { id: "m2_q29_c", text: "Just the tuition", isCorrect: false }] },
      { id: "m2_q30", questionText: "Final check: Does the 28-day period end on the date of the bank statement?", options: [{ id: "m2_q30_a", text: "Yes, and the statement must be recent (within 31 days of application)", isCorrect: true }, { id: "m2_q30_b", text: "No, it ends when you get the visa", isCorrect: false }, { id: "m2_q30_c", text: "It ends at the start of the course", isCorrect: false }] }
    ]
  },
  {
    id: "module_3",
    order: 3,
    title: "Module 3: Academic, University & Course Knowledge Assessment",
    description: "Articulating course structure, modules, RQF levels, assessment methods, and university facilities.",
    passScore: 80,
    createdBy: "system",
    questions: [
      { id: "m3_q1", questionText: "Why is it important to know specific modules of your course?", options: [{ id: "m3_q1_a", text: "It proves you have researched the academic content and it aligns with your goals", isCorrect: true }, { id: "m3_q1_b", text: "It is required for graduation", isCorrect: false }, { id: "m3_q1_c", text: "The university doesn't care if you know them", isCorrect: false }] },
      { id: "m3_q2", questionText: "What does 'RQF' stand for?", options: [{ id: "m3_q2_a", text: "Regulated Qualifications Framework", isCorrect: true }, { id: "m3_q2_b", text: "Research Quality Factor", isCorrect: false }, { id: "m3_q2_c", text: "Royal Qualification Federation", isCorrect: false }] },
      { id: "m3_q3", questionText: "What is the RQF level for a standard UK Bachelor's degree?", options: [{ id: "m3_q3_a", text: "Level 6", isCorrect: true }, { id: "m3_q3_b", text: "Level 7", isCorrect: false }, { id: "m3_q3_c", text: "Level 5", isCorrect: false }] },
      { id: "m3_q4", questionText: "What is the RQF level for a standard UK Master's degree?", options: [{ id: "m3_q4_a", text: "Level 7", isCorrect: true }, { id: "m3_q4_b", text: "Level 8", isCorrect: false }, { id: "m3_q4_c", text: "Level 6", isCorrect: false }] },
      { id: "m3_q5", questionText: "How many credits are usually required for a UK Master's degree?", options: [{ id: "m3_q5_a", text: "180 credits", isCorrect: true }, { id: "m3_q5_b", text: "120 credits", isCorrect: false }, { id: "m3_q5_c", text: "360 credits", isCorrect: false }] },
      { id: "m3_q6", questionText: "Name a common assessment method in UK universities.", options: [{ id: "m3_q6_a", text: "Multiple choice only", isCorrect: false }, { id: "m3_q6_b", text: "Written assignments and dissertations", isCorrect: true }, { id: "m3_q6_c", text: "Attendance only", isCorrect: false }] },
      { id: "m3_q7", questionText: "What is a 'seminar' in the UK context?", options: [{ id: "m3_q7_a", text: "A large lecture with 200 people", isCorrect: false }, { id: "m3_q7_b", text: "A small group discussion or interactive class", isCorrect: true }, { id: "m3_q7_c", text: "A graduation ceremony", isCorrect: false }] },
      { id: "m3_q8", questionText: "Why did you choose this university specifically?", options: [{ id: "m3_q8_a", text: "It was the only one that accepted me", isCorrect: false }, { id: "m3_q8_b", text: "Focus on specific rankings, facilities, or unique modules", isCorrect: true }, { id: "m3_q8_c", text: "My friends are going there", isCorrect: false }] },
      { id: "m3_q9", questionText: "Where exactly is your campus located?", options: [{ id: "m3_q9_a", text: "In the center of London (even if it's not)", isCorrect: false }, { id: "m3_q9_b", text: "You must know the city and the specific campus area", isCorrect: true }, { id: "m3_q9_c", text: "I will find out when I arrive", isCorrect: false }] },
      { id: "m3_q10", questionText: "Which other universities did you consider?", options: [{ id: "m3_q10_a", text: "None, I only applied to one", isCorrect: false }, { id: "m3_q10_b", text: "Name 2-3 other UK universities and why this one was better", isCorrect: true }, { id: "m3_q10_c", text: "Universities in the USA", isCorrect: false }] },
      { id: "m3_q11", questionText: "What is the duration of your course?", options: [{ id: "m3_q11_a", text: "As long as it takes", isCorrect: false }, { id: "m3_q11_b", text: "Usually 1 year for Master's or 3 years for Bachelor's", isCorrect: true }, { id: "m3_q11_c", text: "6 months", isCorrect: false }] },
      { id: "m3_q12", questionText: "What is the 'ATAS' certificate?", options: [{ id: "m3_q12_a", text: "A visa application form", isCorrect: false }, { id: "m3_q12_b", text: "Academic Technology Approval Scheme for sensitive subjects", isCorrect: true }, { id: "m3_q12_c", text: "A graduation certificate", isCorrect: false }] },
      { id: "m3_q13", questionText: "Why study in the UK instead of your home country?", options: [{ id: "m3_q13_a", text: "UK degrees are shorter and globally recognized for quality", isCorrect: true }, { id: "m3_q13_b", text: "It's easier to pass", isCorrect: false }, { id: "m3_q13_c", text: "I want to live in Europe", isCorrect: false }] },
      { id: "m3_q14", questionText: "What facilities does the university offer for your course?", options: [{ id: "m3_q14_a", text: "Just a classroom", isCorrect: false }, { id: "m3_q14_b", text: "Specialized labs, libraries, or industry software", isCorrect: true }, { id: "m3_q14_c", text: "A good cafeteria", isCorrect: false }] },
      { id: "m3_q15", questionText: "Who is the current Vice-Chancellor or Head of your department?", options: [{ id: "m3_q15_a", text: "The Prime Minister", isCorrect: false }, { id: "m3_q15_b", text: "A specific academic leader at the university", isCorrect: true }, { id: "m3_q15_c", text: "My agent", isCorrect: false }] },
      { id: "m3_q16", questionText: "What is the main focus of your core module (name one)?", options: [{ id: "m3_q16_a", text: "I don't know yet", isCorrect: false }, { id: "m3_q16_b", text: "Specific learning outcomes relevant to the subject", isCorrect: true }, { id: "m3_q16_c", text: "General knowledge", isCorrect: false }] },
      { id: "m3_q17", questionText: "How will this course help you academically?", options: [{ id: "m3_q17_a", text: "It provides a foundation for a PhD or specialized knowledge", isCorrect: true }, { id: "m3_q17_b", text: "It gives me a high grade", isCorrect: false }, { id: "m3_q17_c", text: "It makes me look smart", isCorrect: false }] },
      { id: "m3_q18", questionText: "What is the teaching style in the UK?", options: [{ id: "m3_q18_a", text: "Purely memory-based", isCorrect: false }, { id: "m3_q18_b", text: "Combination of lectures, seminars, and independent study", isCorrect: true }, { id: "m3_q18_c", text: "Online only", isCorrect: false }] },
      { id: "m3_q19", questionText: "Is your course professionally accredited (e.g., ACCA, BPS)?", options: [{ id: "m3_q19_a", text: "All courses are", isCorrect: false }, { id: "m3_q19_b", text: "I must check if my specific course has professional body recognition", isCorrect: true }, { id: "m3_q19_c", text: "No", isCorrect: false }] },
      { id: "m3_q20", questionText: "What is a 'dissertation'?", options: [{ id: "m3_q20_a", text: "A final exam", isCorrect: false }, { id: "m3_q20_b", text: "A large independent research project or thesis", isCorrect: true }, { id: "m3_q20_c", text: "A letter of recommendation", isCorrect: false }] },
      { id: "m3_q21", questionText: "How many hours per week of classroom study is expected?", options: [{ id: "m3_q21_a", text: "40 hours", isCorrect: false }, { id: "m3_q21_b", text: "Check your timetable, usually 15-20 hours plus independent study", isCorrect: true }, { id: "m3_q21_c", text: "5 hours", isCorrect: false }] },
      { id: "m3_q22", questionText: "What is the 'Students' Union'?", options: [{ id: "m3_q22_a", text: "A government body", isCorrect: false }, { id: "m3_q22_b", text: "An organization that represents and supports students", isCorrect: true }, { id: "m3_q22_c", text: "A type of bank", isCorrect: false }] },
      { id: "m3_q23", questionText: "Why is the UK education system 'world-class'?", options: [{ id: "m3_q23_a", text: "Because of the QAA standards and research intensity", isCorrect: true }, { id: "m3_q23_b", text: "Because it is expensive", isCorrect: false }, { id: "m3_q23_c", text: "Because it is old", isCorrect: false }] },
      { id: "m3_q24", questionText: "What is a 'Pre-sessional English' course requirement?", options: [{ id: "m3_q24_a", text: "A course for everyone", isCorrect: false }, { id: "m3_q24_b", text: "A requirement if your IELTS score is slightly below the direct entry level", isCorrect: true }, { id: "m3_q24_c", text: "A course taken after the degree", isCorrect: false }] },
      { id: "m3_q25", questionText: "What are 'learning outcomes'?", options: [{ id: "m3_q25_a", text: "Your final grades", isCorrect: false }, { id: "m3_q25_b", text: "The skills and knowledge you are expected to gain", isCorrect: true }, { id: "m3_q25_c", text: "The books you read", isCorrect: false }] },
      { id: "m3_q26", questionText: "Where will you find the reading list for your modules?", options: [{ id: "m3_q26_a", text: "On the university's virtual learning environment (VLE)", isCorrect: true }, { id: "m3_q26_b", text: "In the local newspaper", isCorrect: false }, { id: "m3_q26_c", text: "I don't need one", isCorrect: false }] },
      { id: "m3_q27", questionText: "What is 'plagiarism'?", options: [{ id: "m3_q27_a", text: "A type of illness", isCorrect: false }, { id: "m3_q27_b", text: "Passing off someone else's work as your own", isCorrect: true }, { id: "m3_q27_c", text: "A study technique", isCorrect: false }] },
      { id: "m3_q28", questionText: "What is the 'Research Excellence Framework' (REF)?", options: [{ id: "m3_q28_a", text: "A student test", isCorrect: false }, { id: "m3_q28_b", text: "A system for assessing the quality of research in UK higher education", isCorrect: true }, { id: "m3_q28_c", text: "A scholarship", isCorrect: false }] },
      { id: "m3_q29", questionText: "Can you name the city where your university is located?", options: [{ id: "m3_q29_a", text: "Yes, and describe its general location in the UK", isCorrect: true }, { id: "m3_q29_b", text: "It doesn't matter", isCorrect: false }, { id: "m3_q29_c", text: "Somewhere in London", isCorrect: false }] },
      { id: "m3_q30", questionText: "Final check: What level is a PhD in the RQF?", options: [{ id: "m3_q30_a", text: "Level 8", isCorrect: true }, { id: "m3_q30_b", text: "Level 7", isCorrect: false }, { id: "m3_q30_c", text: "Level 9", isCorrect: false }] }
    ]
  },
  {
    id: "module_4",
    order: 4,
    title: "Module 4: Career Progression, Return Intentions & Financial Justification",
    description: "Post-study career path, ROI (Return on Investment), and tying qualifications to home-country job markets.",
    passScore: 80,
    createdBy: "system",
    questions: [
      { id: "m4_q1", questionText: "How should you justify the high cost of a UK degree?", options: [{ id: "m4_q1_a", text: "By showing the salary increase and career progression expected in your home country after graduation", isCorrect: true }, { id: "m4_q1_b", text: "By saying your parents are wealthy", isCorrect: false }, { id: "m4_q1_c", text: "By stating you will work part-time to pay it back", isCorrect: false }] },
      { id: "m4_q2", questionText: "What is your immediate plan after graduation?", options: [{ id: "m4_q2_a", text: "I will return to my home country and apply for roles at specific companies", isCorrect: true }, { id: "m4_q2_b", text: "I will look for any job in the UK to stay forever", isCorrect: false }, { id: "m4_q2_c", text: "I haven't decided yet", isCorrect: false }] },
      { id: "m4_q3", questionText: "Can you name 2-3 companies in your home country where you want to work?", options: [{ id: "m4_q3_a", text: "Yes, I have identified target employers (e.g., Bank A, Tech Co B)", isCorrect: true }, { id: "m4_q3_b", text: "No, I'll find them later", isCorrect: false }, { id: "m4_q3_c", text: "Google and Facebook only", isCorrect: false }] },
      { id: "m4_q4", questionText: "What is the expected starting salary for your target role in your home country?", options: [{ id: "m4_q4_a", text: "I must know a realistic figure based on market research", isCorrect: true }, { id: "m4_q4_b", text: "Millions of dollars", isCorrect: false }, { id: "m4_q4_c", text: "I don't know", isCorrect: false }] },
      { id: "m4_q5", questionText: "Why not stay in the UK to work permanently?", options: [{ id: "m4_q5_a", text: "My long-term career goals and family ties are in my home country", isCorrect: true }, { id: "m4_q5_b", text: "The weather is bad", isCorrect: false }, { id: "m4_q5_c", text: "I don't like the food", isCorrect: false }] },
      { id: "m4_q6", questionText: "What is the 'Graduate Route' (PSW) visa?", options: [{ id: "m4_q6_a", text: "A visa for parents", isCorrect: false }, { id: "m4_q6_b", text: "A 2-year visa allowing graduates to work or look for work in the UK", isCorrect: true }, { id: "m4_q6_c", text: "A visa for doctors", isCorrect: false }] },
      { id: "m4_q7", questionText: "If you use the Graduate Route, what is your ultimate goal?", options: [{ id: "m4_q7_a", text: "To gain international experience to enhance my career back home", isCorrect: true }, { id: "m4_q7_b", text: "To immigrate permanently", isCorrect: false }, { id: "m4_q7_c", text: "To avoid going back home", isCorrect: false }] },
      { id: "m4_q8", questionText: "How does this degree fill a 'skills gap' in your profile?", options: [{ id: "m4_q8_a", text: "It provides specialized knowledge I lack but is required for senior roles", isCorrect: true }, { id: "m4_q8_b", text: "It just adds a title to my name", isCorrect: false }, { id: "m4_q8_c", text: "It doesn't, I just want the degree", isCorrect: false }] },
      { id: "m4_q9", questionText: "What is the 'ROI' of your studies?", options: [{ id: "m4_q9_a", text: "Return on Investment; how the degree's cost is recovered through higher future earnings", isCorrect: true }, { id: "m4_q9_b", text: "Rate of Interest on my loan", isCorrect: false }, { id: "m4_q9_c", text: "Risk of Invalidation", isCorrect: false }] },
      { id: "m4_q10", questionText: "What ties do you have to your home country?", options: [{ id: "m4_q10_a", text: "Family, property, or a job offer awaiting my return", isCorrect: true }, { id: "m4_q10_b", text: "None, I want to leave", isCorrect: false }, { id: "m4_q10_c", text: "I like the movies there", isCorrect: false }] },
      { id: "m4_q11", questionText: "Why is a UK degree better for your career than a local one?", options: [{ id: "m4_q11_a", text: "Multinational companies in my country prefer candidates with international exposure", isCorrect: true }, { id: "m4_q11_b", text: "It isn't, but I want to travel", isCorrect: false }, { id: "m4_q11_c", text: "It is easier to get", isCorrect: false }] },
      { id: "m4_q12", questionText: "What if you are offered a job in the UK after graduation?", options: [{ id: "m4_q12_a", text: "I would prioritize my long-term plans in my home country", isCorrect: true }, { id: "m4_q12_b", text: "I would take it and never leave", isCorrect: false }, { id: "m4_q12_c", text: "I would ask my agent", isCorrect: false }] },
      { id: "m4_q13", questionText: "Name a specific skill you will gain that is in high demand at home.", options: [{ id: "m4_q13_a", text: "Leadership in [Field], Advanced Data Analysis, etc.", isCorrect: true }, { id: "m4_q13_b", text: "Speaking English", isCorrect: false }, { id: "m4_q13_c", text: "Writing fast", isCorrect: false }] },
      { id: "m4_q14", questionText: "How did you research the job market in your home country?", options: [{ id: "m4_q14_a", text: "LinkedIn, job portals, and talking to industry professionals", isCorrect: true }, { id: "m4_q14_b", text: "I guessed", isCorrect: false }, { id: "m4_q14_c", text: "My parents told me", isCorrect: false }] },
      { id: "m4_q15", questionText: "What is a 'study gap' and how do you explain it?", options: [{ id: "m4_q15_a", text: "A break in education; explain it with relevant work experience or personal development", isCorrect: true }, { id: "m4_q15_b", text: "A hole in your book", isCorrect: false }, { id: "m4_q15_c", text: "A secret", isCorrect: false }] },
      { id: "m4_q16", questionText: "Will you be joining a professional body in your home country?", options: [{ id: "m4_q16_a", text: "Yes, I intend to join [Body Name] which requires this degree level", isCorrect: true }, { id: "m4_q16_b", text: "No", isCorrect: false }, { id: "m4_q16_c", text: "Maybe", isCorrect: false }] },
      { id: "m4_q17", questionText: "How does this course align with your previous work experience?", options: [{ id: "m4_q17_a", text: "It provides the theoretical depth or managerial skills needed to advance", isCorrect: true }, { id: "m4_q17_b", text: "It has nothing to do with it", isCorrect: false }, { id: "m4_q17_c", text: "It is a total change of path", isCorrect: false }] },
      { id: "m4_q18", questionText: "What are your long-term career goals (5-10 years)?", options: [{ id: "m4_q18_a", text: "To reach a director or senior management level in my industry at home", isCorrect: true }, { id: "m4_q18_b", text: "To be retired", isCorrect: false }, { id: "m4_q18_c", text: "To be a student forever", isCorrect: false }] },
      { id: "m4_q19", questionText: "Is your intended career path 'logical'?", options: [{ id: "m4_q19_a", text: "Yes, it follows a clear progression from my studies to the job market", isCorrect: true }, { id: "m4_q19_b", text: "No", isCorrect: false }, { id: "m4_q19_c", text: "I hope so", isCorrect: false }] },
      { id: "m4_q20", questionText: "What current industry trend in your country makes this degree relevant?", options: [{ id: "m4_q20_a", text: "E.g., Digital transformation in banking, sustainable infrastructure, etc.", isCorrect: true }, { id: "m4_q20_b", text: "Everyone is getting degrees", isCorrect: false }, { id: "m4_q20_c", text: "I don't follow trends", isCorrect: false }] },
      { id: "m4_q21", questionText: "What is a 'red flag' in a career progression answer?", options: [{ id: "m4_q21_a", text: "Saying you want to stay in the UK because salaries are higher than at home", isCorrect: true }, { id: "m4_q21_b", text: "Saying you want to work for a top company", isCorrect: false }, { id: "m4_q21_c", text: "Saying you want to learn", isCorrect: false }] },
      { id: "m4_q22", questionText: "How will you contribute to your home country's economy?", options: [{ id: "m4_q22_a", text: "By bringing back specialized skills and global best practices", isCorrect: true }, { id: "m4_q22_b", text: "By sending money back", isCorrect: false }, { id: "m4_q22_c", text: "I won't", isCorrect: false }] },
      { id: "m4_q23", questionText: "Do you have a family business you will join?", options: [{ id: "m4_q23_a", text: "Yes/No (Be specific about your role if yes)", isCorrect: true }, { id: "m4_q23_b", text: "I don't know", isCorrect: false }, { id: "m4_q23_c", text: "My agent didn't say", isCorrect: false }] },
      { id: "m4_q24", questionText: "Why is now the right time for you to study this course?", options: [{ id: "m4_q24_a", text: "I have reached a ceiling in my current role that requires this qualification to break", isCorrect: true }, { id: "m4_q24_b", text: "I was bored", isCorrect: false }, { id: "m4_q24_c", text: "I found the money", isCorrect: false }] },
      { id: "m4_q25", questionText: "What is the reputation of your university in your home country?", options: [{ id: "m4_q25_a", text: "It is well-regarded among top-tier employers", isCorrect: true }, { id: "m4_q25_b", text: "They haven't heard of it", isCorrect: false }, { id: "m4_q25_c", text: "It is the best in the world", isCorrect: false }] },
      { id: "m4_q26", questionText: "How many people are employed in your target sector at home?", options: [{ id: "m4_q26_a", text: "Have a rough idea of the industry size and growth", isCorrect: true }, { id: "m4_q26_b", text: "None", isCorrect: false }, { id: "m4_q26_c", text: "Everyone", isCorrect: false }] },
      { id: "m4_q27", questionText: "What is your 'Plan B' if you don't get your top target job?", options: [{ id: "m4_q27_a", text: "I have identified secondary roles and companies in related sectors", isCorrect: true }, { id: "m4_q27_b", text: "I will stay in the UK", isCorrect: false }, { id: "m4_q27_c", text: "I will give up", isCorrect: false }] },
      { id: "m4_q28", questionText: "Does your home country government support this field of study?", options: [{ id: "m4_q28_a", text: "Yes, through specific initiatives or growth plans", isCorrect: true }, { id: "m4_q28_b", text: "No", isCorrect: false }, { id: "m4_q28_c", text: "I don't know", isCorrect: false }] },
      { id: "m4_q29", questionText: "Why is 'intent to return' so important to UKVI?", options: [{ id: "m4_q29_a", text: "To ensure the student route is not used for permanent migration", isCorrect: true }, { id: "m4_q29_b", text: "To make sure you don't get lost", isCorrect: false }, { id: "m4_q29_c", text: "To save space in the UK", isCorrect: false }] },
      { id: "m4_q30", questionText: "Final check: Will you leave the UK before your visa expires?", options: [{ id: "m4_q30_a", text: "Yes, absolutely, as I have clear plans at home", isCorrect: true }, { id: "m4_q30_b", text: "Maybe, if I feel like it", isCorrect: false }, { id: "m4_q30_c", text: "No", isCorrect: false }] }
    ]
  },
  {
    id: "module_5",
    order: 5,
    title: "Module 5: Interview Delivery, Common Failure Reasons & Behavioral Excellence",
    description: "Top refusal triggers, communication standards, body language, and managing technical/logistical issues.",
    passScore: 80,
    createdBy: "system",
    questions: [
      { id: "m5_q1", questionText: "Which of these is a common reason for visa refusal on credibility grounds?", options: [{ id: "m5_q1_a", text: "Lack of knowledge about the course and university", isCorrect: true }, { id: "m5_q1_b", text: "Having too much money in the bank", isCorrect: false }, { id: "m5_q1_c", text: "Applying too early", isCorrect: false }] },
      { id: "m5_q2", questionText: "How should you handle a technical glitch during a video interview?", options: [{ id: "m5_q2_a", text: "Panic and hang up", isCorrect: false }, { id: "m5_q2_b", text: "Stay calm, wait for instructions, or use the provided contact number", isCorrect: true }, { id: "m5_q2_c", text: "Ignore it and keep talking", isCorrect: false }] },
      { id: "m5_q3", questionText: "What is 'memorized' or 'scripted' behavior?", options: [{ id: "m5_q3_a", text: "Knowing your facts well", isCorrect: false }, { id: "m5_q3_b", text: "Reciting answers word-for-word from a template without personality", isCorrect: true }, { id: "m5_q3_c", text: "Speaking clearly", isCorrect: false }] },
      { id: "m5_q4", questionText: "How should your body language be during a video interview?", options: [{ id: "m5_q4_a", text: "Slumped and looking away", isCorrect: false }, { id: "m5_q4_b", text: "Upright, maintaining eye contact with the camera, and attentive", isCorrect: true }, { id: "m5_q4_c", text: "Eating or drinking", isCorrect: false }] },
      { id: "m5_q5", questionText: "Why is 'tone of voice' important?", options: [{ id: "m5_q5_a", text: "It conveys confidence and sincerity", isCorrect: true }, { id: "m5_q5_b", text: "It shows how loud you can be", isCorrect: false }, { id: "m5_q5_c", text: "It doesn't matter", isCorrect: false }] },
      { id: "m5_q6", questionText: "What should you do if the interviewer's connection is poor?", options: [{ id: "m5_q6_a", text: "Guess the question", isCorrect: false }, { id: "m5_q6_b", text: "Politely inform them that you cannot hear well and ask to repeat", isCorrect: true }, { id: "m5_q6_c", text: "Finish the interview quickly", isCorrect: false }] },
      { id: "m5_q7", questionText: "Is it okay to use notes during the interview?", options: [{ id: "m5_q7_a", text: "Yes, all of them", isCorrect: false }, { id: "m5_q7_b", text: "Generally no, it should be a natural conversation based on your own knowledge", isCorrect: true }, { id: "m5_q7_c", text: "Only if the agent says so", isCorrect: false }] },
      { id: "m5_q8", questionText: "What is a 'trigger' for a credibility follow-up?", options: [{ id: "m5_q8_a", text: "Vague or generic answers about why you chose the course", isCorrect: true }, { id: "m5_q8_b", text: "Knowing the exact tuition fee", isCorrect: false }, { id: "m5_q8_c", text: "Being polite", isCorrect: false }] },
      { id: "m5_q9", questionText: "How should you prepare your environment for the interview?", options: [{ id: "m5_q9_a", text: "Quiet, well-lit, and with a stable internet connection", isCorrect: true }, { id: "m5_q9_b", text: "In a busy cafe", isCorrect: false }, { id: "m5_q9_c", text: "In a dark room", isCorrect: false }] },
      { id: "m5_q10", questionText: "What is 'evasive' answering?", options: [{ id: "m5_q10_a", text: "Giving long answers", isCorrect: false }, { id: "m5_q10_b", text: "Avoiding the direct question or giving contradictory information", isCorrect: true }, { id: "m5_q10_c", text: "Asking for clarification", isCorrect: false }] },
      { id: "m5_q11", questionText: "Should you mention your educational agent during the interview?", options: [{ id: "m5_q11_a", text: "Say they did everything for you", isCorrect: false }, { id: "m5_q11_b", text: "Be honest, but show that YOU made the final decisions and research", isCorrect: true }, { id: "m5_q11_c", text: "Don't mention them at all", isCorrect: false }] },
      { id: "m5_q12", questionText: "What is the '30-second rule' for answers?", options: [{ id: "m5_q12_a", text: "Never speak for more than 30 seconds", isCorrect: false }, { id: "m5_q12_b", text: "Aim to be concise but detailed enough to answer the prompt fully", isCorrect: true }, { id: "m5_q12_c", text: "Wait 30 seconds before answering", isCorrect: false }] },
      { id: "m5_q13", questionText: "What is 'English Language Refusal'?", options: [{ id: "m5_q13_a", text: "Refusal because you don't have an IELTS certificate", isCorrect: false }, { id: "m5_q13_b", text: "Refusal because you couldn't communicate effectively during the interview", isCorrect: true }, { id: "m5_q13_c", text: "Refusal because of your accent", isCorrect: false }] },
      { id: "m5_q14", questionText: "How should you dress for the interview?", options: [{ id: "m5_q14_a", text: "Pyjamas", isCorrect: false }, { id: "m5_q14_b", text: "Smart-casual or professional, as if it were a job interview", isCorrect: true }, { id: "m5_q14_c", text: "A costume", isCorrect: false }] },
      { id: "m5_q15", questionText: "What is the risk of 'contradicting' your CAS?", options: [{ id: "m5_q15_a", text: "It shows you don't know your own application and raises suspicion", isCorrect: true }, { id: "m5_q15_b", text: "Nothing, people forget things", isCorrect: false }, { id: "m5_q15_c", text: "The officer will correct you", isCorrect: false }] },
      { id: "m5_q16", questionText: "What if you are asked a question you don't know the answer to?", options: [{ id: "m5_q16_a", text: "Lie", isCorrect: false }, { id: "m5_q16_b", text: "Be honest, explain why you don't know, and provide related information you DO know", isCorrect: true }, { id: "m5_q16_c", text: "Cry", isCorrect: false }] },
      { id: "m5_q17", questionText: "Why shouldn't you have someone else in the room with you?", options: [{ id: "m5_q17_a", text: "It might look like you are being coached or prompted", isCorrect: true }, { id: "m5_q17_b", text: "There isn't enough space", isCorrect: false }, { id: "m5_q17_c", text: "It's a secret interview", isCorrect: false }] },
      { id: "m5_q18", questionText: "What is a 'secondary' interview?", options: [{ id: "m5_q18_a", text: "An interview for a second visa", isCorrect: false }, { id: "m5_q18_b", text: "An follow-up interview if the first one was inconclusive", isCorrect: true }, { id: "m5_q18_c", text: "An interview with the university", isCorrect: false }] },
      { id: "m5_q19", questionText: "How should you handle 'nerves'?", options: [{ id: "m5_q19_a", text: "Take deep breaths and focus on your passion for the subject", isCorrect: true }, { id: "m5_q19_b", text: "Take a sedative", isCorrect: false }, { id: "m5_q19_c", text: "Cancel the interview", isCorrect: false }] },
      { id: "m5_q20", questionText: "What is the 'Genuine Student' mindset?", options: [{ id: "m5_q20_a", text: "Focusing on how to get a job in the UK", isCorrect: false }, { id: "m5_q20_b", text: "Focusing on how the study will benefit your future in your home country", isCorrect: true }, { id: "m5_q20_c", text: "Focusing on the shortest way to get a visa", isCorrect: false }] },
      { id: "m5_q21", questionText: "Should you 'overshare' personal problems?", options: [{ id: "m5_q21_a", text: "Yes, to get sympathy", isCorrect: false }, { id: "m5_q21_b", text: "No, keep the focus on your academic and career goals", isCorrect: true }, { id: "m5_q21_c", text: "Only if asked", isCorrect: false }] },
      { id: "m5_q22", questionText: "What is 'independent thought' in an interview?", options: [{ id: "m5_q22_a", text: "Ignoring the questions", isCorrect: false }, { id: "m5_q22_b", text: "Forming your own opinions based on your research", isCorrect: true }, { id: "m5_q22_c", text: "Repeating what your friend said", isCorrect: false }] },
      { id: "m5_q23", questionText: "Can you ask the interviewer for their opinion?", options: [{ id: "m5_q23_a", text: "Yes", isCorrect: false }, { id: "m5_q23_b", text: "No, it's not a social chat; keep it professional", isCorrect: true }, { id: "m5_q23_c", text: "Only at the end", isCorrect: false }] },
      { id: "m5_q24", questionText: "What is the 'final impression' you should leave?", options: [{ id: "m5_q24_a", text: "That you are desperate to travel", isCorrect: false }, { id: "m5_q24_b", text: "That you are a bright, focused, and credible student", isCorrect: true }, { id: "m5_q24_c", text: "That you are rich", isCorrect: false }] },
      { id: "m5_q25", questionText: "What if the interviewer is unfriendly?", options: [{ id: "m5_q25_a", text: "Be rude back", isCorrect: false }, { id: "m5_q25_b", text: "Maintain your professionalism and remain polite and clear", isCorrect: true }, { id: "m5_q25_c", text: "Stop answering", isCorrect: false }] },
      { id: "m5_q26", questionText: "Is the interview a test of your intelligence?", options: [{ id: "m5_q26_a", text: "Yes", isCorrect: false }, { id: "m5_q26_b", text: "It's an assessment of your intentions and credibility as a student", isCorrect: true }, { id: "m5_q26_c", text: "No, it's a test of memory", isCorrect: false }] },
      { id: "m5_q27", questionText: "What is 'transparency'?", options: [{ id: "m5_q27_a", text: "Being honest about your background and intentions", isCorrect: true }, { id: "m5_q27_b", text: "Being invisible", isCorrect: false }, { id: "m5_q27_c", text: "Hiding your mistakes", isCorrect: false }] },
      { id: "m5_q28", questionText: "Should you check your email for the interview link?", options: [{ id: "m5_q28_a", text: "Yes, and check the spam folder too", isCorrect: true }, { id: "m5_q28_b", text: "No, they will call you", isCorrect: false }, { id: "m5_q28_c", text: "The agent will handle it", isCorrect: false }] },
      { id: "m5_q29", questionText: "What is a 'logistical' refusal?", options: [{ id: "m5_q29_a", text: "Refusal due to poor internet", isCorrect: false }, { id: "m5_q29_b", text: "Refusal due to failing to attend or provide requested follow-up info", isCorrect: true }, { id: "m5_q29_c", text: "Refusal due to travel bans", isCorrect: false }] },
      { id: "m5_q30", questionText: "Final check: Who is the most important person in this process?", options: [{ id: "m5_q30_a", text: "Your educational agent", isCorrect: false }, { id: "m5_q30_b", text: "YOU (The student)", isCorrect: true }, { id: "m5_q30_c", text: "The visa officer", isCorrect: false }] }
    ]
  }
];

// ── Default Question Packs (seeded by Admin via System tab) ───────────────
const DEFAULT_PACKS: Omit<QuestionPack, "createdAt" | "updatedAt">[] = [
  {
    id: "default-pack-ukvi-compliance",
    title: "UKVI General & Financial Compliance Drill",
    description: "Master the key UKVI rules, financial requirements, and student visa conditions every applicant must know before their interview.",
    category: "General Compliance / Financial",
    passScore: 80,
    isDefault: true,
    createdBy: "system",
    questions: [
      { id: "q1", questionText: "What is the maximum allowed weekly work hours for international students during term time?", options: [{ id: "a", text: "20 hours per week", isCorrect: true }, { id: "b", text: "40 hours per week", isCorrect: false }, { id: "c", text: "10 hours per week", isCorrect: false }, { id: "d", text: "Unlimited hours", isCorrect: false }] },
      { id: "q2", questionText: "How long must maintenance funds be held in a bank account before your visa application?", options: [{ id: "a", text: "28 consecutive days", isCorrect: true }, { id: "b", text: "14 days", isCorrect: false }, { id: "c", text: "60 days", isCorrect: false }, { id: "d", text: "3 months", isCorrect: false }] },
      { id: "q3", questionText: "According to UKVI rules, who is officially permitted to act as your financial sponsor without requiring special legal documentation?", options: [{ id: "a", text: "Myself, my parents, or my legal guardians", isCorrect: true }, { id: "b", text: "My uncle or aunt", isCorrect: false }, { id: "c", text: "A family friend residing in the UK", isCorrect: false }, { id: "d", text: "Any relative with enough money", isCorrect: false }] },
      { id: "q4", questionText: "Can you rely on part-time work in the UK to pay your remaining tuition fee balance?", options: [{ id: "a", text: "No, I must prove I have the full funds available before I travel", isCorrect: true }, { id: "b", text: "Yes, as long as I work 20 hours a week", isCorrect: false }, { id: "c", text: "Yes, if I find a high-paying job", isCorrect: false }, { id: "d", text: "Yes, but only during the holidays", isCorrect: false }] },
      { id: "q5", questionText: "What is the Immigration Health Surcharge (IHS)?", options: [{ id: "a", text: "A mandatory fee paid during the visa application to access the UK National Health Service (NHS)", isCorrect: true }, { id: "b", text: "A private health insurance plan I must buy from my university", isCorrect: false }, { id: "c", text: "A tax taken out of my part-time wages", isCorrect: false }, { id: "d", text: "A fee paid at the airport upon arrival", isCorrect: false }] },
      { id: "q6", questionText: "If your bank statements are not in English, what must you do before submitting them to UKVI?", options: [{ id: "a", text: "Provide a fully certified translation by a professional translator", isCorrect: true }, { id: "b", text: "Translate them myself and sign the bottom", isCorrect: false }, { id: "c", text: "Ask the university to translate them", isCorrect: false }, { id: "d", text: "Submit them as they are; UKVI will translate them", isCorrect: false }] },
      { id: "q7", questionText: "Are you permitted to claim \"Public Funds\" while on a Student Visa?", options: [{ id: "a", text: "No, claiming public funds is a breach of visa conditions", isCorrect: true }, { id: "b", text: "Yes, if I cannot find a part-time job", isCorrect: false }, { id: "c", text: "Yes, but only after living in the UK for 6 months", isCorrect: false }, { id: "d", text: "Yes, but only during the holidays", isCorrect: false }] },
      { id: "q8", questionText: "If you are applying to study a master's degree, can you bring your spouse or children as dependants?", options: [{ id: "a", text: "Generally no, unless it is a PhD, doctoral qualification, or a research-based higher degree", isCorrect: true }, { id: "b", text: "Yes, all master's students can bring dependants", isCorrect: false }, { id: "c", text: "Yes, if I pay an extra fee", isCorrect: false }, { id: "d", text: "No, international students can never bring dependants", isCorrect: false }] },
      { id: "q9", questionText: "What happens if you drop below the required attendance level for your course?", options: [{ id: "a", text: "The university is legally obligated to report me to UKVI, which may result in visa cancellation", isCorrect: true }, { id: "b", text: "The university will just give me a warning", isCorrect: false }, { id: "c", text: "I will have to pay a fine to the university", isCorrect: false }, { id: "d", text: "Nothing, as long as I pass my final exams", isCorrect: false }] },
      { id: "q10", questionText: "Can you set up your own business or act as a sole trader while on a Student Visa?", options: [{ id: "a", text: "No, self-employment and business activity are strictly prohibited", isCorrect: true }, { id: "b", text: "Yes, as long as it does not interfere with my studies", isCorrect: false }, { id: "c", text: "Yes, but only online businesses", isCorrect: false }, { id: "d", text: "Yes, if I register the business in my home country", isCorrect: false }] },
      { id: "q11", questionText: "When calculating your maintenance funds, what exchange rate does UKVI use?", options: [{ id: "a", text: "OANDA on the date of your visa application", isCorrect: true }, { id: "b", text: "The exchange rate on the day the money was deposited", isCorrect: false }, { id: "c", text: "The black market/parallel market rate", isCorrect: false }, { id: "d", text: "The rate provided by my local bank", isCorrect: false }] },
      { id: "q12", questionText: "If a UKVI officer suspects your funds are not genuinely available to you, what can they do?", options: [{ id: "a", text: "They can request the source of funds or refuse the visa on credibility grounds", isCorrect: true }, { id: "b", text: "Nothing, as long as it was there for 28 days", isCorrect: false }, { id: "c", text: "They will call my bank and seize the money", isCorrect: false }, { id: "d", text: "They will approve it but monitor my UK bank account", isCorrect: false }] },
      { id: "q13", questionText: "What is a CAS, and how long is it valid for after being issued?", options: [{ id: "a", text: "Confirmation of Acceptance for Studies; it is valid for 6 months", isCorrect: true }, { id: "b", text: "Certificate of Academic Status; it is valid for 1 year", isCorrect: false }, { id: "c", text: "Confirmation of Acceptance for Studies; it is valid for 3 months", isCorrect: false }, { id: "d", text: "College Admission Statement; it does not expire", isCorrect: false }] },
      { id: "q14", questionText: "Are you allowed to work full-time hours (up to 40 hours) under any circumstances?", options: [{ id: "a", text: "Yes, but strictly only outside of official university term times (e.g., during summer holidays)", isCorrect: true }, { id: "b", text: "No, I can never work more than 20 hours", isCorrect: false }, { id: "c", text: "Yes, if I need extra money to pay tuition", isCorrect: false }, { id: "d", text: "Yes, during my first semester", isCorrect: false }] },
      { id: "q15", questionText: "If your CAS states you have paid a £3,000 deposit, but your total tuition is £15,000, how much must you show in your bank account for tuition?", options: [{ id: "a", text: "£12,000", isCorrect: true }, { id: "b", text: "£15,000", isCorrect: false }, { id: "c", text: "£3,000", isCorrect: false }, { id: "d", text: "Nothing, the deposit is enough", isCorrect: false }] },
      { id: "q16", questionText: "What is a BRP and when must you collect it?", options: [{ id: "a", text: "Biometric Residence Permit; usually within 10 days of arriving in the UK", isCorrect: true }, { id: "b", text: "British Residency Passport; at the airport", isCorrect: false }, { id: "c", text: "Border Registration Paper; before leaving my home country", isCorrect: false }, { id: "d", text: "Biometric Residence Permit; anytime during my first year", isCorrect: false }] },
      { id: "q17", questionText: "If you decide you do not like your course after arriving in the UK, can you easily switch to a lower-level course?", options: [{ id: "a", text: "No, this usually requires leaving the UK and applying for a new visa", isCorrect: true }, { id: "b", text: "Yes, I just need to tell the university", isCorrect: false }, { id: "c", text: "Yes, as long as it is at the same university", isCorrect: false }, { id: "d", text: "Yes, I can switch at any time without notifying UKVI", isCorrect: false }] },
      { id: "q18", questionText: "What is the ATAS certificate?", options: [{ id: "a", text: "Academic Technology Approval Scheme; required for certain sensitive science and engineering courses", isCorrect: true }, { id: "b", text: "A mandatory English test for all students", isCorrect: false }, { id: "c", text: "A certificate proving my financial status", isCorrect: false }, { id: "d", text: "A medical clearance document", isCorrect: false }] },
      { id: "q19", questionText: "Can you use a company bank account (e.g., your parent's business account) as proof of maintenance funds?", options: [{ id: "a", text: "No, the funds must be in a personal bank account", isCorrect: true }, { id: "b", text: "Yes, as long as my parent owns the business", isCorrect: false }, { id: "c", text: "Yes, if the business has a high turnover", isCorrect: false }, { id: "d", text: "Yes, but only for postgraduate students", isCorrect: false }] },
      { id: "q20", questionText: "What is the consequence of providing a fraudulent document (e.g., a fake bank statement) to UKVI?", options: [{ id: "a", text: "Automatic visa refusal and a possible 10-year ban from entering the UK", isCorrect: true }, { id: "b", text: "They will just ask me to provide a real one", isCorrect: false }, { id: "c", text: "My university will cancel my CAS but I can apply again", isCorrect: false }, { id: "d", text: "I will get a warning letter", isCorrect: false }] },
    ],
  },
  {
    id: "default-pack-academic-intent",
    title: "Academic Intent & University Knowledge",
    description: "Demonstrate detailed knowledge of your specific course, university, and academic goals. Pass mark is 100% — you must know these perfectly.",
    category: "University Specific / Academic",
    passScore: 100,
    isDefault: true,
    createdBy: "system",
    questions: [
      { id: "q1", questionText: "When asked \"Why did you choose this specific university?\", which is the most acceptable approach for a UKVI interview?", options: [{ id: "a", text: "Mentioning specific research facilities, unique course modules, or industry connections specific to the university", isCorrect: true }, { id: "b", text: "Stating that the university is highly ranked on Google", isCorrect: false }, { id: "c", text: "Saying it was the only university that gave an admission offer", isCorrect: false }, { id: "d", text: "Mentioning that the city is beautiful and has a good football team", isCorrect: false }] },
      { id: "q2", questionText: "Why did you choose to study this course in the UK instead of your home country?", options: [{ id: "a", text: "The UK offers a specialized 1-year master's blending theory with practical application not available locally", isCorrect: true }, { id: "b", text: "The education system in my home country is bad", isCorrect: false }, { id: "c", text: "I want to experience living in Europe", isCorrect: false }, { id: "d", text: "It is easier to pass exams in the UK", isCorrect: false }] },
      { id: "q3", questionText: "If the interviewer asks about your accommodation, what information must you provide?", options: [{ id: "a", text: "The exact address, the cost, the distance from the campus, and how I plan to commute", isCorrect: true }, { id: "b", text: "Just the name of the city", isCorrect: false }, { id: "c", text: "That I will look for a place when I arrive", isCorrect: false }, { id: "d", text: "That I will stay with a friend on a sofa temporarily", isCorrect: false }] },
      { id: "q4", questionText: "How should you answer if asked: \"Did you consider any other universities?\"", options: [{ id: "a", text: "Name 2-3 other specific UK universities you researched, and explain why your chosen university is better for your specific goals", isCorrect: true }, { id: "b", text: "\"No, this was the only one my agent recommended.\"", isCorrect: false }, { id: "c", text: "\"Yes, I applied to 10 random universities and this one replied first.\"", isCorrect: false }, { id: "d", text: "\"No, I only wanted to go to this specific city.\"", isCorrect: false }] },
      { id: "q5", questionText: "What level of qualification will you achieve upon completing a standard UK Master's degree?", options: [{ id: "a", text: "RQF Level 7", isCorrect: true }, { id: "b", text: "RQF Level 6", isCorrect: false }, { id: "c", text: "RQF Level 8", isCorrect: false }, { id: "d", text: "A diploma", isCorrect: false }] },
      { id: "q6", questionText: "If asked to name the modules you will be studying, how many should you comfortably be able to discuss?", options: [{ id: "a", text: "At least 3 to 4 core modules, explaining what they cover and why they interest me", isCorrect: true }, { id: "b", text: "None, I will learn what they are when I get there", isCorrect: false }, { id: "c", text: "I just need to say \"Management\" or \"Business\"", isCorrect: false }, { id: "d", text: "I only need to know the name of my final project", isCorrect: false }] },
      { id: "q7", questionText: "How will your course be assessed?", options: [{ id: "a", text: "I must state the specific breakdown for my course (e.g., a mix of coursework, written exams, presentations, and a final dissertation)", isCorrect: true }, { id: "b", text: "Mostly multiple-choice tests", isCorrect: false }, { id: "c", text: "Just attendance and participation", isCorrect: false }, { id: "d", text: "I don't know, it depends on the professor", isCorrect: false }] },
      { id: "q8", questionText: "Why didn't you choose to study in the USA, Canada, or Australia?", options: [{ id: "a", text: "UK Master's degrees are generally 1 year long, making them more cost-effective and allowing faster entry into the workforce", isCorrect: true }, { id: "b", text: "The visas for those countries are too hard to get", isCorrect: false }, { id: "c", text: "The flights to the UK are cheaper", isCorrect: false }, { id: "d", text: "I have relatives in the UK", isCorrect: false }] },
      { id: "q9", questionText: "If you have a \"study gap\", how must you explain it?", options: [{ id: "a", text: "By detailing my relevant work experience, professional growth, or business ventures during that time", isCorrect: true }, { id: "b", text: "Say I was just resting and doing nothing", isCorrect: false }, { id: "c", text: "Refuse to answer as it is personal", isCorrect: false }, { id: "d", text: "Say I was trying to save money because I was broke", isCorrect: false }] },
      { id: "q10", questionText: "What is a \"Pre-sessional English\" course?", options: [{ id: "a", text: "A short course taken before the main degree to improve academic English skills to the required university standard", isCorrect: true }, { id: "b", text: "A course where I learn about British culture", isCorrect: false }, { id: "c", text: "A mandatory course for all international students, even if they speak perfect English", isCorrect: false }, { id: "d", text: "A tour of the university campus", isCorrect: false }] },
      { id: "q11", questionText: "Does your chosen course offer professional accreditation (e.g., ACCA, RIBA, BPS)?", options: [{ id: "a", text: "I must know exactly if my course has accreditation, what body provides it, and how it helps my career", isCorrect: true }, { id: "b", text: "Accreditation doesn't matter for international students", isCorrect: false }, { id: "c", text: "All UK degrees are automatically accredited by the government", isCorrect: false }, { id: "d", text: "I will find out after I graduate", isCorrect: false }] },
      { id: "q12", questionText: "Who is the Vice-Chancellor or the Head of Department for your course?", options: [{ id: "a", text: "I should have researched the names of key faculty members, especially my course leader or head of department", isCorrect: true }, { id: "b", text: "I don't need to know any staff names", isCorrect: false }, { id: "c", text: "The Prime Minister of the UK", isCorrect: false }, { id: "d", text: "My educational agent", isCorrect: false }] },
      { id: "q13", questionText: "What is the difference between a lecture and a seminar in a UK university?", options: [{ id: "a", text: "A lecture is a large presentation by a professor, while a seminar is a smaller, interactive group discussion", isCorrect: true }, { id: "b", text: "They are exactly the same thing", isCorrect: false }, { id: "c", text: "A lecture is online, a seminar is in person", isCorrect: false }, { id: "d", text: "Seminars are only for postgraduate students", isCorrect: false }] },
      { id: "q14", questionText: "Where exactly is your university campus located?", options: [{ id: "a", text: "I must know the specific city, the campus name/location, and general geography", isCorrect: true }, { id: "b", text: "\"In London.\" (Even if it is actually in Scotland)", isCorrect: false }, { id: "c", text: "\"In the UK.\"", isCorrect: false }, { id: "d", text: "My agent knows the address, I will ask them", isCorrect: false }] },
      { id: "q15", questionText: "How did you first find out about this university?", options: [{ id: "a", text: "Through independent research online, attending an education fair, or reading specific academic journals", isCorrect: true }, { id: "b", text: "\"My agent did everything, I just signed the forms.\"", isCorrect: false }, { id: "c", text: "\"I saw an ad on Instagram.\"", isCorrect: false }, { id: "d", text: "\"My friend went there so I copied them.\"", isCorrect: false }] },
      { id: "q16", questionText: "If your previous degree is completely unrelated to your new Master's, how do you justify it?", options: [{ id: "a", text: "Explain how my career goals have shifted, supported by recent work experience in the new field that requires this specific academic upgrade", isCorrect: true }, { id: "b", text: "Say I just got bored of my old subject", isCorrect: false }, { id: "c", text: "Say this was the easiest course to get accepted into", isCorrect: false }, { id: "d", text: "Say it doesn't matter because it's just a degree", isCorrect: false }] },
      { id: "q17", questionText: "How many credits are required to complete a standard UK Master's degree?", options: [{ id: "a", text: "180 credits (usually 120 for taught modules and 60 for the dissertation)", isCorrect: true }, { id: "b", text: "120 credits", isCorrect: false }, { id: "c", text: "360 credits", isCorrect: false }, { id: "d", text: "It depends on how much tuition I pay", isCorrect: false }] },
      { id: "q18", questionText: "What facilities does your chosen university have that will specifically aid your studies?", options: [{ id: "a", text: "I should name specific facilities like a 24/7 library, specialized engineering labs, Bloomberg terminals, or media studios relevant to my course", isCorrect: true }, { id: "b", text: "A big cafeteria", isCorrect: false }, { id: "c", text: "A nice gym and sports center", isCorrect: false }, { id: "d", text: "Free Wi-Fi", isCorrect: false }] },
      { id: "q19", questionText: "What will your final dissertation or major project likely focus on?", options: [{ id: "a", text: "I should have a rough proposal or topic in mind that aligns with my home country's industry needs and my future career goals", isCorrect: true }, { id: "b", text: "Whatever the professor tells me to write", isCorrect: false }, { id: "c", text: "Something easy so I can pass quickly", isCorrect: false }, { id: "d", text: "I'm not going to do a dissertation", isCorrect: false }] },
      { id: "q20", questionText: "What is the primary teaching method for your course?", options: [{ id: "a", text: "I should know the balance of independent study, lectures, and practical workshops as outlined on the course webpage", isCorrect: true }, { id: "b", text: "100% memorization from textbooks", isCorrect: false }, { id: "c", text: "Just listening to the teacher talk all day", isCorrect: false }, { id: "d", text: "Group work with my friends", isCorrect: false }] },
    ],
  },
  {
    id: "default-pack-career-intent",
    title: "Career Progression & Genuine Intent (ROI)",
    description: "Demonstrate clear career plans, genuine reasons for studying abroad, and a compelling return-home narrative to satisfy UKVI intent requirements.",
    category: "Career Plans / Genuine Student",
    passScore: 80,
    isDefault: true,
    createdBy: "system",
    questions: [
      { id: "q1", questionText: "What is the best way to explain your immediate plans after graduating from this UK university?", options: [{ id: "a", text: "I will return to my home country to apply for specific roles (e.g., Senior Data Analyst) at target companies (e.g., MTN, KPMG)", isCorrect: true }, { id: "b", text: "I will look for any available job in the UK to get a work visa", isCorrect: false }, { id: "c", text: "I haven't decided yet, I will see what happens after I graduate", isCorrect: false }, { id: "d", text: "I want to stay in the UK because the economy is better", isCorrect: false }] },
      { id: "q2", questionText: "How do you justify the high financial cost of this UK degree as a good investment?", options: [{ id: "a", text: "By demonstrating how the expected starting salary for my target role back home will allow me to recoup the tuition costs over a realistic timeframe (e.g., 3-5 years)", isCorrect: true }, { id: "b", text: "By saying my parents are rich so the cost doesn't matter to me", isCorrect: false }, { id: "c", text: "By stating that UK degrees automatically guarantee jobs everywhere in the world", isCorrect: false }, { id: "d", text: "By explaining that I will make the money back working part-time in the UK while studying", isCorrect: false }] },
      { id: "q3", questionText: "What specific ties do you have to your home country that will ensure your return after graduation?", options: [{ id: "a", text: "Strong family ties, property/assets, or a concrete job offer/leave of absence from my current employer awaiting my return", isCorrect: true }, { id: "b", text: "I just like my home country's food better", isCorrect: false }, { id: "c", text: "I don't like the cold weather in the UK", isCorrect: false }, { id: "d", text: "My student visa will expire so I have to leave anyway", isCorrect: false }] },
      { id: "q4", questionText: "If the interviewer asks about your expected starting salary in your home country after graduation, how should you answer?", options: [{ id: "a", text: "I must state a specific, realistic figure in my local currency, based on actual job market research I have done", isCorrect: true }, { id: "b", text: "\"I will earn millions because I have a UK degree.\"", isCorrect: false }, { id: "c", text: "\"I don't know, whatever the company decides to pay me.\"", isCorrect: false }, { id: "d", text: "\"I will be paid in British Pounds even when I return home.\"", isCorrect: false }] },
      { id: "q5", questionText: "How should you answer if the interviewer asks: \"What if you get a high-paying job offer in the UK after graduation?\"", options: [{ id: "a", text: "State that while UK experience is valuable, my long-term career goals, family ties, and primary target industries are rooted in my home country", isCorrect: true }, { id: "b", text: "\"I would definitely accept it and stay in the UK forever.\"", isCorrect: false }, { id: "c", text: "\"I would take it because salaries back home are too low.\"", isCorrect: false }, { id: "d", text: "\"I don't want to work in the UK at all.\"", isCorrect: false }] },
      { id: "q6", questionText: "If you are currently employed, how does this Master's degree relate to your current job?", options: [{ id: "a", text: "It will bridge a specific skills gap, allowing me to secure a promotion to a managerial or senior specialist role upon my return", isCorrect: true }, { id: "b", text: "It has nothing to do with my job, I just wanted a break from working", isCorrect: false }, { id: "c", text: "My boss forced me to do it", isCorrect: false }, { id: "d", text: "I want to use it to get a completely different job in the UK", isCorrect: false }] },
      { id: "q7", questionText: "Why is a degree from this specific UK university better than getting the exact same degree from a university in your home country?", options: [{ id: "a", text: "It offers global industry perspectives, specialized modules not taught locally, and is highly preferred by top multinational employers in my country", isCorrect: true }, { id: "b", text: "The universities in my home country are terrible and always on strike", isCorrect: false }, { id: "c", text: "Because a UK degree looks fancier on my CV", isCorrect: false }, { id: "d", text: "Because it is easier to pass exams in the UK", isCorrect: false }] },
      { id: "q8", questionText: "If you state that you want to start your own business after graduating, what follow-up information MUST you be able to provide?", options: [{ id: "a", text: "A clear business plan, target market research, and an explanation of how I will fund the startup capital", isCorrect: true }, { id: "b", text: "Just the name of the company I want to create", isCorrect: false }, { id: "c", text: "I just need to say I want to be a CEO", isCorrect: false }, { id: "d", text: "I will figure out the details after I graduate", isCorrect: false }] },
      { id: "q9", questionText: "Can you name 2 or 3 specific companies in your home country that you will apply to after graduation?", options: [{ id: "a", text: "Yes, I have researched specific companies (e.g., Zenith Bank, Shell, PwC) that actively recruit graduates with my specific skill set", isCorrect: true }, { id: "b", text: "No, I will apply to whatever is available", isCorrect: false }, { id: "c", text: "I will only apply to companies in London", isCorrect: false }, { id: "d", text: "I don't know the names of any companies yet", isCorrect: false }] },
      { id: "q10", questionText: "What are your long-term career goals (5 to 10 years from now)?", options: [{ id: "a", text: "To hold a senior leadership/director position in my industry, or to have successfully scaled my own specialized consultancy/business back home", isCorrect: true }, { id: "b", text: "To be retired and rich", isCorrect: false }, { id: "c", text: "To have a British passport", isCorrect: false }, { id: "d", text: "To still be looking for a job", isCorrect: false }] },
      { id: "q11", questionText: "How exactly will the specific modules on your course help you in your daily work tasks when you get a job?", options: [{ id: "a", text: "I can link specific modules (e.g., \"Advanced Data Modeling\") to specific tasks I will perform (e.g., \"Predicting consumer trends for my target employer\")", isCorrect: true }, { id: "b", text: "They just give me general knowledge", isCorrect: false }, { id: "c", text: "I will only use the skills to pass the university exams", isCorrect: false }, { id: "d", text: "The modules don't matter, only the final certificate matters", isCorrect: false }] },
      { id: "q12", questionText: "If the interviewer asks about the UK Graduate Route (Post-Study Work Visa), how should you approach it?", options: [{ id: "a", text: "If I plan to use it, I must explain that it is strictly to gain short-term international experience before returning home to achieve my primary career goals", isCorrect: true }, { id: "b", text: "Say it is my main reason for choosing the UK so I can immigrate", isCorrect: false }, { id: "c", text: "Say I plan to use it to pay back the loan I took for my tuition", isCorrect: false }, { id: "d", text: "Say I will use it to bring my extended family to the UK", isCorrect: false }] },
      { id: "q13", questionText: "What is your \"Backup Plan\" if you cannot get a job at your top target companies?", options: [{ id: "a", text: "I have researched secondary companies, alternative roles in related industries, or specialized graduate trainee programs in my home country", isCorrect: true }, { id: "b", text: "I don't have a backup plan, I will just stay in the UK", isCorrect: false }, { id: "c", text: "I will just apply for another Master's degree", isCorrect: false }, { id: "d", text: "I will give up and stay at home", isCorrect: false }] },
      { id: "q14", questionText: "What professional body or regulatory association will you join in your home country after getting this degree?", options: [{ id: "a", text: "I must name the specific local professional body relevant to my field (e.g., ICAN, COREN, NIM) that this degree will help me enter", isCorrect: true }, { id: "b", text: "I don't need to join any professional bodies", isCorrect: false }, { id: "c", text: "I will only join UK professional bodies", isCorrect: false }, { id: "d", text: "I don't know any professional bodies", isCorrect: false }] },
      { id: "q15", questionText: "How did you research the job market and salaries in your home country?", options: [{ id: "a", text: "By checking local job boards (e.g., LinkedIn, Jobberman), speaking to industry professionals, and analyzing current market trends", isCorrect: true }, { id: "b", text: "I just guessed the salary", isCorrect: false }, { id: "c", text: "My parents told me what I would earn", isCorrect: false }, { id: "d", text: "My educational agent gave me a random figure", isCorrect: false }] },
      { id: "q16", questionText: "Why are you spending £15,000+ on a degree when the starting salary in your home country might only be the equivalent of £3,000 a year?", options: [{ id: "a", text: "I must explain the long-term trajectory: while the starting salary might seem low compared to the UK, the degree accelerates my promotion path, leading to high-tier local salaries within 3-5 years", isCorrect: true }, { id: "b", text: "I didn't think about the math, I just want to travel", isCorrect: false }, { id: "c", text: "Because I actually plan to work in the UK to pay it off", isCorrect: false }, { id: "d", text: "The money is my parents' problem, not mine", isCorrect: false }] },
      { id: "q17", questionText: "If your previous work experience is unrelated to your new degree, how do you explain your career switch?", options: [{ id: "a", text: "By explaining a genuine \"trigger point\" or realization in my recent career that made me passionate about the new field, and showing I have researched what this new career entails", isCorrect: true }, { id: "b", text: "Say I just got bored and wanted to try something new", isCorrect: false }, { id: "c", text: "Say the new field pays more money, even though I know nothing about it", isCorrect: false }, { id: "d", text: "Say my agent told me this was an easy course", isCorrect: false }] },
      { id: "q18", questionText: "What current industry trend in your home country makes your chosen degree highly relevant right now?", options: [{ id: "a", text: "I must be able to discuss a specific current event, economic shift, or technological gap in my home country that my degree will help solve", isCorrect: true }, { id: "b", text: "There are no specific trends, I just want a degree", isCorrect: false }, { id: "c", text: "Everything in my country is perfect, I just want to study", isCorrect: false }, { id: "d", text: "I only follow UK industry trends", isCorrect: false }] },
      { id: "q19", questionText: "How will the university's alumni network help you with your career goals?", options: [{ id: "a", text: "I can connect with alumni from my home country who have successfully transitioned into the local industries I am targeting", isCorrect: true }, { id: "b", text: "It will help me find a wife/husband", isCorrect: false }, { id: "c", text: "They can lend me money to start a business", isCorrect: false }, { id: "d", text: "Alumni networks don't actually do anything", isCorrect: false }] },
      { id: "q20", questionText: "Ultimately, what is the single most important thing the UKVI interviewer needs to believe about you by the end of the interview?", options: [{ id: "a", text: "That I am a genuine student with clear, well-researched intentions to study, and that I have compelling reasons to leave the UK at the end of my visa", isCorrect: true }, { id: "b", text: "That I have a lot of money in my bank account", isCorrect: false }, { id: "c", text: "That I speak perfect English", isCorrect: false }, { id: "d", text: "That I love British culture and the Royal Family", isCorrect: false }] },
    ],
  },
];

function Tab({ isActive, label, onClick }: { isActive: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`px-6 py-3 font-bold text-sm transition-all relative ${
        isActive
          ? "text-[#1a73e8] dark:text-blue-400"
          : "text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white"
      }`}
      onClick={onClick}
    >
      {label}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1a73e8] dark:bg-blue-400 rounded-t-full animate-in fade-in slide-in-from-bottom-1" />
      )}
    </button>
  );
}

export default function SettingsPage() {
  const { user, userProfile, userId, role, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && role !== "Counselor" && role !== "Admin" && role !== "Super Admin") {
      router.push("/dashboard");
    }
  }, [role, authLoading, router]);

  const [activeTab, setActiveTab] = useState<number>(0);
  const [settings, setSettings] = useState<SystemSettings>({});
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resourceForm, setResourceForm] = useState<Partial<Resource>>({});
  const [editResourceId, setEditResourceId] = useState<string | null>(null);
  const [seedStatus, setSeedStatus] = useState<"idle" | "seeding" | "done" | "error">("idle");
  const [seedResult, setSeedResult] = useState<string[]>([]);
  const [moduleSeedStatus, setModuleSeedStatus] = useState<"idle" | "seeding" | "done" | "error">("idle");
  const [moduleSeedResult, setModuleSeedResult] = useState<string[]>([]);

  // New State for Advanced Options
  const [showMaintenanceConfirm, setShowMaintenanceConfirm] = useState(false);
  const [activeTemplateEvent, setActiveTemplateEvent] = useState<"welcome" | "quizFailed" | "formVerified">("welcome");
  const [isImportingCSV, setIsImportingCSV] = useState(false);
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;
      try {
        const settingsRef = doc(db, "system_settings", "global");
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
          setSettings(snap.data() as SystemSettings);
        } else {
          setSettings({
            globalDriveFolderUrl: "https://drive.google.com/drive/folders/1Wp7SweOk4_wZAVjpOpicYiQdVYR1EKNb?usp=sharing",
            defaultPassMark: 80,
            offices: ["Lagos", "Abuja", "Benin"],
          });
        }

        const resSnap = await getDocs(collection(db, "resources"));
        const list: Resource[] = [];
        resSnap.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            title: data.title || "",
            type: data.type || "video",
            driveUrl: data.driveUrl || "",
            embedUrl: data.embedUrl || "",
            attachedPackId: data.attachedPackId,
            tags: data.tags,
            validUntil: data.validUntil,
            clicks: data.clicks,
            views: data.views,
            addedBy: data.addedBy || "",
            authorName: data.authorName || "",
            createdAt: data.createdAt,
          });
        });
        setResources(list);

        const usersSnap = await getDocs(collection(db, "Users"));
        const studentList: any[] = [];
        const allStaff: any[] = [];
        usersSnap.forEach((d) => {
          const data = d.data();
          if (data.role === "Student") studentList.push({ uid: d.id, ...data });
          else allStaff.push({ uid: d.id, ...data });
        });
        setStudents(studentList);
        setStaffList(allStaff);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId]);

  const [profileInfo, setProfileInfo] = useState({
    name: userProfile?.displayName || "",
    email: userProfile?.email || "",
    office: userProfile?.office || "",
    availability: "",
    notifyInterview: false,
    notifyFail: false,
    dailySummary: false,
  });

  const handleProfileSave = async () => {
    if (!userId) return;
    const userRef = doc(db, "Users", userId);
    await setDoc(
      userRef,
      {
        displayName: profileInfo.name,
        email: profileInfo.email,
        office: profileInfo.office,
        themePreference: userProfile?.themePreference || "dark",
        defaultDashboard: userProfile?.defaultDashboard || "analytics",
        emailSignature: userProfile?.emailSignature || "",
        twoFactorEnabled: userProfile?.twoFactorEnabled || false,
        preferences: {
          interviewAvailability: profileInfo.availability,
          notifyInterview: profileInfo.notifyInterview,
          notifyFail: profileInfo.notifyFail,
          dailySummary: profileInfo.dailySummary,
        },
      },
      { merge: true }
    );
    alert("Profile saved successfully!");
  };

  const handleAdvancedProfileSave = async (updates: Partial<UserProfile>) => {
    if (!userId) return;
    const userRef = doc(db, "Users", userId);
    await updateDoc(userRef, updates);
    alert("Preferences updated!");
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("drive.google.com") && url.includes("/view")) {
      return url.replace(/\/view.*$/, "/preview");
    }
    return url;
  };

  const handleResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const driveUrl = resourceForm.driveUrl || "";
    const embedUrl = getEmbedUrl(driveUrl);

    const payload = {
      title: resourceForm.title || "Untitled",
      type: (resourceForm.type as any) || "video",
      driveUrl,
      embedUrl,
      attachedPackId: resourceForm.attachedPackId || "",
      tags: resourceForm.tags || [],
      validUntil: resourceForm.validUntil || null,
      addedBy: userId,
      authorName: userProfile?.displayName || "Staff",
      createdAt: serverTimestamp(),
    };

    if (editResourceId) {
      const docRef = doc(db, "resources", editResourceId);
      await updateDoc(docRef, payload);
    } else {
      await addDoc(collection(db, "resources"), { ...payload, clicks: 0, views: 0 });
    }

    const resSnap = await getDocs(collection(db, "resources"));
    const list: Resource[] = [];
    resSnap.forEach((d) => {
      const data = d.data();
      list.push({
        id: d.id,
        title: data.title || "",
        type: data.type || "video",
        driveUrl: data.driveUrl || "",
        embedUrl: data.embedUrl || "",
        attachedPackId: data.attachedPackId,
        tags: data.tags,
        validUntil: data.validUntil,
        clicks: data.clicks,
        views: data.views,
        addedBy: data.addedBy || "",
        authorName: data.authorName || "",
        createdAt: data.createdAt,
      });
    });
    setResources(list);
    setShowResourceModal(false);
    setResourceForm({});
    setEditResourceId(null);
  };

  const handleEditResource = (res: Resource) => {
    setResourceForm(res);
    setEditResourceId(res.id);
    setShowResourceModal(true);
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    await deleteDoc(doc(db, "resources", id));
    setResources(resources.filter((r) => r.id !== id));
  };

  const [staffList, setStaffList] = useState<any[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState<string>("All");
  const [userSearchTerm, setUserSearchTerm] = useState<string>("");
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [newUserForm, setNewUserForm] = useState({ displayName: "", email: "", role: "Counselor", office: "Lagos" });
  const [isCreatingUser, setIsCreatingUser] = useState<boolean>(false);

  const fetchStaff = async () => {
    const usersSnap = await getDocs(collection(db, "Users"));
    const studentList: any[] = [];
    const allStaff: any[] = [];
    usersSnap.forEach((d) => {
      const data = d.data() as any;
      if (data.role === "Student") studentList.push({ uid: d.id, ...data });
      else allStaff.push({ uid: d.id, ...data });
    });
    setStudents(studentList);
    setStaffList(allStaff);
  };

  useEffect(() => {
    if (role === "Admin" || role === "Counselor" || role === "Super Admin") {
      // fetchData already calls fetchStaff indirectly via its logic
    }
  }, [role]);

  const filteredStaffList = staffList.filter((userItem) => {
    const matchesRole = userRoleFilter === "All" || (userItem.role || "Student") === userRoleFilter;
    const matchesSearch =
      !userSearchTerm ||
      (userItem.displayName && userItem.displayName.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
      (userItem.email && userItem.email.toLowerCase().includes(userSearchTerm.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  const handleRoleChange = async (uid: string, newRole: string) => {
    await updateDoc(doc(db, "Users", uid), { role: newRole });
    fetchStaff();
  };

  const handleToggleSuspend = async (uid: string, currentSuspendedState?: boolean) => {
    await updateDoc(doc(db, "Users", uid), { suspended: !currentSuspendedState });
    fetchStaff();
  };

  const handleDeleteAccount = async (uid: string) => {
    if (!confirm("Delete account permanently from database?")) return;
    await deleteDoc(doc(db, "Users", uid));
    fetchStaff();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.email || !newUserForm.displayName) return;
    setIsCreatingUser(true);
    try {
      // Create user entry in Firestore Users collection
      const dummyUid = `user_created_${Date.now()}`;
      await setDoc(doc(db, "Users", dummyUid), {
        uid: dummyUid,
        displayName: newUserForm.displayName,
        email: newUserForm.email,
        role: newUserForm.role,
        office: newUserForm.office,
        suspended: false,
        createdAt: serverTimestamp(),
      });

      alert(`User profile for ${newUserForm.displayName} (${newUserForm.role}) created successfully!`);
      setNewUserForm({ displayName: "", email: "", role: "Counselor", office: "Lagos" });
      setShowAddUserModal(false);
      fetchStaff();
    } catch (err: any) {
      console.error("Create User Error:", err);
      alert(`Failed to create user: ${err.message}`);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleSystemSave = async () => {
    const sysRef = doc(db, "system_settings", "global");
    await setDoc(sysRef, settings, { merge: true });
    alert("System settings saved!");
  };

  const handleSeedPacks = async () => {
    if (!userId) return;
    setSeedStatus("seeding");
    setSeedResult([]);
    const results: string[] = [];
    try {
      for (const pack of DEFAULT_PACKS) {
        const { id, ...packData } = pack;
        await setDoc(doc(db, "question_packs", id), {
          ...packData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
        results.push(`✅ ${pack.title}`);
        setSeedResult([...results]);
      }
      setSeedStatus("done");
    } catch (err: any) {
      results.push(`❌ Error: ${err.message}`);
      setSeedResult(results);
      setSeedStatus("error");
    }
  };

  const handleSeedModules = async () => {
    if (!userId) return;
    setModuleSeedStatus("seeding");
    setModuleSeedResult([]);
    const results: string[] = [];
    try {
      for (const mod of DEFAULT_LEARNING_MODULES) {
        const { id, ...modData } = mod;

        // 1. Seed into learning_modules (for the sequential student track)
        await setDoc(doc(db, "learning_modules", id), {
          ...modData,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        // 2. Seed into question_packs (for the counselor library & custom assignment)
        await setDoc(doc(db, "question_packs", `pack_${id}`), {
          ...modData,
          category: "UKVI Core Curriculum",
          isDefault: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });

        results.push(`✅ ${mod.title}`);
        setModuleSeedResult([...results]);
      }
      setModuleSeedStatus("done");
    } catch (err: any) {
      results.push(`❌ Error: ${err.message}`);
      setModuleSeedResult(results);
      setModuleSeedStatus("error");
    }
  };

  const handleMergeDuplicates = async () => {
    if (!confirm("This will scan the database for duplicate emails and merge their progress. Proceed?")) return;
    setIsCleaningDuplicates(true);
    try {
      const snap = await getDocs(collection(db, "Users"));
      const emailMap: Record<string, any[]> = {};
      snap.forEach(d => {
        const data = d.data();
        if (data.email) {
          const email = data.email.toLowerCase();
          if (!emailMap[email]) emailMap[email] = [];
          emailMap[email].push({ id: d.id, ...data });
        }
      });

      const batch = writeBatch(db);
      let mergeCount = 0;

      for (const [email, userDocs] of Object.entries(emailMap)) {
        if (userDocs.length > 1) {
          // Sort by lastLoginAt or role complexity
          const sorted = userDocs.sort((a, b) => (b.lastLoginAt?.seconds || 0) - (a.lastLoginAt?.seconds || 0));
          const master = sorted[0];
          const duplicates = sorted.slice(1);

          const mergedPacks = new Set(master.completedPackIds || []);
          const mergedAssigned = new Set(master.assignedPackIds || []);

          duplicates.forEach(dup => {
            (dup.completedPackIds || []).forEach((p: string) => mergedPacks.add(p));
            (dup.assignedPackIds || []).forEach((p: string) => mergedAssigned.add(p));
            batch.delete(doc(db, "Users", dup.id));
          });

          batch.update(doc(db, "Users", master.id), {
            completedPackIds: Array.from(mergedPacks),
            assignedPackIds: Array.from(mergedAssigned),
            updatedAt: serverTimestamp(),
          });
          mergeCount++;
        }
      }

      await batch.commit();
      alert(`Cleanup complete! Merged ${mergeCount} duplicate account groups.`);
      fetchStaff();
    } catch (err: any) {
      alert(`Cleanup error: ${err.message}`);
    } finally {
      setIsCleaningDuplicates(false);
    }
  };

  const inputClasses = "mt-1 block w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] px-4 py-3 text-sm text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all";
  const labelClasses = "block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-slate-500 mb-1";

  if (loading) return <div className="p-8 text-gray-500 dark:text-gray-400">Loading Settings...</div>;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto w-full space-y-8 pb-20">
        <div className="flex flex-col gap-1 border-l-4 border-[#1a73e8] pl-6 py-2">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3 font-google">
            <Settings className="w-8 h-8 text-[#1a73e8]" /> Settings & System Manager
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-widest">
            Manage staff profile, resource library, and platform defaults
          </p>
        </div>

        <div className="border-b border-gray-200 dark:border-slate-800 flex gap-2 overflow-x-auto scrollbar-hide">
          {[
            { label: "Profile & Preferences", idx: 0, roles: ["Admin", "Counselor", "Super Admin"] },
            { label: "Resource Library", idx: 1, roles: ["Admin", "Counselor", "Super Admin"] },
            { label: "User Management", idx: 2, roles: ["Admin", "Counselor", "Super Admin"] },
            { label: "System & Compliance", idx: 3, roles: ["Admin", "Counselor", "Super Admin"] },
          ]
            .filter((tab) => role && tab.roles.includes(role))
            .map((tab) => (
              <Tab key={tab.label} label={tab.label} isActive={activeTab === tab.idx} onClick={() => setActiveTab(tab.idx)} />
            ))}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 0 && (
            <section className="space-y-8 bg-white dark:bg-[#1E293B] p-8 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xl shadow-gray-200/20 dark:shadow-none">
              <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
                 <h2 className="text-xl font-black text-gray-900 dark:text-white font-google">Staff Profile & Notifications</h2>
                 <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Configure your professional identity and alert settings.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className={labelClasses}>Full Name</label>
                    <input type="text" value={profileInfo.name} onChange={(e) => setProfileInfo({ ...profileInfo, name: e.target.value })} className={inputClasses} />
                  </div>
                  <div>
                    <label className={labelClasses}>Designated Office Location</label>
                    <select value={profileInfo.office} onChange={(e) => setProfileInfo({ ...profileInfo, office: e.target.value })} className={inputClasses}>
                      <option value="">Select Office</option>
                      {(settings.offices || ["Abuja", "Lagos", "Benin"]).map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={labelClasses}>Staff Email (Read-only)</label>
                    <input type="email" value={profileInfo.email} readOnly className={`${inputClasses} opacity-60 cursor-not-allowed`} />
                  </div>
                  <div>
                    <label className={labelClasses}>Interview Availability URL (Calendly/Google)</label>
                    <input type="url" placeholder="https://..." value={profileInfo.availability} onChange={(e) => setProfileInfo({ ...profileInfo, availability: e.target.value })} className={inputClasses} />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Automated Alert Subscriptions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'notifyInterview', label: 'Student Pack Submissions' },
                    { key: 'notifyFail', label: 'Quiz Failure Alerts (<80%)' },
                    { key: 'dailySummary', label: 'Daily Activity Recap Email' },
                  ].map((pref) => (
                    <label key={pref.key} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] cursor-pointer hover:border-blue-500/50 transition-all group">
                      <input
                        type="checkbox"
                        checked={(profileInfo as any)[pref.key]}
                        onChange={(e) => setProfileInfo({ ...profileInfo, [pref.key]: e.target.checked })}
                        className="w-5 h-5 rounded-md text-[#1a73e8] focus:ring-[#1a73e8] border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-[#0F172A]"
                      />
                      <span className="text-xs font-bold text-gray-700 dark:text-slate-300 group-hover:text-[#1a73e8] transition-colors">{pref.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button onClick={handleProfileSave} className="px-8 py-3 bg-[#1a73e8] text-white font-black rounded-full hover:bg-[#1557b0] transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                  Save Preferences
                </button>
              </div>

              {/* ── Advanced Individual Preferences ── */}
              <div className="pt-8 border-t border-gray-100 dark:border-slate-800 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-blue-500" /> UI & Experience
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className={labelClasses}>Interface Theme</label>
                        <select
                          value={userProfile?.themePreference || "dark"}
                          onChange={(e) => handleAdvancedProfileSave({ themePreference: e.target.value as any })}
                          className={inputClasses}
                        >
                          <option value="dark">Dark Mode (Default)</option>
                          <option value="light">Light Mode</option>
                          <option value="system">Match System</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClasses}>Default Dashboard View</label>
                        <select
                          value={userProfile?.defaultDashboard || "analytics"}
                          onChange={(e) => handleAdvancedProfileSave({ defaultDashboard: e.target.value as any })}
                          className={inputClasses}
                        >
                          <option value="analytics">Visual Analytics</option>
                          <option value="table">Student Data Table</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-500" /> Security & Access
                    </h3>
                    <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-[#0F172A] flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">Two-Factor Authentication (2FA)</p>
                        <p className="text-[10px] text-gray-500">Add an extra layer of security to your staff account.</p>
                      </div>
                      <button
                        onClick={() => handleAdvancedProfileSave({ twoFactorEnabled: !userProfile?.twoFactorEnabled })}
                        className={`w-12 h-6 rounded-full p-1 transition-all ${userProfile?.twoFactorEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-700'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-all ${userProfile?.twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-500" /> Professional Email Signature
                  </h3>
                  <textarea
                    rows={4}
                    value={userProfile?.emailSignature || ""}
                    onChange={(e) => handleAdvancedProfileSave({ emailSignature: e.target.value })}
                    placeholder="E.g. Kind Regards, [Name] | Senior Counselor | basechaninternational.com"
                    className={`${inputClasses} font-mono text-xs`}
                  />
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Automatically appended to student notifications.</p>
                </div>
              </div>
            </section>
          )}

          {activeTab === 1 && (
            <section className="space-y-6 bg-white dark:bg-[#1E293B] p-8 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white font-google">Resource Library</h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Manage external document vault and video lesson library.</p>
                </div>
                <button
                  onClick={() => { setShowResourceModal(true); setEditResourceId(null); setResourceForm({}); }}
                  className="px-6 py-2.5 bg-[#1a73e8] text-white font-bold rounded-full hover:bg-[#1557b0] transition-all shadow-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Resource
                </button>
              </div>

              {(role === "Admin" || role === "Super Admin") && (
                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex flex-col sm:flex-row items-end gap-4">
                  <div className="flex-1 w-full">
                    <label className={labelClasses}>Global Google Drive Vault URL (Student Access)</label>
                    <input type="url" value={settings.globalDriveFolderUrl || ""} onChange={(e) => setSettings({ ...settings, globalDriveFolderUrl: e.target.value })} className={inputClasses} />
                  </div>
                  <button onClick={handleSystemSave} className="px-6 py-3 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition-all uppercase tracking-widest shadow-sm shadow-blue-500/10 shrink-0">
                    Update Vault
                  </button>
                </div>
              )}

              <div className="overflow-x-auto mt-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800">
                      <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Type</th>
                      <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Title & Tags</th>
                      <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Validity</th>
                      <th className="px-4 py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Stats</th>
                      <th className="px-4 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                    {resources.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-12 text-center text-sm font-medium text-gray-400">Library is empty.</td></tr>
                    ) : (
                      resources.map((res) => (
                        <tr key={res.id} className="group hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300">
                              {res.type === "video" && <Video className="w-3 h-3 text-red-500" />}
                              {res.type === "pdf" && <FileText className="w-3 h-3 text-blue-500" />}
                              {res.type}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <a href={res.driveUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-gray-900 dark:text-white hover:text-[#1a73e8] flex items-center gap-1.5">
                                {res.title} <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                              <div className="flex flex-wrap gap-1">
                                {res.tags?.map(t => (
                                  <span key={t} className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-[8px] font-black uppercase text-blue-600 border border-blue-100 dark:border-blue-800 flex items-center gap-1">
                                    <Tag className="w-2 h-2" /> {t}
                                  </span>
                                ))}
                                {res.attachedPackId && <span className="px-1.5 py-0.5 rounded bg-gray-50 dark:bg-gray-700 text-[8px] font-black uppercase text-gray-500 border border-gray-200 dark:border-gray-600">{res.attachedPackId}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {res.validUntil ? (
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                                <Calendar className="w-3 h-3" />
                                {new Date(res.validUntil.seconds * 1000).toLocaleDateString()}
                              </div>
                            ) : (
                               <span className="text-[10px] font-black uppercase text-gray-300">Permanent</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black dark:text-white">{res.views || 0}</span>
                                <span className="text-[8px] font-bold text-gray-400 uppercase">Views</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black dark:text-white">{res.clicks || 0}</span>
                                <span className="text-[8px] font-bold text-gray-400 uppercase">Clicks</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right space-x-3">
                            <button onClick={() => handleEditResource(res)} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline">Edit</button>
                            <button onClick={() => handleDeleteResource(res.id)} className="text-[10px] font-black uppercase tracking-widest text-rose-600 hover:underline">Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 2 && (role === "Admin" || role === "Counselor" || role === "Super Admin") && (
            <section className="space-y-6 bg-white dark:bg-[#1E293B] p-8 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-100 dark:border-slate-800 pb-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white font-google">User Management</h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Manage database profiles, roles, and account access.</p>
                </div>
                <div className="flex gap-2">
                   <button
                     onClick={handleMergeDuplicates}
                     disabled={isCleaningDuplicates}
                     className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-full text-xs shadow-md whitespace-nowrap flex items-center gap-2 disabled:opacity-50"
                   >
                     {isCleaningDuplicates ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                     Clean Up Duplicates
                   </button>
                   <button onClick={() => setShowAddUserModal(true)} className="px-6 py-2.5 bg-[#1a73e8] text-white font-black rounded-full text-xs shadow-md whitespace-nowrap">+ Add User</button>
                </div>
              </div>

              {/* Account Linking Warning Alert */}
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 flex items-start gap-4">
                 <Shield className="w-6 h-6 text-blue-500 shrink-0" />
                 <div className="space-y-1">
                    <p className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-tighter">Required: Firebase Auth Configuration</p>
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-bold leading-relaxed">
                       To prevent future duplication, please ensure that "Link accounts that use the same email" is ENABLED in your
                       Firebase Console (Authentication &gt; Settings &gt; User account linking).
                    </p>
                 </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {["All", "Counselor", "Admin", "Student"].map((f) => (
                  <button key={f} onClick={() => setUserRoleFilter(f)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border transition-all ${userRoleFilter === f ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white" : "border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-500"}`}>{f}s</button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800">
                      <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-gray-400">User</th>
                      <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-gray-400">Role</th>
                      <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-gray-400">Status</th>
                      <th className="px-4 py-4 text-right text-[10px] font-black uppercase text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                    {filteredStaffList.map((staff) => (
                      <tr key={staff.uid} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-4">
                          <p className="text-sm font-black text-gray-900 dark:text-white">{staff.displayName}</p>
                          <p className="text-[10px] font-bold text-gray-400 truncate">{staff.email}</p>
                        </td>
                        <td className="px-4 py-4">
                          <select value={staff.role || "Student"} onChange={(e) => handleRoleChange(staff.uid, e.target.value)} className="bg-transparent text-xs font-black text-[#1a73e8] cursor-pointer focus:outline-none">
                            <option value="Student">Student</option>
                            <option value="Counselor">Counselor</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${staff.suspended ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}>{staff.suspended ? "Suspended" : "Active"}</span>
                        </td>
                        <td className="px-4 py-4 text-right space-x-3">
                           <button onClick={() => handleToggleSuspend(staff.uid, staff.suspended)} className="text-[10px] font-black uppercase text-amber-600 hover:underline">{staff.suspended ? "Unsuspend" : "Suspend"}</button>
                           <button onClick={() => handleDeleteAccount(staff.uid)} className="text-[10px] font-black uppercase text-rose-600 hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Advanced Admin User Tools ── */}
              <div className="pt-8 border-t border-gray-100 dark:border-slate-800 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Bulk Import */}
                    <div className="space-y-4">
                       <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                          <Download className="w-4 h-4 text-blue-500" /> Bulk Student Import
                       </h3>
                       <div
                         className={`border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-2 transition-all hover:border-blue-500/50 cursor-pointer ${isImportingCSV ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                         onClick={() => setIsImportingCSV(true)}
                       >
                          <FileText className="w-8 h-8 text-gray-300 mx-auto" />
                          <p className="text-xs font-bold text-gray-500">Drop CSV file here or click to upload</p>
                          <p className="text-[10px] text-gray-400">Required: Name, Email, Target University</p>
                       </div>
                    </div>

                    {/* Counselor Workload */}
                    <div className="space-y-4">
                       <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                          <LayoutGrid className="w-4 h-4 text-purple-500" /> Counselor Workload
                       </h3>
                       <div className="space-y-2">
                          {staffList.filter(s => s.role === 'Counselor').map(c => (
                            <div key={c.uid} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#0F172A] border border-gray-100 dark:border-slate-800">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1E293B] flex items-center justify-center text-xs font-black text-purple-500 border border-gray-100 dark:border-slate-800">{c.displayName?.charAt(0)}</div>
                                  <span className="text-xs font-bold dark:text-slate-200">{c.displayName}</span>
                               </div>
                               <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-[10px] font-black text-purple-600 border border-purple-100 dark:border-purple-800">
                                  {students.filter(s => s.location === c.office).length} Students
                               </span>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Password Policy */}
                 <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                       <Lock className="w-4 h-4 text-rose-500" /> Platform Security Policy
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] cursor-pointer hover:border-rose-500/50 transition-all">
                          <input
                            type="checkbox"
                            checked={settings.passwordPolicyStrict}
                            onChange={(e) => setSettings({ ...settings, passwordPolicyStrict: e.target.checked })}
                            className="w-5 h-5 rounded-md text-rose-500 focus:ring-rose-500 border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-[#0F172A]"
                          />
                          <div className="flex flex-col">
                             <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Enforce Strict Password Policy</span>
                             <span className="text-[10px] text-gray-400">Min 8 chars, 1 special, 1 number</span>
                          </div>
                       </label>
                    </div>
                 </div>
              </div>
            </section>
          )}

          {activeTab === 3 && (role === "Admin" || role === "Counselor" || role === "Super Admin") && (
            <section className="space-y-10 bg-white dark:bg-[#1E293B] p-8 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <div className="border-b border-gray-100 dark:border-slate-800 pb-6">
                <h2 className="text-xl font-black text-gray-900 dark:text-white font-google">System & Compliance Configuration</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Platform-wide logic parameters and developer seed tools.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className={labelClasses}>Default Quiz Pass Threshold (%)</label>
                  <input type="number" min={0} max={100} value={settings.defaultPassMark ?? 80} onChange={(e) => setSettings({ ...settings, defaultPassMark: Number(e.target.value) })} className={inputClasses} />
                  <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Applied to all new question packs by default.</p>
                </div>
                <div>
                  <label className={labelClasses}>Regional Branch Offices (CSV)</label>
                  <input type="text" placeholder="Lagos, Abuja, Benin" value={settings.offices?.join(", ") || ""} onChange={(e) => setSettings({ ...settings, offices: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })} className={inputClasses} />
                  <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Comma-separated list for profile dropdowns.</p>
                </div>
                <div>
                  <label className={labelClasses}>Quiz Retake Cooldown (Hours)</label>
                  <input type="number" min={0} value={settings.quizRetakeCooldownHours ?? 24} onChange={(e) => setSettings({ ...settings, quizRetakeCooldownHours: Number(e.target.value) })} className={inputClasses} />
                  <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Mandatory wait time after a failed attempt.</p>
                </div>
                <div>
                  <label className={labelClasses}>Max Retakes Allowed</label>
                  <input type="number" min={1} value={settings.maxRetakes ?? 3} onChange={(e) => setSettings({ ...settings, maxRetakes: Number(e.target.value) })} className={inputClasses} />
                  <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Attempts allowed before counselor unlock required.</p>
                </div>
              </div>

              {/* ── Advanced Admin System Tools ── */}
              <div className="pt-10 border-t border-gray-100 dark:border-slate-800 space-y-10">
                 {/* Email Template Editor */}
                 <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                       <Mail className="w-4 h-4 text-amber-500" /> Automated Communication Templates
                    </h3>
                    <div className="flex gap-2">
                       {([
                         { id: "welcome", label: "Welcome" },
                         { id: "quizFailed", label: "Quiz Failed" },
                         { id: "formVerified", label: "Form Verified" }
                       ] as const).map(t => (
                         <button
                           key={t.id}
                           onClick={() => setActiveTemplateEvent(t.id)}
                           className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${activeTemplateEvent === t.id ? 'bg-amber-50 text-amber-600 border-amber-200' : 'text-gray-400 border-gray-100 dark:border-slate-800'}`}
                         >
                           {t.label}
                         </button>
                       ))}
                    </div>
                    <textarea
                      rows={6}
                      value={settings.emailTemplates?.[activeTemplateEvent] || ""}
                      onChange={(e) => setSettings({ ...settings, emailTemplates: { ...settings.emailTemplates, [activeTemplateEvent]: e.target.value } })}
                      className={`${inputClasses} font-mono text-xs`}
                      placeholder={`Edit template for ${activeTemplateEvent}... Use {{student_name}} as variable.`}
                    />
                 </div>

                 {/* Global AI Prompt Tweak */}
                 <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                       <Sparkles className="w-4 h-4 text-indigo-500" /> Global AI Logic Overrides
                    </h3>
                    <textarea
                      rows={4}
                      value={settings.globalAIPromptOverrides || ""}
                      onChange={(e) => setSettings({ ...settings, globalAIPromptOverrides: e.target.value })}
                      placeholder="Inject custom rules into Gemini AI prompt globally..."
                      className={`${inputClasses} border-indigo-200 dark:border-indigo-900/30 bg-indigo-50/10`}
                    />
                 </div>

                 {/* Maintenance Mode */}
                 <div className="p-8 rounded-[32px] bg-rose-50/50 dark:bg-rose-900/10 border-2 border-dashed border-rose-200 dark:border-rose-900/30 flex items-center justify-between">
                    <div className="space-y-1">
                       <h3 className="text-lg font-black text-rose-600 uppercase tracking-tighter flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" /> Maintenance Mode
                       </h3>
                       <p className="text-xs text-rose-500 font-bold">Temporarily disable student access and block logins.</p>
                    </div>
                    <button
                      onClick={() => setShowMaintenanceConfirm(true)}
                      className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${settings.maintenanceMode ? 'bg-rose-600 text-white' : 'bg-white dark:bg-[#1E293B] text-rose-600 border border-rose-200 dark:border-rose-800'}`}
                    >
                      {settings.maintenanceMode ? "Enabled - Turn Off" : "Enable System Lock"}
                    </button>
                 </div>
              </div>

              <div className="flex justify-start border-t border-gray-50 dark:border-slate-800/50 pt-6">
                <button onClick={handleSystemSave} className="px-8 py-3 bg-[#1a73e8] text-white font-black rounded-xl hover:bg-[#1557b0] transition-all shadow-md">
                  Save All System Configurations
                </button>
              </div>

              {/* Seeding Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10">
                <div className="bg-gray-50 dark:bg-[#0F172A] p-6 rounded-3xl border border-gray-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center"><PackageCheck className="w-6 h-6" /></div>
                    <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter">Legacy Question Packs</h3>
                  </div>
                  <p className="text-xs text-gray-500 font-bold leading-relaxed">Seed the 3 original UKVI preparation packs with global student access.</p>
                  <button onClick={handleSeedPacks} disabled={seedStatus === "seeding"} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs uppercase transition-all shadow-lg shadow-emerald-500/10">
                    {seedStatus === "seeding" ? "Writing..." : "Seed Legacy Packs"}
                  </button>
                  {seedResult.length > 0 && <div className="p-3 bg-white dark:bg-gray-800 rounded-xl text-[10px] font-mono border border-emerald-100 dark:border-emerald-900/30">{seedResult.map((r, i) => <p key={i}>{r}</p>)}</div>}
                </div>

                <div className="bg-blue-50/50 dark:bg-[#0F172A] p-6 rounded-3xl border border-blue-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center"><GraduationCap className="w-6 h-6" /></div>
                    <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter">Progressive 5-Modules</h3>
                  </div>
                  <p className="text-xs text-gray-500 font-bold leading-relaxed">Initialize the strict 5-module UKVI credibility track (Sequential unlock).</p>
                  <button onClick={handleSeedModules} disabled={moduleSeedStatus === "seeding"} className="w-full py-3 bg-[#1a73e8] hover:bg-[#1557b0] disabled:opacity-50 text-white font-black rounded-2xl text-xs uppercase transition-all shadow-lg shadow-blue-500/10">
                    {moduleSeedStatus === "seeding" ? "Writing..." : "Seed 5 UKVI Modules"}
                  </button>
                  {moduleSeedResult.length > 0 && <div className="p-3 bg-white dark:bg-gray-800 rounded-xl text-[10px] font-mono border border-blue-100 dark:border-blue-900/30">{moduleSeedResult.map((r, i) => <p key={i}>{r}</p>)}</div>}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Add / Edit Resource Custom Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-[32px] bg-white dark:bg-[#1E293B] p-8 shadow-2xl border border-gray-200 dark:border-slate-700 relative animate-in zoom-in duration-200">
            <button onClick={() => setShowResourceModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white"><X className="w-6 h-6" /></button>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white font-google mb-6">{editResourceId ? "Edit Library Entry" : "Add New Resource"}</h3>
            <form onSubmit={handleResourceSubmit} className="space-y-5">
              <div>
                <label className={labelClasses}>Entry Title</label>
                <input type="text" required placeholder="Resource Title" value={resourceForm.title || ""} onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })} className={inputClasses} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Media Format</label>
                  <select required value={resourceForm.type || "video"} onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value as any })} className={inputClasses}>
                    <option value="video">Google Drive Video</option>
                    <option value="pdf">PDF Document</option>
                    <option value="audio">Audio drill</option>
                    <option value="doc">Template/Link</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Valid Until (Optional)</label>
                  <input
                    type="date"
                    value={resourceForm.validUntil ? new Date(resourceForm.validUntil.seconds * 1000).toISOString().split('T')[0] : ""}
                    onChange={(e) => setResourceForm({ ...resourceForm, validUntil: e.target.value ? { seconds: Math.floor(new Date(e.target.value).getTime() / 1000) } : null })}
                    className={inputClasses}
                  />
                </div>
              </div>
              <div>
                <label className={labelClasses}>Cloud Provider Link (URL)</label>
                <input type="url" required placeholder="Google Drive Link" value={resourceForm.driveUrl || ""} onChange={(e) => setResourceForm({ ...resourceForm, driveUrl: e.target.value })} className={inputClasses} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Attached Module/Pack ID</label>
                  <input type="text" placeholder="General" value={resourceForm.attachedPackId || ""} onChange={(e) => setResourceForm({ ...resourceForm, attachedPackId: e.target.value })} className={inputClasses} />
                </div>
                <div>
                  <label className={labelClasses}>Tags (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="Financial, Visa, etc."
                    value={resourceForm.tags?.join(", ") || ""}
                    onChange={(e) => setResourceForm({ ...resourceForm, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                    className={inputClasses}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowResourceModal(false)} className="px-6 py-3 text-xs font-black uppercase text-gray-500 hover:text-gray-900">Cancel</button>
                <button type="submit" className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-2xl text-xs uppercase shadow-xl">{editResourceId ? "Update" : "Save Entry"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Register User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-[32px] bg-white dark:bg-[#1E293B] p-8 shadow-2xl border border-gray-200 dark:border-slate-700 relative animate-in zoom-in duration-200">
            <button onClick={() => setShowAddUserModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white"><X className="w-6 h-6" /></button>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white font-google mb-2">Register New User</h3>
            <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-8">Creates profile in cloud database</p>
            <form onSubmit={handleCreateUser} className="space-y-5">
              <div>
                <label className={labelClasses}>Full Identity</label>
                <input type="text" required placeholder="Full Name" value={newUserForm.displayName} onChange={(e) => setNewUserForm({ ...newUserForm, displayName: e.target.value })} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Corporate / Student Email</label>
                <input type="email" required placeholder="Email Address" value={newUserForm.email} onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })} className={inputClasses} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Access Level</label>
                  <select value={newUserForm.role} onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })} className={inputClasses}>
                    <option value="Student">Student</option>
                    <option value="Counselor">Counselor</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Branch Office</label>
                  <select value={newUserForm.office} onChange={(e) => setNewUserForm({ ...newUserForm, office: e.target.value })} className={inputClasses}>
                    <option value="Lagos">Lagos</option>
                    <option value="Abuja">Abuja</option>
                    <option value="Benin">Benin</option>
                    <option value="London HQ">London HQ</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setShowAddUserModal(false)} className="px-6 py-3 text-xs font-black uppercase text-gray-500 hover:text-gray-900">Cancel</button>
                <button type="submit" disabled={isCreatingUser} className="px-8 py-3 bg-[#1a73e8] text-white font-black rounded-2xl text-xs uppercase shadow-xl disabled:opacity-50">
                  {isCreatingUser ? "Processing..." : "Create Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Confirmation Modal */}
      {showMaintenanceConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
           <div className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-[40px] p-10 space-y-8 shadow-2xl border border-rose-100 dark:border-rose-900/30 text-center animate-in zoom-in duration-200">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto">
                 <AlertCircle className="w-10 h-10 text-rose-600" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-2xl font-black text-gray-900 dark:text-white font-google uppercase">Toggle System Lock?</h3>
                 <p className="text-xs font-bold text-gray-500 uppercase leading-relaxed">
                    This will immediately {settings.maintenanceMode ? 'ENABLE' : 'DISABLE'} student access to the entire platform.
                 </p>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setShowMaintenanceConfirm(false)} className="flex-1 py-4 text-xs font-black uppercase text-gray-500">Abort</button>
                 <button
                   onClick={() => { setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode }); setShowMaintenanceConfirm(false); }}
                   className="flex-1 py-4 bg-rose-600 text-white font-black rounded-2xl text-xs uppercase shadow-xl shadow-rose-500/20"
                 >
                   Confirm Change
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* CSV Import Feedback */}
      {isImportingCSV && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-10">
           <Loader2 className="w-5 h-5 animate-spin" />
           <span className="text-xs font-black uppercase tracking-widest">Processing CSV Student Import...</span>
           <button onClick={() => setIsImportingCSV(false)} className="ml-4 p-1 hover:bg-white/20 rounded-full"><X className="w-4 h-4" /></button>
        </div>
      )}
    </AppShell>
  );
}
