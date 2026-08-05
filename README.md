# 🎓 Basechan ComplianceOS (BC-ComplianceOS)

> An AI-powered Pre-CAS & Compliance Interview Management Platform designed to prepare international students for UK university admissions and UKVI credibility interviews[cite: 2].

![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-V10-yellow?style=for-the-badge&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini_1.5-blue?style=for-the-badge&logo=google)

## 📖 The Vision

Basechan ComplianceOS transforms the traditionally manual, 1-on-1 student compliance process into a standardized, scalable, and AI-assisted workflow[cite: 2]. Built upon the **Basechan BC-CIEF 5-Layer Compliance Training Framework**, this platform is designed to:

*   Deliver a **95%+ UKVI interview pass rate**[cite: 2].
*   Train **300+ students simultaneously** without bottlenecks[cite: 2].
*   Reduce counselor and administrative workload by **60%**[cite: 2].
*   Standardize interview quality across all global offices (Abuja, Lagos, Benin)[cite: 2].
*   Detect high-risk applicants early before they ever reach an official visa interview[cite: 2].

---

## ✨ The Core Ecosystem

ComplianceOS is built as a multi-role CRM and Learning Management System (LMS)[cite: 2]. It guides students through a strict operational sequence while giving counselors absolute visibility over their pipeline.

### 👨‍🎓 The Student Experience
*   **Progressive Foundation Learning:** A locked, 5-module curriculum covering everything from CAS and Financial Compliance to UKVI rules[cite: 2]. Students must read the study notes and pass gamified quizzes with an 80% score to progress[cite: 2].
*   **Personalized Interview Pack:** A comprehensive digital dossier where students input their specific CAS, tuition, deposit, sponsor, and accommodation details[cite: 2]. This ensures they understand their own application rather than memorizing generic scripts[cite: 2].
*   **AI Interview Copilot:** Powered by Google Gemini. The AI acts as a strict UKVI compliance officer, dynamically tailoring practice questions based on the student's specific target university, course, and financial background[cite: 2].
*   **Gamified Leaderboard & Privacy:** Students earn points for completing modules and maintaining streaks. To ensure privacy, real names are masked using unique Student IDs (e.g., `BW-12345`).

### 💼 The Counselor & Management Experience
*   **Master Student Directory:** A unified command center with advanced filtering. Counselors can instantly sort students by their compliance progress, last active date, and risk status.
*   **Quick Portfolio Modal:** Click on any student to pull up a rapid summary of their learning progress, pack status, and readiness—without losing your place in the directory.
*   **Live Evaluation Rubrics:** Dedicated interfaces for grading Junior, Senior, and Head Approval compliance interviews based on official rubrics[cite: 2].
*   **Global Notification & Reminder System:** Counselors can set targeted reminders for specific students (e.g., "Check financial documents") that trigger real-time, global app notifications for both parties.

---

## 🚦 The Readiness Engine (Traffic Light System)

At the heart of ComplianceOS is the **Readiness Engine**[cite: 2]. The platform completely removes the guesswork from interview preparation by automatically calculating a student's status[cite: 2].

As students complete quizzes, chat with the AI, and pass live counselor evaluations, the engine updates their status on a real-time **Traffic Light Dashboard**[cite: 2]:

*   🟢 **Green:** 100% Interview Ready. Approved to book their official UKVI/Pre-CAS interview[cite: 2].
*   🟡 **Yellow:** Needs refinement. May require a peer interview or additional AI practice[cite: 2].
*   🟠 **Orange:** High Risk. Struggling with core concepts, financials, or English fluency[cite: 2].
*   🔴 **Red:** Critical intervention required. Escalate to Senior Compliance Officer[cite: 2].

---

## 🔒 Security & Architecture

*   **Role-Based Access Control (RBAC):** Strict security layers separating `Student`, `Counselor`, and `Admin` permissions. Students can only access their own learning materials, while Counselors manage their specific pipeline, and Admins oversee global analytics[cite: 2].
*   **AI Guardrails:** The Gemini Copilot is gated by strict system instructions. It will automatically refuse to discuss unrelated topics, protecting the platform from prompt injection and keeping the student strictly focused on compliance prep.
*   **Data Integrity:** Built on a serverless Next.js App Router and Firebase architecture, ensuring 99.9% availability, fast global reads, and scalable document storage for CVs, SOPs, and financial records[cite: 2].

---
*Copyright © 2026 Basechan International. All rights reserved. This software is proprietary and confidential.*
