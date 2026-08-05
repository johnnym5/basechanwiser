# BASECHANWISER — Student Compliance & Operations Platform

**BASECHANWISER** is a modern, high-contrast, role-based student compliance tracker and counselor operations portal built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Firebase (Authentication & Firestore)** following **Google Material Design 3** design principles.

---

## 🌟 Key Features

### 1. Smart Authentication & Domain Role Matrix
- **Integrated Google Sign-In**: Unified login for staff and students.
- **Strict Role-Based Access Control (RBAC)**: 
  - Roles are automatically assigned based on official organization email domains.
  - Supports Super Admin, Admin, and Student tiers.
- **Account Linking**: Automatically merges duplicate login sessions under a single organization profile.

### 2. Student Workspace & Interview Journey
- **Interactive Progress Tracker**: Gamified dashboard with "Next Best Action" guidance and readiness gauges.
- **Foundation Learning Path**: 5-module UKVI credibility track with embedded video lessons and randomized MCQ assessments.
- **Resource Vault**: In-app viewer for PDFs, Videos, and Word templates without external redirects.

### 3. Counselor & Operations Hub
- **Analytics Control Center**: Visual KPI cards, pie charts for readiness distribution, and bar charts for module performance.
- **Student Data Table**: Comprehensive management of cohort progress, bulk actions, and evaluation logs.
- **Compliance Tooling**: Manage the Question Pack Library, Resource Library, and system-wide logic parameters (pass marks, cooldowns).
- **Maintenance Mode**: One-click system lock for students during critical updates.

### 4. UI/UX Excellence
- **Material Design 3**: Professional typography, 32px rounded corners, and premium elevations.
- **Universal App Shell**: Fixed, hover-expandable sidebar for desktop and safe-area optimized bottom navigation for mobile.
- **Global Theme Engine**: Persistent Dark and Light modes with system matching capabilities.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend & Database**: Firebase Authentication & Firestore Database
- **Cloud Storage**: Firebase Storage
- **Charts**: Recharts
- **Icons**: Lucide React

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+ and `npm`

### Installation

1. **Clone the repository**:
   ```bash
   git clone [REDACTED_REPO_URL]
   cd basechanwiser
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env.local` file in the root directory and populate it with your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Deployment

### 1. Web Hosting (Static Export)
This serves the client-side app from the `out/` directory.

1. **Build the project**:
   Ensure all `NEXT_PUBLIC_FIREBASE_*` variables are set in your environment or `.env.local` file.
   ```bash
   npm run build:export
   ```
2. **Deploy**:
   ```bash
   firebase deploy --only hosting
   ```

### 2. App Hosting (Dynamic/SSR)
This runs the Next.js server in a managed environment.

1. **Connect Repository**: Connect your GitHub repository to Firebase App Hosting in the Firebase Console.
2. **Set Secrets**: You MUST add the following as Secrets in the App Hosting dashboard:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `GEMINI_API_KEY`
3. **Deploy**: Firebase will automatically build and deploy on every push to your main branch.

### Important Notes for Dual Deployment
- The static export generates client-side pages under `out/` and supports client Firebase Authentication / Firestore in the browser.
- The AI assistant backend routes under `/api/ai/*` are server-side routes and are served by the App Hosting backend.
- Firebase Hosting rewrites `/api/ai/**` to the backend service so the static site can use the same `/api/ai/*` paths.

### If You Need AI / Server API Support
For full functionality, deploy the backend through App Hosting or another dynamic runtime:
- Firebase App Hosting
- Firebase Hosting with Cloud Run
- Vercel serverless functions
- A separate Node/Cloud Run backend with proxy rules to `/api/ai/*`

If you want, I can also add a minimal Firebase Functions setup to host the `/api/ai/*` endpoints and keep the front-end static.
---

## 📄 License
Internal proprietary application. Unauthorized distribution or reproduction is strictly prohibited.
