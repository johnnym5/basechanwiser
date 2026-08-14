import { adminDb as db } from "@/lib/firebaseAdmin";
import {
  AnalyticsDashboardData,
  CounselorPerformanceRow,
  CounselorWorkloadItem,
  FailureReasonItem,
  OfficePerformance,
  ReadinessFunnelStage,
  StudentRosterRow,
} from "@/types";

const BRANCH_OFFICES = ["Abuja", "Lagos", "Benin"] as const;

function normalizeOffice(office?: string | null): string {
  if (!office) return "Unassigned";
  const trimmed = office.trim();
  for (const branch of BRANCH_OFFICES) {
    if (trimmed.toLowerCase().includes(branch.toLowerCase())) return branch;
  }
  return trimmed;
}

function toMillis(ts: FirebaseFirestore.Timestamp | { seconds?: number; _seconds?: number } | undefined | null): number | null {
  if (!ts) return null;
  if (typeof (ts as FirebaseFirestore.Timestamp).toMillis === "function") {
    return (ts as FirebaseFirestore.Timestamp).toMillis();
  }
  const sec = (ts as { seconds?: number; _seconds?: number }).seconds ?? (ts as { _seconds?: number })._seconds;
  return sec != null ? sec * 1000 : null;
}

function toIsoDate(ts: FirebaseFirestore.Timestamp | { seconds?: number } | undefined | null): string | undefined {
  const ms = toMillis(ts);
  return ms != null ? new Date(ms).toISOString() : undefined;
}

function isStudent(data: FirebaseFirestore.DocumentData): boolean {
  const role = data.role;
  return !role || role === "Student";
}

function isCounselor(data: FirebaseFirestore.DocumentData): boolean {
  return data.role === "Counselor";
}

function isPassingStatus(status?: string): boolean {
  return status === "Green";
}

/**
 * Aggregate platform-wide compliance analytics server-side.
 * AI Mock and Engine dependencies removed.
 */
export async function aggregateAnalytics(): Promise<AnalyticsDashboardData> {
  const [usersSnap, evalsSnap] = await Promise.all([
    db.collection("Users").get(),
    db.collection("interview_evaluations").get(),
  ]);

  const students = usersSnap.docs.filter((d) => isStudent(d.data()));
  const counselors = usersSnap.docs.filter((d) => isCounselor(d.data()));

  type EvalSummary = {
    hasJuniorPass: boolean;
    hasSeniorHeadPass: boolean;
    headApprovedAt: number | null;
  };

  const evalsByStudent = new Map<string, EvalSummary>();
  const evalCountByCounselor = new Map<string, number>();
  const passCountByCounselor = new Map<string, number>();
  const failureReasonCounts = new Map<string, number>();

  evalsSnap.forEach((doc) => {
    const data = doc.data();
    const studentId = data.studentId as string | undefined;
    const counselorId = data.counselorId as string | undefined;
    const level = data.interviewLevel as string | undefined;
    const outcome = data.outcome as string | undefined;
    const createdAt = toMillis(data.createdAt);

    if (counselorId) {
      evalCountByCounselor.set(counselorId, (evalCountByCounselor.get(counselorId) || 0) + 1);
      const isPass = ["Pass", "Final Approve"].includes(outcome || "");
      if (isPass) {
        passCountByCounselor.set(counselorId, (passCountByCounselor.get(counselorId) || 0) + 1);
      }
    }

    if (Array.isArray(data.redFlags)) {
      for (const flag of data.redFlags) {
        if (typeof flag === "string" && flag.trim()) {
          failureReasonCounts.set(flag, (failureReasonCounts.get(flag) || 0) + 1);
        }
      }
    }

    if (!studentId) return;

    const summary = evalsByStudent.get(studentId) || {
      hasJuniorPass: false,
      hasSeniorHeadPass: false,
      headApprovedAt: null,
    };

    if (level === "Junior" && (outcome === "Pass" || outcome === "Escalate")) {
      summary.hasJuniorPass = true;
    }
    if (
      (level === "Senior" || level === "Head") &&
      (outcome === "Pass" || outcome === "Final Approve")
    ) {
      summary.hasSeniorHeadPass = true;
      if (level === "Head" && createdAt) {
        summary.headApprovedAt = createdAt;
      }
    }

    evalsByStudent.set(studentId, summary);
  });

  const totalPipeline = students.length;
  const greenStudents = students.filter((d) => isPassingStatus(d.data().readinessStatus));
  const globalPassRate =
    totalPipeline > 0 ? Math.round((greenStudents.length / totalPipeline) * 100) : 0;
  const highRiskAlert = students.filter((d) => d.data().readinessStatus === "Red").length;

  let prepTimeTotalDays = 0;
  let prepTimeCount = 0;
  for (const doc of greenStudents) {
    const data = doc.data();
    const createdMs = toMillis(data.createdAt);
    const evalSummary = evalsByStudent.get(doc.id);
    const greenMs = evalSummary?.headApprovedAt ?? toMillis(data.updatedAt) ?? createdMs;
    if (createdMs && greenMs && greenMs >= createdMs) {
      prepTimeTotalDays += (greenMs - createdMs) / (1000 * 60 * 60 * 24);
      prepTimeCount += 1;
    }
  }
  const averagePrepTimeDays =
    prepTimeCount > 0 ? Math.round((prepTimeTotalDays / prepTimeCount) * 10) / 10 : 0;

  const officePerformance: OfficePerformance[] = BRANCH_OFFICES.map((office) => {
    const officeStudents = students.filter(
      (d) => normalizeOffice(d.data().office || d.data().officeLocation) === office
    );
    const passed = officeStudents.filter((d) => isPassingStatus(d.data().readinessStatus)).length;
    return {
      office,
      totalStudents: officeStudents.length,
      passRate: officeStudents.length > 0 ? Math.round((passed / officeStudents.length) * 100) : 0,
    };
  });

  const foundationComplete = students.filter((d) => {
    const data = d.data();
    return (
      data.foundationProgress === 100 ||
      (typeof data.learningProgress === "number" && data.learningProgress >= 80)
    );
  }).length;

  const juniorPassed = students.filter((d) => evalsByStudent.get(d.id)?.hasJuniorPass).length;

  const seniorHeadApproved = students.filter(
    (d) =>
      isPassingStatus(d.data().readinessStatus) ||
      evalsByStudent.get(d.id)?.hasSeniorHeadPass
  ).length;

  const readinessFunnel: ReadinessFunnelStage[] = [
    { stage: "Foundation Modules", count: foundationComplete },
    { stage: "Junior Interview", count: juniorPassed },
    { stage: "Senior/Head Approval", count: seniorHeadApproved },
  ];

  const counselorWorkload: CounselorWorkloadItem[] = counselors.map((doc) => {
    const data = doc.data();
    const office = normalizeOffice(data.office || data.officeLocation);
    const studentCount = students.filter(
      (s) => normalizeOffice(s.data().office || s.data().officeLocation) === office
    ).length;
    return {
      counselorId: doc.id,
      counselorName: data.displayName || "Counselor",
      studentCount,
    };
  });

  if (counselorWorkload.length === 0) {
    const unassignedCount = students.filter(
      (s) => normalizeOffice(s.data().office || s.data().officeLocation) === "Unassigned"
    ).length;
    if (unassignedCount > 0) {
      counselorWorkload.push({
        counselorId: "unassigned",
        counselorName: "Unassigned",
        studentCount: unassignedCount,
      });
    }
  }

  const failureReasons: FailureReasonItem[] = Array.from(failureReasonCounts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const studentRoster: StudentRosterRow[] = students.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      studentId: data.studentId,
      displayName: data.displayName || "Student",
      email: data.email || "",
      office: normalizeOffice(data.office || data.officeLocation),
      readinessStatus: data.readinessStatus || "Gray",
      learningProgress: data.learningProgress ?? 0,
      createdAt: toIsoDate(data.createdAt),
    };
  });

  const counselorPerformance: CounselorPerformanceRow[] = counselors.map((doc) => {
    const data = doc.data();
    const office = normalizeOffice(data.office || data.officeLocation);
    const assignedStudents = students.filter(
      (s) => normalizeOffice(s.data().office || s.data().officeLocation) === office
    ).length;
    const evaluationsSubmitted = evalCountByCounselor.get(doc.id) || 0;
    const passes = passCountByCounselor.get(doc.id) || 0;
    return {
      counselorId: doc.id,
      counselorName: data.displayName || "Counselor",
      office,
      assignedStudents,
      evaluationsSubmitted,
      passRate:
        evaluationsSubmitted > 0 ? Math.round((passes / evaluationsSubmitted) * 100) : 0,
    };
  });

  return {
    kpis: {
      totalPipeline,
      globalPassRate,
      averagePrepTimeDays,
      highRiskAlert,
    },
    officePerformance,
    readinessFunnel,
    counselorWorkload,
    failureReasons,
    studentRoster,
    counselorPerformance,
    generatedAt: new Date().toISOString(),
  };
}
