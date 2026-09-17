'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth/auth-context';
import LoginModal from '@/components/auth/LoginModal';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, ArrowLeft, CheckCircle2, Sparkles, 
  AlertCircle, User, GraduationCap, Check
} from 'lucide-react';

const TOTAL_STEPS = 12;

const STEPS_META = [
  { stepNum: '01', title: 'WELCOME & INTRODUCTION', progress: 8 },
  { stepNum: '02', title: 'PLATFORM OVERVIEW', progress: 16 },
  { stepNum: '03', title: 'OUR GOAL & PHILOSOPHY', progress: 25 },
  { stepNum: '04', title: 'THE 4-STAGE ROADMAP', progress: 33 },
  { stepNum: '05', title: 'QUESTIONNAIRE OVERVIEW', progress: 42 },
  { stepNum: '06', title: 'IDENTITY & ACADEMIC CHOICE', progress: 50 },
  { stepNum: '07', title: 'FINANCIAL & CAS AUDIT', progress: 58 },
  { stepNum: '08', title: 'RISK & BACKGROUND PROFILING', progress: 67 },
  { stepNum: '09', title: 'TARGET OUTCOME', progress: 75 },
  { stepNum: '10', title: 'TRAINING MILESTONES', progress: 83 },
  { stepNum: '11', title: 'MANUAL COUNSELOR MATCHING', progress: 92 },
  { stepNum: '12', title: 'SETUP COMPLETE', progress: 100 },
];

// High-resolution local background images for slow pan-and-tilt ambient immersion
const SLIDE_BACKGROUNDS = [
  '/images/onboarding/auth-hero.jpg',             // 01: Welcome
  '/images/onboarding/slide-0.jpg',               // 02: Platform Overview
  '/images/onboarding/slide-2.jpg',               // 03: Goal & Philosophy
  '/images/onboarding/slide-0.jpg',               // 04: 4-Stage Roadmap
  '/images/onboarding/slide-1.jpg',               // 05: Questionnaire Overview
  '/images/onboarding/slide-1.jpg',               // 06: Identity & Academic
  '/images/onboarding/slide-3.jpg',               // 07: Financial & CAS
  '/images/onboarding/slide-4.jpg',               // 08: Risk & Background
  '/images/onboarding/slide-4.jpg',               // 09: Target Outcome
  '/images/onboarding/slide-2.jpg',               // 10: Milestones
  '/images/onboarding/pdf-counselor-support.jpg', // 11: Dedicated Counselor
  '/images/onboarding/slide-5.jpg',               // 12: Ready to Begin
];

// Framer motion variants for smooth, slow, staggered element transitions
const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.35 },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.85,
    },
  },
};

export default function StealthOnboardingWizard({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    countryOfResidence: '',
    mobileNumber: '',
    schoolOfChoice: '',
    courseTitle: '',
    rqfLevel: "RQF Level 7 (Master's)",
    targetIntake: '',
    casStatus: 'Pending',
    casNumber: '',
    tuitionFee: '',
    depositPaid: '',
    campusRegion: 'Outer London',
    sponsorType: 'Biological Parents',
    hasStudyGaps: 'No',
    studyGapExplanation: '',
    hasVisaRefusal: 'No',
    visaRefusalExplanation: '',
    targetReturnRole: ''
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    setErrorMsg(null);
    // Strict validation on Step 6 (Index 5: IDENTITY & ACADEMIC CHOICE)
    if (currentStep === 5) {
      if (!formData.fullName.trim() || !formData.email.trim() || !formData.password || !formData.countryOfResidence.trim()) {
        setErrorMsg('Please provide your full legal name, email, country, and password to create your account.');
        return;
      }
      if (formData.password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
    }
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setErrorMsg(null);
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleGoogleSignInClick = async () => {
    setErrorMsg(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setErrorMsg(err.message || 'Google Sign-In failed. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: formData.fullName.trim() });

      const userPayload = {
        uid: user.uid,
        displayName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        role: 'Student',
        countryOfResidence: formData.countryOfResidence,
        mobileNumber: formData.mobileNumber || null,
        onboardingCompleted: true,

        assignedCounselorId: null,
        assignedCounselorName: null,
        counselorMatchStatus: 'PENDING_ADMIN_ASSIGNMENT',

        academic: {
          targetUniversity: formData.schoolOfChoice || null,
          courseName: formData.courseTitle || null,
          rqfLevel: formData.rqfLevel || null,
          intake: formData.targetIntake || null,
        },

        financials: {
          casStatus: formData.casStatus,
          casNumber: formData.casNumber || null,
          tuitionFee: formData.tuitionFee ? Number(formData.tuitionFee) : null,
          depositPaid: formData.depositPaid ? Number(formData.depositPaid) : null,
          campusRegion: formData.campusRegion,
          sponsorType: formData.sponsorType,
        },

        background: {
          hasStudyGaps: formData.hasStudyGaps === 'Yes',
          studyGapExplanation: formData.studyGapExplanation || null,
          hasVisaRefusal: formData.hasVisaRefusal === 'Yes',
          visaRefusalExplanation: formData.visaRefusalExplanation || null,
          targetReturnRole: formData.targetReturnRole || null,
        },

        pipeline: {
          currentStage: 1,
          stage1Passed: false,
          stage2Completed: false,
          stage3Completed: false,
          stage4Approved: false,
        },

        assignedPackIds: [
          'default-pack-ukvi-compliance',
          'default-pack-academic-intent',
          'default-pack-career-intent',
        ],
        completedPackIds: [],
        readinessStatus: 'Red',
        createdAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'Users', user.uid), userPayload, { merge: true });

      try {
        await setDoc(doc(db, 'users', user.uid), userPayload, { merge: true });
      } catch (mirrorErr) {
        console.warn('Mirror to users collection skipped:', mirrorErr);
      }

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('This email is already registered. Please log in through the main screen.');
      } else {
        setErrorMsg(err.message || 'Failed to complete registration.');
      }
      setIsSubmitting(false);
    }
  };

  const meta = STEPS_META[currentStep];

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      
      {/* ── ULTRA-SLOW KEN BURNS AMBIENT BACKGROUND WITH SMOOTH CROSS-FADES ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {SLIDE_BACKGROUNDS.map((bgUrl, idx) => (
          <div
            key={bgUrl + idx}
            className={`absolute inset-[-12%] bg-cover bg-center transition-opacity duration-1500 ease-in-out ${
              currentStep === idx ? 'opacity-25 animate-ken-burns-slow' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url('${bgUrl}')` }}
          />
        ))}
        {/* Soft dark vignette overlays ensuring pristine contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080d1a]/85 via-[#080d1a]/90 to-[#080d1a]/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-transparent to-transparent" />
      </div>

      {/* ── TOP HEADER / PROGRESSION BAR (Hidden on Step 1, Clean on Steps 2-12) ── */}
      {currentStep > 0 ? (
        <header className="relative z-20 w-full max-w-6xl mx-auto px-6 pt-6 pb-2 shrink-0">
          <div className="flex items-center justify-between mb-3">
            {/* Top-Left Back Button from 2nd page onward */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-all hover:-translate-x-0.5 active:scale-95 group"
                aria-label="Previous step"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-400 group-hover:text-white transition-colors" />
                <span>Back</span>
              </button>

              {/* Clean Step Label without pill border */}
              <span className="text-indigo-400 font-black tracking-[0.18em] text-[11px] uppercase">
                STEP {meta.stepNum} OF {String(TOTAL_STEPS).padStart(2, '0')}
              </span>
            </div>

            {/* Center Topic Title */}
            <span className="text-slate-400 font-bold tracking-[0.25em] text-[10px] uppercase hidden sm:inline-block">
              {meta.title}
            </span>

            {/* Percentage Complete */}
            <span className="text-cyan-400 font-black tracking-wider text-[11px] uppercase">
              {meta.progress}% COMPLETE
            </span>
          </div>

          {/* Glowing Progress Line */}
          <div className="relative w-full h-1 bg-slate-900 rounded-full overflow-visible">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-700 ease-out relative"
              style={{ width: `${meta.progress}%` }}
            >
              <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_#38bdf8] border-2 border-cyan-300" />
            </div>
          </div>
        </header>
      ) : (
        /* Spacer on Page 1 to balance vertical centering */
        <div className="h-6 w-full" />
      )}

      {/* ── MAIN CONTENT STAGE WITH STAGGERED FADE-IN ── */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 py-4 flex-1 flex flex-col justify-center items-center my-auto overflow-y-auto">
        
        {errorMsg && (
          <div className="w-full max-w-xl mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-3 shadow-lg">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ═════════════════════════════════════════════════════════════════
              PAGE 01: WELCOME & INTRODUCTION (Logo + Title + Direct Actions)
             ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 0 && (
            <motion.div
              key="step-0"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-2xl text-center space-y-6 py-6"
            >
              {/* Prominent Logo */}
              <motion.div variants={itemVariants} className="flex justify-center mb-2">
                <div className="w-20 h-20 bg-indigo-600/20 border border-indigo-500/30 rounded-3xl p-3 flex items-center justify-center shadow-2xl shadow-indigo-600/30 backdrop-blur-xl">
                  <Image src="/logo.png" alt="BASECHAN WISER Logo" width={64} height={64} className="object-contain" priority />
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1 variants={itemVariants} className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200">BASECHAN WISER</span>
              </motion.h1>

              {/* Body */}
              <motion.p variants={itemVariants} className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                Your intelligent UKVI compliance operating system. Complete this guided setup to configure your profile with flexible, optional inputs and unlock your clearance pipeline.
              </motion.p>

              {/* Action Buttons: Sign Up & Start Setup, Google, Returning Login */}
              <motion.div variants={itemVariants} className="pt-4 space-y-3 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-4 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Sign Up &amp; Start Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleGoogleSignInClick}
                  disabled={isGoogleLoading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{isGoogleLoading ? 'Connecting...' : 'Continue with Google'}</span>
                </button>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsLoginModalOpen(true)}
                    className="w-full py-3 px-6 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    <span>Already Have an Account? Log In</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              PAGE 02: PLATFORM OVERVIEW (What is BASECHAN WISER?)
             ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-4"
            >
              <div className="space-y-4 text-left">
                <motion.h2 variants={itemVariants} className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  What is BASECHAN WISER?
                </motion.h2>
                <motion.h3 variants={itemVariants} className="text-indigo-400 font-bold text-base uppercase tracking-wider">
                  The Compliance OS
                </motion.h3>
                <motion.p variants={itemVariants} className="text-slate-300 text-sm leading-relaxed">
                  BASECHAN WISER is a purpose-built preparation platform designed to safeguard your international study ambitions from avoidable visa refusals.
                </motion.p>
                <motion.p variants={itemVariants} className="text-slate-400 text-sm leading-relaxed">
                  We replace unorganized spreadsheets with an automated, sequential training pipeline—preparing you for university Pre-CAS and UKVI credibility interviews.
                </motion.p>
              </div>

              <motion.div variants={itemVariants} className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl h-[320px] bg-slate-900">
                <Image 
                  src="/images/onboarding/pdf-student-campus.jpg" 
                  alt="Student on campus" 
                  fill 
                  className="object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
              </motion.div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              PAGE 03: OUR GOAL & PHILOSOPHY (Zero Refusals / Flexible Guidance)
             ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-4xl space-y-8 text-left py-4"
            >
              <motion.h2 variants={itemVariants} className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Our Mission &amp; Core Purpose
              </motion.h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="p-6 sm:p-8 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3 backdrop-blur-xl">
                  <h3 className="text-lg font-black text-indigo-400">Zero Credibility Refusals</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    UKVI Entry Clearance Officers evaluate academic fit, funding legitimacy, and genuine intent to study. Our goal is to ensure 100% of your answers match home office standards without memorized scripts.
                  </p>
                </motion.div>

                <motion.div variants={itemVariants} className="p-6 sm:p-8 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3 backdrop-blur-xl">
                  <h3 className="text-lg font-black text-cyan-400">Flexible, Linear Guidance</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Never worry if you haven't received your CAS or final accommodation invoice yet. Our onboarding allows optional fields so you can begin training immediately and fill in details later.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              PAGE 04: THE 4-STAGE ROADMAP (The 4-Stage Student Pipeline)
             ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-4xl space-y-10 text-left py-4"
            >
              <motion.h2 variants={itemVariants} className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                The 4-Stage Student Pipeline
              </motion.h2>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                <div className="hidden sm:block absolute top-7 left-12 right-12 h-0.5 bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 z-0 opacity-30" />

                {[
                  { stage: 'Stage 1: Knowledge', desc: 'Pass all 5 compliance quizzes with 80%+ scores.', color: 'border-indigo-500 text-indigo-400' },
                  { stage: 'Stage 2: Portfolio', desc: 'Document tuition, sponsors, and career ROI proofs.', color: 'border-cyan-500 text-cyan-400' },
                  { stage: 'Stage 3: Simulation', desc: 'High-pressure AI mock interview with red flag checks.', color: 'border-blue-500 text-blue-400' },
                  { stage: 'Stage 4: Clearance', desc: 'Admin-assigned counselor audit & CAS sign-off.', color: 'border-emerald-500 text-emerald-400' },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    className="relative z-10 flex flex-col items-start sm:items-center text-left sm:text-center space-y-3 p-4 bg-slate-900/70 sm:bg-transparent rounded-2xl border sm:border-0 border-slate-800"
                  >
                    <div className={`w-12 h-12 rounded-full border-2 ${item.color} bg-slate-950 flex items-center justify-center font-black text-sm shadow-lg`}>
                      0{idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{item.stage}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              PAGE 05: QUESTIONNAIRE OVERVIEW (Wizard Step 1: Your Profile)
             ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <motion.div
              key="step-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-2xl text-center space-y-6 py-6"
            >
              <motion.div variants={itemVariants} className="w-16 h-1 w-24 mx-auto bg-indigo-500 rounded-full mb-4" />
              <motion.h2 variants={itemVariants} className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Wizard Step 1: Your Profile
              </motion.h2>
              <motion.p variants={itemVariants} className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                Let's set up your baseline information. Only essential identity fields are mandatory—all academic, CAS, and financial questions can be filled as estimates or skipped for later editing.
              </motion.p>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              PAGE 06: IDENTITY & ACADEMIC CHOICE (Basic Information Setup)
             ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 5 && (
            <motion.div
              key="step-5"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-4xl space-y-6 text-left py-2"
            >
              <motion.h2 variants={itemVariants} className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Basic Information Setup
              </motion.h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Panel: Personal Identity (Required) */}
                <motion.div variants={itemVariants} className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <User className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-white text-sm">Personal Identity</h3>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase ml-auto">Required</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Full Legal Name <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      placeholder="Exact match to passport"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Country of Residence <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.countryOfResidence}
                      onChange={(e) => updateField('countryOfResidence', e.target.value)}
                      placeholder="Locates visa jurisdiction"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Email Address <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="Real-time counselor alerts"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Password <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </motion.div>

                {/* Right Panel: Academic Choice (Optional) */}
                <motion.div variants={itemVariants} className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-bold text-white text-sm">Academic Choice</h3>
                    <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded font-black uppercase ml-auto">Optional</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      School of Choice
                    </label>
                    <input
                      type="text"
                      value={formData.schoolOfChoice}
                      onChange={(e) => updateField('schoolOfChoice', e.target.value)}
                      placeholder="Target UK University (e.g. Coventry)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Course Title &amp; Level
                    </label>
                    <input
                      type="text"
                      value={formData.courseTitle}
                      onChange={(e) => updateField('courseTitle', e.target.value)}
                      placeholder="Degree name &amp; RQF level"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Target Intake
                    </label>
                    <input
                      type="text"
                      value={formData.targetIntake}
                      onChange={(e) => updateField('targetIntake', e.target.value)}
                      placeholder="Intended start month/year"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              PAGE 07: FINANCIAL & CAS AUDIT (Financial & CAS Profile Setup)
             ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 6 && (
            <motion.div
              key="step-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-4xl space-y-6 text-left py-2"
            >
              <motion.h2 variants={itemVariants} className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Financial &amp; CAS Profile Setup
              </motion.h2>

              <motion.div variants={itemVariants} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      CAS Status / Number <span className="text-slate-500 text-[10px]">(OPTIONAL)</span>
                    </label>
                    <select
                      value={formData.casStatus}
                      onChange={(e) => updateField('casStatus', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 outline-none mb-2"
                    >
                      <option value="Pending">Pending (Validates sponsorship readiness)</option>
                      <option value="In Progress">In Progress (Interview completed)</option>
                      <option value="Issued">Issued (I have my 14-char CAS)</option>
                    </select>
                    {formData.casStatus === 'Issued' && (
                      <input
                        type="text"
                        value={formData.casNumber}
                        onChange={(e) => updateField('casNumber', e.target.value)}
                        placeholder="Enter 14-char CAS number"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Campus Location <span className="text-slate-500 text-[10px]">(OPTIONAL)</span>
                    </label>
                    <select
                      value={formData.campusRegion}
                      onChange={(e) => updateField('campusRegion', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                    >
                      <option value="Outer London">Outer London (Calculates 9-month living funds)</option>
                      <option value="Inner London">Inner London (Calculates 9-month living funds)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Total Tuition Fee (£) <span className="text-slate-500 text-[10px]">(OPTIONAL)</span>
                    </label>
                    <input
                      type="number"
                      value={formData.tuitionFee}
                      onChange={(e) => updateField('tuitionFee', e.target.value)}
                      placeholder="Course Fee Amount (£)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Deposit Paid (£) <span className="text-slate-500 text-[10px]">(OPTIONAL)</span>
                    </label>
                    <input
                      type="number"
                      value={formData.depositPaid}
                      onChange={(e) => updateField('depositPaid', e.target.value)}
                      placeholder="Deposit Amount (£)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Primary Sponsor <span className="text-slate-500 text-[10px]">(OPTIONAL)</span>
                    </label>
                    <select
                      value={formData.sponsorType}
                      onChange={(e) => updateField('sponsorType', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                    >
                      <option value="Biological Parents">Biological Parents (Pre-validates 28-day rule)</option>
                      <option value="Self">Self (Funds in student's name)</option>
                      <option value="Government Loan / Sponsor">Official Financial Sponsor / Government Loan</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              PAGE 08: RISK & BACKGROUND PROFILING (3 Cards)
             ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 7 && (
            <motion.div
              key="step-7"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-4xl space-y-6 text-left py-2"
            >
              <motion.h2 variants={itemVariants} className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Background &amp; Risk Profiling
              </motion.h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Card 1: Study Gaps */}
                <motion.div variants={itemVariants} className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-3">
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-black uppercase">Optional</span>
                  <h4 className="font-bold text-white text-sm">Study Gaps</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Do you have any academic gaps exceeding 12 months? You can note them now or upload employment evidence later in Stage 2.
                  </p>
                  <div className="flex gap-2 pt-1">
                    {['No', 'Yes'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateField('hasStudyGaps', opt)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                          formData.hasStudyGaps === opt
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-950 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {formData.hasStudyGaps === 'Yes' && (
                    <input
                      type="text"
                      value={formData.studyGapExplanation}
                      onChange={(e) => updateField('studyGapExplanation', e.target.value)}
                      placeholder="State reason (e.g. Work experience)..."
                      className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                    />
                  )}
                </motion.div>

                {/* Card 2: Immigration Log */}
                <motion.div variants={itemVariants} className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-3">
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-black uppercase">Optional</span>
                  <h4 className="font-bold text-white text-sm">Immigration Log</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Prior UK or global visa refusals? Disclose early so your assigned counselor can prepare mitigation statements.
                  </p>
                  <div className="flex gap-2 pt-1">
                    {['No', 'Yes'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateField('hasVisaRefusal', opt)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                          formData.hasVisaRefusal === opt
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-950 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {formData.hasVisaRefusal === 'Yes' && (
                    <input
                      type="text"
                      value={formData.visaRefusalExplanation}
                      onChange={(e) => updateField('visaRefusalExplanation', e.target.value)}
                      placeholder="Refusal country & approximate date..."
                      className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                    />
                  )}
                </motion.div>

                {/* Card 3: Return Goals */}
                <motion.div variants={itemVariants} className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-3">
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-black uppercase">Optional</span>
                  <h4 className="font-bold text-white text-sm">Return Goals</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Target job titles and industry employers in your home country. You can refine these during the Stage 2 Defense Pack.
                  </p>
                  <input
                    type="text"
                    value={formData.targetReturnRole}
                    onChange={(e) => updateField('targetReturnRole', e.target.value)}
                    placeholder="e.g. Senior Data Analyst at KPMG"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none mt-2"
                  />
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              PAGE 09: TARGET OUTCOME (What We Plan to Achieve)
             ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 8 && (
            <motion.div
              key="step-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-4xl space-y-8 text-left py-4"
            >
              <motion.h2 variants={itemVariants} className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                What We Plan to Achieve
              </motion.h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center pt-2">
                <motion.div variants={itemVariants} className="p-8 bg-slate-900/80 border border-slate-800 rounded-3xl text-center space-y-2 backdrop-blur-xl">
                  <div className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-emerald-400">
                    100%
                  </div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Credibility Readiness
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="md:col-span-2 space-y-4">
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Unshakeable Interview Confidence
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    By completing this guided onboarding and the 4-stage pipeline, you will master every aspect of your university choice, understand the strict 28-day financial rules, and articulate your career goals with precision.
                  </p>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    No hesitation, no robotic memorization—just clear, authentic credibility.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              PAGE 10: TRAINING MILESTONES (Your Training Milestones)
             ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 9 && (
            <motion.div
              key="step-9"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-4xl space-y-6 text-left py-4"
            >
              <motion.h2 variants={itemVariants} className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Your Training Milestones
              </motion.h2>

              <div className="space-y-4 pt-2">
                {[
                  { title: 'Foundational Mastery', desc: 'Conquer 5 UKVI seed modules covering financial compliance, genuine student tests, and interview conduct with an 80%+ score threshold.' },
                  { title: 'Verified Defense Pack', desc: 'Build an airtight personal portfolio compiling your exact living costs, sponsor income verification, and course module comparisons.' },
                  { title: 'AI & Counselor Simulation', desc: 'Practice real-time spoken mock interviews evaluated against Home Office rubrics with immediate red flag detection.' },
                  { title: 'Institutional CAS Clearance', desc: 'Receive counselor sign-off certifying that your application is 100% ready for submission.' },
                ].map((item, idx) => (
                  <motion.div key={idx} variants={itemVariants} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{item.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              PAGE 11: MANUAL COUNSELOR MATCHING (Dedicated Counselor Support)
             ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 10 && (
            <motion.div
              key="step-10"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-4"
            >
              <div className="space-y-4 text-left">
                <motion.h2 variants={itemVariants} className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  Dedicated Counselor Support
                </motion.h2>
                <motion.h3 variants={itemVariants} className="text-indigo-400 font-bold text-base uppercase tracking-wider">
                  Manual Admin Pairing
                </motion.h3>
                <motion.p variants={itemVariants} className="text-slate-300 text-sm leading-relaxed">
                  Upon completing this wizard, our Admin team manually reviews your profile, target course, and study background to pair you with a specialized senior compliance counselor.
                </motion.p>
                <motion.p variants={itemVariants} className="text-slate-400 text-sm leading-relaxed">
                  Your designated counselor reviews your Defense Pack, grades your mock interview submissions, and provides 1-on-1 feedback.
                </motion.p>
              </div>

              <motion.div variants={itemVariants} className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl h-[320px] bg-slate-900">
                <Image 
                  src="/images/onboarding/pdf-counselor-support.jpg" 
                  alt="Counselor support" 
                  fill 
                  className="object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
              </motion.div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              PAGE 12: SETUP COMPLETE (Ready to Begin?)
             ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 11 && (
            <motion.div
              key="step-11"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-2xl text-center space-y-6 py-4"
            >
              <motion.div variants={itemVariants} className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-3xl flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  Ready to Begin?
                </h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                  Your profile is configured. An admin will assign your personal counselor while you start Stage 1: The Knowledge Forges.
                </p>
                <p className="text-[11px] text-slate-500 font-bold tracking-widest uppercase pt-1">
                  BASECHAN WISER Compliance OS • student.basechanwiser.com
                </p>
              </motion.div>

              {/* Profile Review Summary Card */}
              <motion.div variants={itemVariants} className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl max-w-md mx-auto text-left space-y-2.5 text-xs text-slate-300">
                <div className="flex justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-500">Legal Name:</span>
                  <span className="font-bold text-white">{formData.fullName || 'Registered Student'}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-bold text-white">{formData.email}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-500">Target University:</span>
                  <span className="font-bold text-white">{formData.schoolOfChoice || 'To be updated in Stage 2'}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-500">Counselor Status:</span>
                  <span className="font-bold text-amber-400">Admin Will Assign Manually</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Immediate Access:</span>
                  <span className="font-bold text-emerald-400">Stage 1: The Knowledge Forges</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* ── BOTTOM NAVIGATION TOOLBAR (Rendered ONLY on Steps 2-12; Hidden on Step 1) ── */}
      {currentStep > 0 ? (
        <footer className="relative z-20 w-full max-w-6xl mx-auto px-6 py-4 border-t border-slate-900/80 flex items-center justify-between shrink-0">
          {/* Secondary Back Button */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={isSubmitting}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white disabled:opacity-20 px-4 py-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-4">
            {/* Skip for now on optional questionnaire steps (6, 7) */}
            {(currentStep === 6 || currentStep === 7) && (
              <button
                type="button"
                onClick={handleNext}
                className="text-xs text-slate-500 hover:text-slate-300 font-semibold uppercase tracking-wider transition-colors"
              >
                Skip for now &rarr;
              </button>
            )}

            {currentStep < TOTAL_STEPS - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95"
              >
                <span>Next Slide</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteRegistration}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-600/30 hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Activating Profile...' : 'Complete Setup & Enter Stage 1'}</span>
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        </footer>
      ) : (
        /* Empty footer spacer on Step 1 so layout stays perfectly balanced */
        <div className="h-6 w-full" />
      )}

      {/* Returning User Quick Login Modal */}
      {isLoginModalOpen && (
        <LoginModal onClose={() => setIsLoginModalOpen(false)} />
      )}
    </div>
  );
}
