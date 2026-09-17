'use client';

import React, { useState } from 'react';
import StealthOnboardingWizard from '@/components/auth/StealthOnboardingWizard';
import LoginModal from '@/components/auth/LoginModal';
import { ArrowRight, LogIn, Sparkles, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

export default function AuthPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Ambient Pan-and-Tilt Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute inset-[-10%] bg-cover bg-center opacity-25 filter blur-[2px] animate-ken-burns"
          style={{
            backgroundImage: "url('/images/onboarding/auth-hero.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/90 to-slate-950" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600/90 border border-indigo-500/30 rounded-xl flex items-center justify-center p-1.5 shadow-lg shadow-indigo-600/30">
            <Image src="/logo.png" alt="Basechan Wiser Logo" width={32} height={32} className="object-contain" priority />
          </div>
          <span className="font-extrabold text-lg tracking-wider uppercase text-white">
            BASECHAN <span className="text-indigo-400">WISER</span>
          </span>
        </div>

        {/* Existing User Login Quick Trigger */}
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white px-4 py-2 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-slate-700 transition-all hover:scale-105"
        >
          <LogIn className="w-4 h-4 text-indigo-400" />
          <span>Log In</span>
        </button>
      </header>

      {/* Hero Welcome View */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 text-center flex flex-col items-center justify-center my-auto">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>UKVI Credibility Compliance OS</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight mb-6">
          Zero Credibility Refusals. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">
            Guaranteed Study Clearance.
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
          Prepare for university Pre-CAS and Home Office credibility interviews through our sequential 4-stage pipeline. Take the guided setup to establish your credentials.
        </p>

        {/* The Two Primary Action Gates */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md">
          {/* Sign Up -> Starts the Cinematic Setup Wizard */}
          <button
            onClick={() => setIsWizardOpen(true)}
            className="w-full sm:w-auto flex-1 flex items-center justify-center space-x-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-indigo-600/30 hover:scale-[1.02] group"
          >
            <span>Sign Up &amp; Setup</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Quick Login -> Opens Modal */}
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="w-full sm:w-auto flex-1 flex items-center justify-center space-x-2 px-8 py-4 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-bold text-sm uppercase tracking-wider rounded-xl transition-all backdrop-blur-md"
          >
            <span>I Have an Account</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-600 flex items-center justify-center space-x-2">
        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
        <span>BASECHAN WISER Compliance OS • Protected System</span>
      </footer>

      {/* The Fullscreen Stealth Wizard */}
      {isWizardOpen && (
        <StealthOnboardingWizard onClose={() => setIsWizardOpen(false)} />
      )}

      {/* Login Modal */}
      {isLoginModalOpen && (
        <LoginModal onClose={() => setIsLoginModalOpen(false)} />
      )}
    </div>
  );
}
