'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { 
  ArrowRight, ArrowLeft, CheckCircle2, Sparkles, 
  X, AlertCircle, Compass 
} from 'lucide-react';

const TOTAL_STEPS = 6;

// High-resolution cinematic background images paired to each slide
const SLIDE_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop', // Graduation / Campus
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop', // Writing / Passport
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop', // UK University Architecture
  'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2070&auto=format&fit=crop', // Finance / Accounting
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop', // Career / Skyline
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop', // Activation / Success
];

export default function StealthOnboardingWizard({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 2: Credentials & Identity (Required)
    fullName: '',
    email: '',
    password: '',
    countryOfResidence: '',

    // Step 3: Academic Choice (Optional)
    schoolOfChoice: '',
    courseTitle: '',
    rqfLevel: "RQF Level 7 (Master's)",
    targetIntake: '',

    // Step 4: Financial & CAS Readiness (Optional)
    casStatus: 'Pending',
    casNumber: '',
    tuitionFee: '',
    depositPaid: '',
    campusRegion: 'Outer London',
    sponsorType: 'Biological Parents',

    // Step 5: Risk & History (Optional)
    hasStudyGaps: 'No',
    studyGapExplanation: '',
    hasVisaRefusal: 'No',
    visaRefusalExplanation: '',
    targetReturnRole: ''
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const stepsMeta = [
    { title: 'Welcome & Vision', progress: 16 },
    { title: 'Student Passport & Identity', progress: 33 },
    { title: 'Target UK Program', progress: 50 },
    { title: 'CAS & Financial Readiness', progress: 67 },
    { title: 'Immigration & Career Risk', progress: 83 },
    { title: 'Pipeline Activation', progress: 100 },
  ];

  const handleNext = () => {
    setErrorMsg(null);
    // Strict validation ONLY on Step 2 (Identity & Credentials)
    if (currentStep === 1) {
      if (!formData.fullName.trim() || !formData.email.trim() || !formData.password || !formData.countryOfResidence.trim()) {
        setErrorMsg('Please provide your full legal name, email, password, and country to create your account.');
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

  const handleCompleteRegistration = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      // 1. Create Firebase Auth Account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );
      const user = userCredential.user;

      // 2. Set Display Name
      await updateProfile(user, { displayName: formData.fullName.trim() });

      // 3. Prepare Comprehensive Profile Payload
      const userPayload = {
        uid: user.uid,
        displayName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        role: 'Student',
        countryOfResidence: formData.countryOfResidence,
        onboardingCompleted: true,

        // Manual Counselor Assignment Status (Waiting for Admin Pairing)
        assignedCounselorId: null,
        assignedCounselorName: null,
        counselorMatchStatus: 'PENDING_ADMIN_ASSIGNMENT',

        // Optional Academic Profile
        academic: {
          targetUniversity: formData.schoolOfChoice || null,
          courseName: formData.courseTitle || null,
          rqfLevel: formData.rqfLevel || null,
          intake: formData.targetIntake || null,
        },

        // Optional Financial Profile
        financials: {
          casStatus: formData.casStatus,
          casNumber: formData.casNumber || null,
          tuitionFee: formData.tuitionFee ? Number(formData.tuitionFee) : null,
          depositPaid: formData.depositPaid ? Number(formData.depositPaid) : null,
          campusRegion: formData.campusRegion,
          sponsorType: formData.sponsorType,
        },

        // Optional Risk & Background Profile
        background: {
          hasStudyGaps: formData.hasStudyGaps === 'Yes',
          studyGapExplanation: formData.studyGapExplanation || null,
          hasVisaRefusal: formData.hasVisaRefusal === 'Yes',
          visaRefusalExplanation: formData.visaRefusalExplanation || null,
          targetReturnRole: formData.targetReturnRole || null,
        },

        // Pipeline State: Stage 1 (The Knowledge Forges) unlocked immediately
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

      // Write to canonical 'Users' collection for security rules and dashboard compatibility
      await setDoc(doc(db, 'Users', user.uid), userPayload, { merge: true });

      // Also mirror to 'users' collection for backward compatibility
      try {
        await setDoc(doc(db, 'users', user.uid), userPayload, { merge: true });
      } catch (mirrorErr) {
        console.warn('Mirror to users collection skipped/non-fatal:', mirrorErr);
      }

      // 4. Send directly to Dashboard
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      
      {/* 1. CINEMATIC SLOW PAN-AND-TILT BACKGROUND (Ken Burns Effect) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {SLIDE_BACKGROUNDS.map((bgUrl, idx) => (
          <div
            key={bgUrl}
            className={`absolute inset-[-15%] bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              currentStep === idx ? 'opacity-35 animate-ken-burns' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url('${bgUrl}')` }}
          />
        ))}
        {/* Soft color gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/60" />
      </div>

      {/* 2. 90% FROSTED GLASS CONTAINER */}
      <div className="relative z-10 w-full max-w-4xl h-[92vh] max-h-[860px] mx-4 bg-slate-950/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl shadow-2xl flex flex-col justify-between p-6 sm:p-10 overflow-hidden">
        
        {/* TOP PROGRESSION SLIDER */}
        <div className="w-full shrink-0">
          <div className="flex items-center justify-between mb-3 text-xs font-bold uppercase tracking-wider">
            <span className="text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
              STEP {String(currentStep + 1).padStart(2, '0')} OF {String(TOTAL_STEPS).padStart(2, '0')}
            </span>
            <span className="text-slate-400 font-semibold truncate px-2">
              {stepsMeta[currentStep].title}
            </span>
            <span className="text-emerald-400">
              {stepsMeta[currentStep].progress}% COMPLETE
            </span>
          </div>

          <div className="w-full h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-700 ease-out"
              style={{ width: `${stepsMeta[currentStep].progress}%` }}
            />
          </div>
        </div>

        {/* CLOSE BUTTON */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white rounded-xl hover:bg-slate-900/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* SLIDE CONTENT AREA (Fades in & pans left-to-right on change) */}
        <div key={currentStep} className="w-full max-w-2xl mx-auto my-auto py-6 animate-slide-pan overflow-y-auto max-h-[60vh] pr-1">
          
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SLIDE 01: Welcome Narrative */}
          {currentStep === 0 && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest">
                <Compass className="w-3.5 h-3.5" />
                <span>UKVI Credibility Compliance System</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Welcome to BASECHAN WISER
              </h2>
              <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                We are a mission-critical visa compliance platform. Over the next few slides, we'll calibrate your student profile so you can train for your university Pre-CAS and Home Office credibility interviews with complete confidence.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left pt-2">
                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
                  <h4 className="font-bold text-white text-sm mb-1 text-indigo-400">Zero Refusals</h4>
                  <p className="text-xs text-slate-400">Master every question with authentic answers—no robotic scripts.</p>
                </div>
                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
                  <h4 className="font-bold text-white text-sm mb-1 text-emerald-400">Flexible Inputs</h4>
                  <p className="text-xs text-slate-400">CAS not issued yet? All academic details are optional to begin.</p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 02: Student Credentials (Required) */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white">Create Your Student Credentials</h2>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 font-bold uppercase">Required</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">This will be your permanent login and official compliance identity.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Full Legal Name <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    placeholder="Exact match to your international passport"
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
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
                    placeholder="student@example.com"
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
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
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Country of Residence <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.countryOfResidence}
                    onChange={(e) => updateField('countryOfResidence', e.target.value)}
                    placeholder="e.g., Nigeria, Ghana, India, Kenya"
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 03: Academic Choice (Optional) */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white">Target UK Academic Program</h2>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 font-bold uppercase">Optional</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">If you haven't received your final admission offer yet, feel free to skip this for now.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">University of Choice</label>
                  <input
                    type="text"
                    value={formData.schoolOfChoice}
                    onChange={(e) => updateField('schoolOfChoice', e.target.value)}
                    placeholder="e.g. Coventry University, University of Leeds"
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Course Title</label>
                  <input
                    type="text"
                    value={formData.courseTitle}
                    onChange={(e) => updateField('courseTitle', e.target.value)}
                    placeholder="e.g. MSc Data Science"
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Course Level (RQF)</label>
                  <select
                    value={formData.rqfLevel}
                    onChange={(e) => updateField('rqfLevel', e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="RQF Level 7 (Master's)">RQF Level 7 (Master's Degree)</option>
                    <option value="RQF Level 6 (Bachelor's)">RQF Level 6 (Bachelor's Degree)</option>
                    <option value="RQF Level 8 (PhD)">RQF Level 8 (Doctorate / PhD)</option>
                    <option value="RQF Level 3/4 (Foundation)">RQF Level 3/4 (Foundation / Pre-Master)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Target Intake</label>
                  <input
                    type="text"
                    value={formData.targetIntake}
                    onChange={(e) => updateField('targetIntake', e.target.value)}
                    placeholder="e.g., September 2026, January 2027"
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 04: Financial & CAS Readiness (Optional) */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white">Financial &amp; CAS Readiness</h2>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 font-bold uppercase">Optional</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Helps calculate your required 28-day bank balance. Can be updated later in Stage 2.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">CAS Status</label>
                  <select
                    value={formData.casStatus}
                    onChange={(e) => updateField('casStatus', e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="Pending">Pending (Not Issued Yet)</option>
                    <option value="In Progress">In Progress (Interview Done)</option>
                    <option value="Issued">Issued (I have my 14-char CAS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Campus Location</label>
                  <select
                    value={formData.campusRegion}
                    onChange={(e) => updateField('campusRegion', e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="Outer London">Outside London (£1,023/mo maintenance)</option>
                    <option value="Inner London">Inner London (£1,334/mo maintenance)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Tuition Fee (£)</label>
                  <input
                    type="number"
                    value={formData.tuitionFee}
                    onChange={(e) => updateField('tuitionFee', e.target.value)}
                    placeholder="e.g. 16500"
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Deposit Paid (£)</label>
                  <input
                    type="number"
                    value={formData.depositPaid}
                    onChange={(e) => updateField('depositPaid', e.target.value)}
                    placeholder="e.g. 4000"
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 05: Risk & Background (Optional) */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white">Study Gaps &amp; Immigration History</h2>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 font-bold uppercase">Optional</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Disclosing gaps early lets your counselor craft airtight defense statements.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Do you have any academic gaps exceeding 12 months?
                  </label>
                  <div className="flex gap-4">
                    {['No', 'Yes'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateField('hasStudyGaps', opt)}
                        className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                          formData.hasStudyGaps === opt
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
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
                      placeholder="Briefly state reason (e.g., 3 years full-time work as Sales Lead)..."
                      className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none"
                    />
                  )}
                </div>

                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Have you ever had a visa refusal from the UK or any other country?
                  </label>
                  <div className="flex gap-4">
                    {['No', 'Yes'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateField('hasVisaRefusal', opt)}
                        className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                          formData.hasVisaRefusal === opt
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
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
                      placeholder="Provide refusal country and approximate date..."
                      className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 06: Review & Final Pipeline Activation */}
          {currentStep === 5 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">You're Ready to Launch!</h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto mt-2">
                  Finishing setup will register your credentials in Firebase and initialize your 4-stage clearance pipeline.
                </p>
              </div>

              <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl max-w-lg mx-auto text-left space-y-3 text-xs text-slate-300">
                <div className="flex justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-500">Student Legal Name:</span>
                  <span className="font-bold text-white">{formData.fullName}</span>
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
                  <span className="text-slate-500">Initial Unlocked Mission:</span>
                  <span className="font-bold text-emerald-400">Stage 1: The Knowledge Forges</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM NAVIGATION TOOLBAR */}
        <div className="w-full max-w-2xl mx-auto flex items-center justify-between pt-4 border-t border-slate-800/80 shrink-0">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0 || isSubmitting}
            className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none px-4 py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {currentStep < TOTAL_STEPS - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:scale-105"
            >
              <span>Next Slide</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCompleteRegistration}
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-600/20 hover:scale-105 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Activating Profile...' : 'Complete Setup & Enter OS'}</span>
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
