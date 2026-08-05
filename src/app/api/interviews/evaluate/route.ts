import { NextResponse } from 'next/server';
import { db, Timestamp, FieldValue, adminApp } from '@/lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      studentId,
      counselorId,
      counselorName,
      interviewLevel,
      scores,
      totalScore,
      notes,
      redFlags,
      outcome,
    } = body as any;

    if (!studentId || !counselorId || !interviewLevel) {
      return NextResponse.json({ error: 'Missing required evaluation fields' }, { status: 400 });
    }

    // --- Server-side auth: verify caller is a counselor or admin ---
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization token' }, { status: 401 });
    }
    const idToken = authHeader.split(' ')[1];
    let callerUid = '';
    try {
      const decoded = await getAuth(adminApp).verifyIdToken(idToken);
      callerUid = decoded.uid;

      // Determine caller role via custom claim or Users doc
      let callerRole: string | null = null;
      const claimRole = (decoded as any).role || (decoded as any).roles || null;
      if (claimRole && typeof claimRole === 'string') {
        callerRole = claimRole;
      } else if (claimRole && Array.isArray(claimRole) && claimRole.length > 0) {
        callerRole = claimRole[0];
      } else {
        const callerSnap = await db.collection('Users').doc(callerUid).get();
        callerRole = callerSnap.exists ? callerSnap.data()?.role : null;
      }

      if (!callerRole || !['Counselor', 'Admin', 'Super Admin'].includes(callerRole)) {
        return NextResponse.json({ error: 'Unauthorized: only counselors or admins may submit evaluations' }, { status: 403 });
      }

      // If caller is not admin, ensure they are submitting as themselves
      if (!['Admin', 'Super Admin'].includes(callerRole) && callerUid !== counselorId) {
        return NextResponse.json({ error: 'Unauthorized: counselor may only submit evaluations as themselves' }, { status: 403 });
      }
    } catch (e) {
      console.warn('Token verify failed', e);
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }

    // Prepare evaluation doc
    const evalDocRef = db.collection('interview_evaluations').doc();
    // --- Validate payload fields ---
    const allowedLevels = ['Junior', 'Senior', 'Head'];
    if (!allowedLevels.includes(interviewLevel)) {
      return NextResponse.json({ error: 'Invalid interviewLevel' }, { status: 400 });
    }

    const requiredScoreKeys = ['communication', 'courseKnowledge', 'financialCredibility', 'returnIntent'];
    if (!scores || typeof scores !== 'object') {
      return NextResponse.json({ error: 'Scores object is required' }, { status: 400 });
    }
    for (const k of requiredScoreKeys) {
      const v = (scores as any)[k];
      if (typeof v !== 'number' || Number.isNaN(v) || v < 0 || v > 10) {
        return NextResponse.json({ error: `Score ${k} must be a number between 0 and 10` }, { status: 400 });
      }
    }

    // Validate outcome by level
    const allowedOutcomesByLevel: Record<string, string[]> = {
      Junior: ['Pass', 'Retry', 'Retry Required', 'Escalate'],
      Senior: ['Final Approve', 'Reject', 'Send Back to Learning', 'Pass'],
      Head: ['Final Approve', 'Reject', 'Send Back to Learning', 'Pass'],
    };
    const normalizedOutcome = outcome || '';
    if (!allowedOutcomesByLevel[interviewLevel].includes(normalizedOutcome) && normalizedOutcome !== '') {
      return NextResponse.json({ error: `Invalid outcome for level ${interviewLevel}` }, { status: 400 });
    }

    const evalData = {
      studentId,
      counselorId,
      counselorName: counselorName || null,
      interviewLevel,
      scores: scores || {},
      // compute authoritative totalScore
      totalScore: typeof totalScore === 'number' ? totalScore : Object.values(scores || {}).reduce((a: any, b: any) => a + b, 0),
      notes: notes || '',
      redFlags: Array.isArray(redFlags) ? redFlags : [],
      outcome: outcome || 'Pass',
      createdAt: Timestamp.now(),
    };

    // ensure totalScore matches sum
    const computedTotal = Object.values(evalData.scores).reduce((a: any, b: any) => a + b, 0);
    if (evalData.totalScore !== computedTotal) {
      evalData.totalScore = computedTotal;
    }

    // Determine readiness updates
    const userRef = db.collection('Users').doc(studentId);

    const batch = db.batch();
    batch.set(evalDocRef, evalData);

    // Prepare user update
    const userUpdate: any = {
      lastInterviewOutcome: evalData.outcome,
    };

    if (interviewLevel === 'Junior') {
      if (evalData.outcome === 'Pass') userUpdate.readinessStatus = 'Yellow';
      if (evalData.outcome === 'Retry' || evalData.outcome === 'Retry Required') userUpdate.readinessStatus = 'Red';
    }

    if (interviewLevel === 'Senior') {
      if (evalData.outcome === 'Final Approve' || evalData.outcome === 'Pass') userUpdate.readinessStatus = 'Yellow';
      if (evalData.outcome === 'Reject') userUpdate.readinessStatus = 'Red';
    }

    if (interviewLevel === 'Head') {
      if (evalData.outcome === 'Final Approve' || evalData.outcome === 'Pass') userUpdate.readinessStatus = 'Green';
      if (evalData.outcome === 'Reject') userUpdate.readinessStatus = 'Red';
    }

    // If Retry or Reject, increment failedInterviews counter
    if (['Retry', 'Retry Required', 'Reject'].includes(evalData.outcome)) {
      userUpdate.failedInterviews = FieldValue.increment(1);
    }
    // Apply user update
    batch.update(userRef, userUpdate);

    // Commit
    await batch.commit();

    return NextResponse.json({ success: true, id: evalDocRef.id });
  } catch (e: any) {
    console.error('Evaluation API error:', e);
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
