import { db, Timestamp } from '@/lib/firebaseAdmin';

type ReadinessResult = {
  status: 'Gray' | 'Red' | 'Orange' | 'Yellow' | 'Green';
  reason: string;
  evaluatedAt: ReturnType<typeof Timestamp.now>;
};

/**
 * Evaluate readiness for a studentId by aggregating multiple collections.
 * Uses admin `db` (Firestore) to read authoritative data.
 */
export async function evaluateReadinessForStudent(studentId: string): Promise<ReadinessResult> {
  // Fetch user profile
  const userRef = db.collection('Users').doc(studentId);
  const [userSnap, quizzesSnap, mocksSnap, evalsSnap, packSnap] = await Promise.all([
    userRef.get(),
    db.collection('quiz_attempts').where('userId', '==', studentId).get(),
    db.collection('ai_mock_sessions').where('userId', '==', studentId).get(),
    db.collection('interview_evaluations').where('studentId', '==', studentId).get(),
    db.collection('interview_packs').where('studentId', '==', studentId).orderBy('submittedAt', 'desc').limit(1).get(),
  ]);

  const user = userSnap.exists ? (userSnap.data() as any) : {};

  // Helper checks
  const pack = packSnap.empty ? null : (packSnap.docs[0].data() as any);

  // Foundation modules completion: we assume Users has `foundationProgress` or compute from quiz attempts
  const foundationPassedAll = user?.foundationProgress === 100 || false;

  // Count failed foundation quiz attempts (>3 failures indicates red)
  let failedFoundationAttempts = 0;
  quizzesSnap.forEach((q) => {
    const d = q.data() as any;
    if (d.quizType === 'foundation' && d.passed === false) failedFoundationAttempts += 1;
  });

  // AI Mock red flags count
  let totalRedFlags = 0;
  mocksSnap.forEach((m) => {
    const d = m.data() as any;
    if (Array.isArray(d.redFlags)) totalRedFlags += d.redFlags.length;
  });

  // Latest interview outcomes: check for any Reject or Retry in evaluations
  let lastOutcome: string | null = null;
  let passedJunior = false;
  let passedHead = false;
  evalsSnap.forEach((e) => {
    const d = e.data() as any;
    lastOutcome = d.outcome || lastOutcome;
    if (d.interviewLevel === 'Junior' && d.outcome === 'Pass') passedJunior = true;
    if (d.interviewLevel === 'Head' && (d.outcome === 'Final Approve' || d.outcome === 'Pass')) passedHead = true;
  });

  // Determine status following PRD rules
  const reasonParts: string[] = [];

  // Gray: onboarding/incomplete
  if (!foundationPassedAll || !pack || pack.status !== 'Submitted') {
    reasonParts.push('Foundation modules not complete or interview pack not submitted');
    return { status: 'Gray', reason: reasonParts.join('; '), evaluatedAt: Timestamp.now() };
  }

  // Red conditions
  if (lastOutcome === 'Reject' || lastOutcome === 'Retry' || totalRedFlags > 3 || failedFoundationAttempts > 3) {
    if (lastOutcome === 'Reject' || lastOutcome === 'Retry') reasonParts.push(`Last interview outcome: ${lastOutcome}`);
    if (totalRedFlags > 3) reasonParts.push(`AI Mock red flags: ${totalRedFlags}`);
    if (failedFoundationAttempts > 3) reasonParts.push(`Failed foundation quizzes: ${failedFoundationAttempts}`);
    return { status: 'Red', reason: reasonParts.join('; '), evaluatedAt: Timestamp.now() };
  }

  // Orange: pack submitted but not verified OR ready for Junior but hasn't happened
  if (pack && pack.status === 'Submitted') {
    reasonParts.push('Interview pack submitted but not verified');
    return { status: 'Orange', reason: reasonParts.join('; '), evaluatedAt: Timestamp.now() };
  }

  // Yellow: Passed Junior and pack verified, awaiting Senior/Head
  const packVerified = pack && pack.status === 'Verified';
  if (passedJunior && packVerified && !passedHead) {
    reasonParts.push('Passed Junior interview and pack verified; awaiting Senior/Head approval');
    return { status: 'Yellow', reason: reasonParts.join('; '), evaluatedAt: Timestamp.now() };
  }

  // Green: Passed Head and pack verified and foundation all passed
  if (passedHead && packVerified && foundationPassedAll) {
    reasonParts.push('Passed Head approval, pack verified, and all foundation modules passed');
    return { status: 'Green', reason: reasonParts.join('; '), evaluatedAt: Timestamp.now() };
  }

  // Default fallback
  reasonParts.push('Insufficient data to determine readiness — manual review recommended');
  return { status: 'Orange', reason: reasonParts.join('; '), evaluatedAt: Timestamp.now() };
}

export type { ReadinessResult };
