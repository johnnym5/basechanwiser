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

    const fetchPipeline = async () => {
      try {
        // 1. Fetch Quiz Attempts
        const quizQ = query(collection(db, "quiz_attempts"), where("userId", "==", userId));
        const quizSnap = await withTimeout(getDocs(quizQ), 10000);
        const passedModules = new Set<string>();
        quizSnap.docs.forEach(d => {
          const attempt = d.data();
          if (attempt.passed || (attempt.scorePercentage >= 80)) {
            passedModules.add(attempt.packId);
          }
        });

        const isStage1Complete = passedModules.size >= 5;

        // 2. Fetch Interview Pack Status
        const packRef = doc(db, "Interview_Packs", userId);
        const packSnap = await withTimeout(getDoc(packRef), 10000);
        const packData = packSnap.exists() ? packSnap.data() : null;
        const packStatus = packData?.status;
        // User requested: completed or exported. Existing code uses: Submitted or Verified.
        const isStage2Complete = packSnap.exists() &&
          ['completed', 'exported', 'Submitted', 'Verified'].includes(packStatus);

        // 3. Fetch Mock Interview Status
        // Logic: Check for any attempt with status PENDING_REVIEW, ACCEPTED, or REJECTED.
        const mockQ = query(
          collection(db, "mock_interview_attempts"),
          where("studentId", "==", userId),
          orderBy("submittedAt", "desc"),
          limit(1)
        );
        const mockSnap = await withTimeout(getDocs(mockQ), 10000);
        const mockData = !mockSnap.empty ? mockSnap.docs[0].data() : null;
        const mockStatus = mockData?.status;

        // Normalize status check (handling case sensitivity and different naming)
        const normalizedMockStatus = mockStatus?.toLowerCase();
        const isStage3Complete = !mockSnap.empty &&
          ['pending_review', 'accepted', 'rejected'].includes(normalizedMockStatus);

        // Calculate Current Stage
        let currentStage = 1;
        if (isStage1Complete) currentStage = 2;
        if (isStage1Complete && isStage2Complete) currentStage = 3;
        if (isStage1Complete && isStage2Complete && isStage3Complete) currentStage = 4;

        // Construct Stages Object
        const stages: PipelineStage[] = [
          {
            id: 1,
            title: "The Knowledge Forges",
            isUnlocked: true,
            isCompleted: isStage1Complete,
            status: isStage1Complete ? 'completed' : (currentStage === 1 ? 'current' : 'locked')
          },
          {
            id: 2,
            title: "The Defense Portfolio",
            isUnlocked: isStage1Complete,
            isCompleted: isStage2Complete,
            status: isStage2Complete ? 'completed' : (currentStage === 2 ? 'current' : 'locked')
          },
          {
            id: 3,
            title: "The Live Simulation",
            isUnlocked: isStage1Complete && isStage2Complete,
            isCompleted: isStage3Complete,
            status: isStage3Complete ? 'completed' : (currentStage === 3 ? 'current' : 'locked')
          },
          {
            id: 4,
            title: "Clearance & Counselor Review",
            isUnlocked: isStage1Complete && isStage2Complete && isStage3Complete,
            isCompleted: false, // This is the terminal stage
            status: currentStage === 4 ? 'current' : 'locked'
          }
        ];

        setData({
          currentStage,
          stages,
          loading: false,
          stats: {
            passedModules: Array.from(passedModules),
            packStatus,
            mockStatus
          }
        });
      } catch (error) {
        console.error("Error fetching pipeline data:", error);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchPipeline();
  }, [userId]);

  return data;
}
