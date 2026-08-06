"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth/auth-context';
import { AlertTriangle, UserPlus, Loader2, CheckCircle2 } from 'lucide-react';

interface UnassignedStudent {
  id: string;
  displayName: string;
  email: string;
}

interface CounselorStats {
  id: string;
  displayName: string;
  assignedCount: number;
}

export default function LeadAssignmentModal() {
  const { effectiveRole } = useAuth();
  const [unassignedStudents, setUnassignedStudents] = useState<UnassignedStudent[]>([]);
  const [counselors, setCounselors] = useState<CounselorStats[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run for Admins
    if (effectiveRole !== 'Admin' && effectiveRole !== 'Super Admin') {
      setLoading(false);
      return;
    }

    const fetchAssignmentData = async () => {
      try {
        const usersRef = collection(db, 'Users');

        // 1. Fetch Unassigned Students
        // Note: Checking for both undefined/null counselorId
        const studentsQuery = query(usersRef, where('role', '==', 'Student'));
        const studentsSnap = await getDocs(studentsQuery);

        // Filter manually for counselorId absence since Firestore '!=' queries are limited
        const unassigned = studentsSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter(s => !s.counselorId)
          .map(s => ({ id: s.id, displayName: s.displayName, email: s.email } as UnassignedStudent));

        // 2. Fetch Counselors
        const counselorsQuery = query(usersRef, where('role', '==', 'Counselor'));
        const counselorsSnap = await getDocs(counselorsQuery);

        // 3. Calculate workloads from all students
        const workloadMap = new Map<string, number>();
        studentsSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.counselorId) {
            workloadMap.set(data.counselorId, (workloadMap.get(data.counselorId) || 0) + 1);
          }
        });

        const availableCounselors = counselorsSnap.docs.map(doc => ({
          id: doc.id,
          displayName: doc.data().displayName,
          assignedCount: workloadMap.get(doc.id) || 0
        }));

        setUnassignedStudents(unassigned);
        setCounselors(availableCounselors.sort((a, b) => a.assignedCount - b.assignedCount));
      } catch (error) {
        console.error("Error fetching assignment data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignmentData();
  }, [effectiveRole]);

  const assignStudent = async (studentId: string, counselorId: string) => {
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'Users', studentId), {
        counselorId,
        updatedAt: serverTimestamp()
      });
      // Remove student from local state
      setUnassignedStudents(prev => prev.filter(s => s.id !== studentId));
      // Increase counselor count locally
      setCounselors(prev => prev.map(c =>
        c.id === counselorId ? { ...c, assignedCount: c.assignedCount + 1 } : c
      ));
    } catch (error) {
      console.error("Failed to assign student:", error);
      alert("Failed to assign student. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading || unassignedStudents.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-xl w-full p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden flex flex-col max-h-[90vh]">

        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <AlertTriangle size={28}/>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Assignment Pending</h2>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-0.5">
              {unassignedStudents.length} New Student Leads
            </p>
          </div>
        </div>

        <p className="text-slate-300 mb-8 text-sm leading-relaxed">
          The following scholars have registered but haven't been assigned to a counselor yet.
          Please balance the workload to ensure prompt UKVI support.
        </p>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {unassignedStudents.map(student => (
            <div key={student.id} className="bg-slate-800/50 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0">
                  <p className="text-white font-bold truncate">{student.displayName || "Anonymous Scholar"}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{student.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-500/20 uppercase tracking-tighter">
                    Unassigned
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <select
                    onChange={(e) => assignStudent(student.id, e.target.value)}
                    disabled={isProcessing}
                    defaultValue=""
                    className="w-full bg-slate-900 border border-slate-700 text-xs font-bold rounded-xl pl-10 pr-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none appearance-none cursor-pointer transition-all disabled:opacity-50"
                  >
                    <option value="" disabled>Choose Counselor to Assign...</option>
                    {counselors.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.displayName} — {c.assignedCount} Active Leads
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
           <span>Load Balancing System Active</span>
           {isProcessing && (
             <span className="flex items-center gap-2 text-indigo-400">
               <Loader2 size={12} className="animate-spin" />
               Processing Assignment...
             </span>
           )}
        </div>
      </div>
    </div>
  );
}
