"use client";

import { useEffect } from 'react';
import { collection, query, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth/auth-context';

export function useAdminAutoAssign() {
  const { effectiveRole } = useAuth();

  useEffect(() => {
    // Only allow Admins to run this background task
    if (effectiveRole !== 'Admin' && effectiveRole !== 'Super Admin') return;

    const runAutoAssign = async () => {
      try {
        const usersRef = collection(db, 'Users');
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        // 1. Find Unassigned Students
        const studentsQuery = query(usersRef, where('role', '==', 'Student'));
        const studentsSnap = await getDocs(studentsQuery);

        // Filter manually for stale leads (createdAt < 1 hour ago AND no counselorId)
        const unassignedStudents = studentsSnap.docs.filter(doc => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000) : null);
          return createdAt && createdAt < oneHourAgo && !data.counselorId;
        });

        if (unassignedStudents.length === 0) return; // Nothing to do

        // 2. Fetch Counselors & Workloads
        const counselorsQuery = query(usersRef, where('role', '==', 'Counselor'));
        const counselorsSnap = await getDocs(counselorsQuery);

        const workloadMap = new Map<string, number>();
        studentsSnap.docs.forEach(d => {
          const cId = d.data().counselorId;
          if (cId) {
            workloadMap.set(cId, (workloadMap.get(cId) || 0) + 1);
          }
        });

        const counselors = counselorsSnap.docs.map(cDoc => ({
          id: cDoc.id,
          count: workloadMap.get(cDoc.id) || 0
        }));

        if (counselors.length === 0) return;

        // 3. Load Balance using Batch Write
        const batch = writeBatch(db);
        let assignedCount = 0;

        for (const student of unassignedStudents) {
          counselors.sort((a, b) => a.count - b.count);
          const chosen = counselors[0];

          batch.update(student.ref, {
            counselorId: chosen.id,
            updatedAt: serverTimestamp()
          });
          chosen.count += 1;
          assignedCount++;
        }

        if (assignedCount > 0) {
          await batch.commit();
          console.log(`[Admin Background Task] Auto-assigned ${assignedCount} stale leads.`);
        }

      } catch (error) {
        console.error("Background Auto-Assign Error:", error);
      }
    };

    // Run immediately on load, then every 5 minutes
    runAutoAssign();
    const interval = setInterval(runAutoAssign, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [effectiveRole]);
}
