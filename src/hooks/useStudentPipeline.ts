"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { withTimeout } from '@/lib/utils/promise-timeout';

export type StageStatus = 'locked' | 'current' | 'completed';

export interface PipelineStage {
  id: number;
  title: string;
  status: StageStatus;
  isUnlocked: boolean;
  isCompleted: boolean;
}

export interface PipelineData {
  currentStage: number;
  stages: PipelineStage[];
  loading: boolean;
  stats: {
    passedModules: string[];
    packStatus: string | null;
    mockStatus: string | null;
  };
}

const CACHE_KEY_PREFIX = 'student_pipeline_cache_';

/**
 * Custom Hook: useStudentPipeline
 * Tracks 4-stage progression with Stale-While-Revalidate (SWR) session caching
 * for 0ms navigation loading state.
 */
export function useStudentPipeline(userId: string | null | undefined) {
  const [data, setData] = useState<PipelineData>({
    currentStage: 1,
    stages: [],
    loading: true,
    stats: {
      passedModules: [],
      packStatus: null,
      mockStatus: null
    }
  });

  useEffect(() => {
    if (!userId) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;

    // 1. SWR Session Cache Hydration (0ms Rendering)
    try {
      const cachedStr = sessionStorage.getItem(cacheKey);
      if (cachedStr) {
        const cachedData = JSON.parse(cachedStr);
        setData({ ...cachedData, loading: false });
      }
    } catch (e) {
      console.warn("[useStudentPipeline] Cache read failed:", e);
    }

    // 2. Background Revalidation from Firestore
    const fetchPipeline = async () => {
      try {
        const coreSnap = await withTimeout(getDocs(query(
          collection(db, "test_question_sets"),
          where("category", "==", "core"),
          where("isArchived", "==", false)
        )), 10000);
        const coreIds = coreSnap.docs.map(d => d.id);
        const totalCoreCount = coreIds.length || 5;

        const quizQ = query(collection(db, "quiz_attempts"), where("userId", "==", userId));
        const quizSnap = await withTimeout(getDocs(quizQ), 10000);
        const passedCoreModules = new Set<string>();

        quizSnap.docs.forEach(d => {
          const attempt = d.data();
          const packId = attempt.packId || attempt.setId;
          if ((attempt.passed || (attempt.scorePercentage >= 80)) && coreIds.includes(packId)) {
            passedCoreModules.add(packId);
          }
        });

        const isStage1Complete = passedCoreModules.size >= totalCoreCount;

        const packRef = doc(db, "Interview_Packs", userId);
        const packSnap = await withTimeout(getDoc(packRef), 10000);
        const packData = packSnap.exists() ? packSnap.data() : null;
        const packStatus = packData?.status;
        const isStage2Complete = packSnap.exists() &&
          ['completed', 'exported', 'Submitted', 'Verified'].includes(packStatus);

        const mockQ = query(
          collection(db, "mock_interview_attempts"),
          where("studentId", "==", userId),
          orderBy("submittedAt", "desc"),
          limit(1)
        );
        const mockSnap = await withTimeout(getDocs(mockQ), 10000);
        const mockData = !mockSnap.empty ? mockSnap.docs[0].data() : null;
        const mockStatus = mockData?.status;

        const normalizedMockStatus = mockStatus?.toLowerCase();
        const isStage3Complete = !mockSnap.empty &&
          ['pending_review', 'accepted', 'rejected'].includes(normalizedMockStatus);

        let currentStage = 1;
        if (isStage1Complete) currentStage = 2;
        if (isStage1Complete && isStage2Complete) currentStage = 3;
        if (isStage1Complete && isStage2Complete && isStage3Complete) currentStage = 4;

        const stages: PipelineStage[] = [
          {
            id: 1,
            title: "Core Study Modules",
            isUnlocked: true,
            isCompleted: isStage1Complete,
            status: isStage1Complete ? 'completed' : (currentStage === 1 ? 'current' : 'locked')
          },
          {
            id: 2,
            title: "Interview Details",
            isUnlocked: isStage1Complete,
            isCompleted: isStage2Complete,
            status: isStage2Complete ? 'completed' : (currentStage === 2 ? 'current' : 'locked')
          },
          {
            id: 3,
            title: "Practice Interview",
            isUnlocked: isStage1Complete && isStage2Complete,
            isCompleted: isStage3Complete,
            status: isStage3Complete ? 'completed' : (currentStage === 3 ? 'current' : 'locked')
          },
          {
            id: 4,
            title: "Final Check",
            isUnlocked: isStage1Complete && isStage2Complete && isStage3Complete,
            isCompleted: false,
            status: currentStage === 4 ? 'current' : 'locked'
          }
        ];

        const freshPipeline: PipelineData = {
          currentStage,
          stages,
          loading: false,
          stats: {
            passedModules: Array.from(passedCoreModules),
            packStatus,
            mockStatus
          }
        };

        setData(freshPipeline);

        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(freshPipeline));
        } catch (e) {
          console.warn("[useStudentPipeline] Cache write failed:", e);
        }
      } catch (error) {
        console.error("Error fetching pipeline data:", error);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchPipeline();
  }, [userId]);

  return data;
}
