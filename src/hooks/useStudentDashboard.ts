"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { startOfDay, subDays, isSameDay } from 'date-fns';
import { withTimeout } from '@/lib/utils/promise-timeout';

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

const CACHE_KEY_PREFIX = 'student_dashboard_cache_';

/**
 * Custom Hook: useStudentDashboard
 * Aggregates student progress with Stale-While-Revalidate SWR session caching
 * to achieve 0ms navigation delays when switching pages.
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

    let isMounted = true;
    const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;

    // 1. Instant SWR Hydration from Session Cache (0ms Delay)
    try {
      const cachedStr = sessionStorage.getItem(cacheKey);
      if (cachedStr) {
        const cachedData = JSON.parse(cachedStr);
        setData(cachedData);
        setLoading(false); // Render cached UI instantly
      }
    } catch (e) {
      console.warn("[useStudentDashboard] Cache read failed:", e);
    }

    // 2. Background Revalidation from Firestore
    const fetchDashboardData = async () => {
      try {
        const quizQ = query(collection(db, "quiz_attempts"), where("userId", "==", userId));
        const quizSnap = await withTimeout(getDocs(quizQ), 10000);
        const attempts = quizSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const passedModuleIds = new Set(attempts.filter((a: any) => a.passed || (a.scorePercentage >= 80)).map((a: any) => a.packId || a.setId));
        const passedCount = passedModuleIds.size;

        const packRef = doc(db, "Interview_Packs", userId);
        const packSnap = await withTimeout(getDoc(packRef), 10000);
        const packSubmitted = packSnap.exists() && (packSnap.data()?.status === "Submitted" || packSnap.data()?.status === "Verified" || packSnap.data()?.status === "completed");

        const mockQ = query(collection(db, "ai_mock_sessions"), where("userId", "==", userId), orderBy("finalScore", "desc"), limit(1));
        const mockSnap = await withTimeout(getDocs(mockQ), 10000);
        const bestMockScore = mockSnap.empty ? 0 : mockSnap.docs[0].data().finalScore || 0;

        if (isMounted) {
          const moduleWeight = (passedCount / 5) * 50;
          const packWeight = packSubmitted ? 20 : 0;
          const mockWeight = (bestMockScore / 100) * 30;
          const totalReadiness = Math.round(moduleWeight + packWeight + mockWeight);

          const points = (passedCount * 100) + (packSubmitted ? 500 : 0) + (bestMockScore * 10);

          let nextModOrder = passedCount + 1;
          if (nextModOrder > 5) nextModOrder = 5;
          const nextModId = `module_${nextModOrder}`;

          const recent = attempts
            .sort((a: any, b: any) => {
              const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
              const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
              return dateB - dateA;
            })
            .slice(0, 3);

          const freshData: DashboardData = {
            readiness: totalReadiness,
            passedModulesCount: passedCount,
            streak: calculateStreak(attempts),
            points,
            nextModuleId: nextModId,
            nextModuleOrder: nextModOrder,
            recentActivity: recent,
            interviewPackSubmitted: packSubmitted,
            bestMockScore
          };

          setData(freshData);
          setLoading(false);

          // Persist to session cache for instant future page transitions
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(freshData));
          } catch (e) {
            console.warn("[useStudentDashboard] Cache write failed:", e);
          }
        }
      } catch (error) {
        console.error("[useStudentDashboard] Fetch Error:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { data, loading };
}

function calculateStreak(attempts: any[]): number {
  if (attempts.length === 0) return 0;

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
