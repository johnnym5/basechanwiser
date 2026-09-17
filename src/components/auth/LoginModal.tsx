'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth/auth-context';
import { LogIn, X, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { signInWithGoogle, signInWithNameAndEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [useStudentQuickLogin, setUseStudentQuickLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const routeByRole = (role: string | null) => {
    if (role === 'Super Admin') {
      router.push('/admin/analytics');
    } else if (role === 'Head of Compliance') {
      router.push('/head-of-compliance/dashboard');
    } else if (role === 'Admin' || role === 'Counselor' || role === 'admin' || role === 'counselor') {
      router.push('/counselor/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      const userSnap = await getDoc(doc(db, 'Users', user.uid));
      let role = userSnap.exists() ? userSnap.data()?.role : null;
      if (!role) {
        const fallbackSnap = await getDoc(doc(db, 'users', user.uid));
        if (fallbackSnap.exists()) role = fallbackSnap.data()?.role;
      }

      routeByRole(role);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setErrorMsg('Invalid email or password. Please try again.');
      } else {
        setErrorMsg(err.message || 'Login failed. Please check your credentials.');
      }
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // Auth context triggers role evaluation and redirects
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setErrorMsg(err.message || 'Google Sign-In failed.');
      setIsLoading(false);
    }
  };

  const handleStudentQuickSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await signInWithNameAndEmail(fullName.trim(), email.trim().toLowerCase());
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Sign-In failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-white font-black uppercase tracking-wider text-sm">
            <LogIn className="w-5 h-5 text-indigo-400" />
            <span>Sign In to BASECHAN WISER</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1-Click Google Sign-In */}
        <div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">or email credentials</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Email Login Form */}
        {!useStudentQuickLogin ? (
          <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 active:scale-[0.99]"
            >
              {isLoading ? 'Signing In...' : 'Log In to Dashboard'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => { setUseStudentQuickLogin(true); setErrorMsg(null); }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                Existing Student Quick Login (Name &amp; Email)
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleStudentQuickSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your Full Name"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 active:scale-[0.99]"
            >
              {isLoading ? 'Signing In...' : 'Quick Login'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => { setUseStudentQuickLogin(false); setErrorMsg(null); }}
                className="text-xs text-slate-400 hover:text-white font-semibold transition-colors"
              >
                ← Back to Password Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
