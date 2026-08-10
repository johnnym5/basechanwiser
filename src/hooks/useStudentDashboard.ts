"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { differenceInDays, startOfDay, subDays, isSameDay } from 'date-fns';

export interface DashboardData {
  readiness: number;
  passedModulesCount: number;
  streak: number;
  points: number;
  nextModuleId: string | null;
  nextModuleOrder: number;
  recentActivity: any[];
  interviewPackSubmitted: boolean;
  bestMockScore: number;
}

/**
 * Custom Hook: useStudentDashboard
 * Aggregates student progress, gamification stats, and calculates total readiness.
 */
export function useStudentDashboard(userId: string | null | undefined) {
  const [data, setData] = useState<DashboardData>({
    readiness: 0,
    passedModulesCount: 0,
    streak: 0,
    points: 0,
    nextModuleId: null,
    nextModuleOrder: 1,
    recentActivity: [],
    interviewPackSubmitted: false,
    bestMockScore: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Quiz Attempts (Passed & Total)
        const quizQ = query(collection(db, "quiz_attempts"), where("userId", "==", userId));
        const quizSnap = await getDocs(quizQ);
        const attempts = quizSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const passedModuleIds = new Set(attempts.filter((a: any) => a.passed).map((a: any) => a.packId));
        const passedCount = Math.min(passedModuleIds.size, 5); // Max 5 modules

        // 2. Fetch Interview Pack Status
        const packRef = doc(db, "Interview_Packs", userId);
        const packSnap = await getDoc(packRef);
        const packSubmitted = packSnap.exists() && (packSnap.data()?.status === "Submitted" || packSnap.data()?.status === "Verified");

        // 3. Fetch Mock Interview Sessions
        const mockQ = query(collection(db, "ai_mock_sessions"), where("userId", "==", userId), orderBy("finalScore", "desc"), limit(1));
        const mockSnap = await getDocs(mockQ);
        const bestMockScore = mockSnap.empty ? 0 : mockSnap.docs[0].data().finalScore || 0;

        // 4. Calculate Readiness (Weighted Formula)
        // Modules: (Passed / 5) * 50%
        // Pack: Submitted ? 20% : 0%
        // Mock: (Best Score / 100) * 30%
        const moduleWeight = (passedCount / 5) * 50;
        const packWeight = packSubmitted ? 20 : 0;
        const mockWeight = (bestMockScore / 100) * 30;
        const totalReadiness = Math.round(moduleWeight + packWeight + mockWeight);

        // 5. Calculate Points
        // 100 per mod, 500 for pack, 10 per 1% on mock
        const points = (passedCount * 100) + (packSubmitted ? 500 : 0) + (bestMockScore * 10);

        // 6. Find Next Module
        let nextModOrder = passedCount + 1;
        if (nextModOrder > 5) nextModOrder = 5;
        const nextModId = `module_${nextModOrder}`;

        // 7. Recent Activity (3 items)
        const recent = attempts
          .sort((a: any, b: any) => {
            const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
            const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
            return dateB - dateA;
          })
          .slice(0, 3);

        setData({
          readiness: totalReadiness,
          passedModulesCount: passedCount,
          streak: calculateStreak(attempts),
          points,
          nextModuleId: nextModId,
          nextModuleOrder: nextModOrder,
          recentActivity: recent,
          interviewPackSubmitted: packSubmitted,
          bestMockScore
        });

      } catch (error) {
        console.error("[useStudentDashboard] Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId]);

  return { data, loading };
}

/**
 * Helper: Calculate Day Streak
 * Counts backwards from today/yesterday until a gap > 48 hours is found.
 */
function calculateStreak(attempts: any[]): number {
  if (attempts.length === 0) return 0;

  // Extract unique activity dates (start of day)
  const dates = attempts
    .map(a => a.createdAt?.seconds ? startOfDay(new Date(a.createdAt.seconds * 1000)) : null)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => b.getTime() - a.getTime());

  if (dates.length === 0) return 0;

  const uniqueDates: Date[] = [];
  const seen = new Set();
  dates.forEach(d => {
    const time = d.getTime();
    if (!seen.has(time)) {
      uniqueDates.push(d);
      seen.add(time);
    }
  });

  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);

  // If no activity today or yesterday, streak is dead
  if (!isSameDay(uniqueDates[0], today) && !isSameDay(uniqueDates[0], yesterday)) {
    return 0;
  }

  let streak = 0;
  let currentCheck = isSameDay(uniqueDates[0], today) ? today : yesterday;

  for (let i = 0; i < uniqueDates.length; i++) {
    if (isSameDay(uniqueDates[i], currentCheck)) {
      streak++;
      currentCheck = subDays(currentCheck, 1);
    } else {
      break;
    }
  }

  return streak;
}
