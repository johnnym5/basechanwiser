'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import StealthOnboardingWizard from '@/components/auth/StealthOnboardingWizard';

export default function LoginPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (!loading && user && role) {
      if (role === 'Super Admin') {
        router.push('/admin/analytics');
      } else if (role === 'Head of Compliance') {
        router.push('/head-of-compliance/dashboard');
      } else if (role === 'Admin' || role === 'Counselor') {
        router.push('/counselor/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, role, loading, router]);

  return <StealthOnboardingWizard />;
}
