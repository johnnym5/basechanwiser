# BASECHANWISER — Student Compliance & Operations Platform

**BASECHANWISER** is a modern, high-contrast, role-based student compliance tracker and counselor operations portal built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Firebase (Authentication & Firestore)** following **Google Material Design 3** design principles.

---

## 🌟 Key Features

### 1. Smart Authentication & Domain Role Matrix
- **Passwordless Guest & Staff Login**: Collects full name and email for quick access.
- **Admin Password Login**: Direct email and password authentication for administrative operations.
- **Domain Role Routing**:
  - **Admin**: Emails ending strictly in `@basechaninternational.com`
  - **Counselor**: Staff emails ending in `*.basechaninternational@gmail.com` (e.g. `john.basechaninternational@gmail.com`)
  - **Student**: Standard students and guests

### 2. Student Workspace & Interview Pack
- **Interactive Progress Tracker**: Circular readiness status percentage ring.
- **Foundation Learning Modules**: Video learning with dynamic 10-question MCQ knowledge checks (80%+ passing threshold required).
- **Compliance Interview Pack**: 3-step compliance form covering Personal/Passport details, Financials/Sponsorship, and Academic/Career goals.

### 3. Counselor Traffic Light Portal
- **Traffic Light Dashboard**: Material Design 3 chip filters for Green (Ready), Yellow (Needs Work), and Red (Urgent).
- **Real-Time Data Integration**: Direct Firestore query across registered student profiles and submitted interview packs.
- **Junior Evaluation System**: Slide-over drawer for reviewing student data, assigning evaluation outcomes (Pass, Retry, Escalate), and committing readiness status.
- **Google Forms-Style Module Editor**: Create, edit, and publish custom learning video modules and MCQ quiz questions.

### 4. UI/UX Excellence
- **Google Sans / Material Design 3**: Clean sans-serif typography, soft rounded corners (`16px`), and elevated cards.
- **Auto-Expanding Sidebar**: Collapses to a compact 68px icon rail and dynamically expands to 256px on mouse hover.
- **Dark Mode Support**: Full light/dark mode theme context with persistent `localStorage` and high-contrast color palettes.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Material 3 Utilities)
- **Backend & Database**: Firebase Authentication & Firestore Database
- **Hosting**: Firebase Hosting (Static Export)
- **Icons**: Lucide React

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+ and `npm`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/johnnym5/basechanwiser.git
   cd basechanwiser
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=basechanwiser.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=basechanwiser
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=basechanwiser.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Deployment

### Firebase Hosting Deployment
```bash
# Build production static export
npm run build

# Deploy to Firebase Hosting & Firestore
firebase deploy
```

Live Hosting URL: [https://basechanwiser.web.app](https://basechanwiser.web.app)

---

## 📄 License
Internal proprietary application for BASECHAN International.
