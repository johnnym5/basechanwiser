import { NextResponse } from 'next/server';
import { evaluateReadinessForStudent } from '@/lib/server/readiness-engine';
import { getAuth } from 'firebase-admin/auth';
import { adminApp, db } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId } = body as { studentId?: string };
    if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });

    // Auth: only counselors or admins can trigger
    const authHeader = request.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'Missing auth' }, { status: 401 });
    const idToken = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = await getAuth(adminApp).verifyIdToken(idToken);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const callerUid = decoded.uid;
    // quick role check
    let callerRole = (decoded as any).role || null;
    if (!callerRole) {
      const callerSnap = await db.collection('Users').doc(callerUid).get();
      callerRole = callerSnap.exists ? callerSnap.data()?.role : null;
    }
    if (!['Counselor', 'Admin', 'Super Admin'].includes(callerRole)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await evaluateReadinessForStudent(studentId);

    // Persist to Users/{studentId}
    await db.collection('Users').doc(studentId).set(
      {
        readinessStatus: result.status,
        readinessReason: result.reason,
        readinessEvaluatedAt: result.evaluatedAt,
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    console.error('Engine evaluate error', e);
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
