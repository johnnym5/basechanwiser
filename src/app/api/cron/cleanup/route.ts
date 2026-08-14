import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { completelyWipeUser } from '@/lib/server/dataRetention';
import { subDays } from 'date-fns';

/**
 * Daily Cleanup Task: Purge inactive students.
 * Triggered by: Vercel Cron
 * Security: CRON_SECRET check
 */
export async function GET(request: Request) {
  // 1. Security check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 2. Threshold: 30 days of inactivity
    const cutoff = subDays(new Date(), 30);

    // 3. Query for inactive students
    const inactiveSnap = await adminDb.collection('Users')
      .where('role', '==', 'Student')
      .where('lastActiveAt', '<', cutoff)
      .get();

    if (inactiveSnap.empty) {
      return NextResponse.json({ message: 'Cohort clean. No inactive scholars found.' });
    }

    // 4. Execute Purge
    const deletedIds = [];
    for (const doc of inactiveSnap.docs) {
      const uid = doc.id;
      await completelyWipeUser(uid);
      deletedIds.push(uid);
    }

    return NextResponse.json({
      success: true,
      purgedCount: deletedIds.length,
      deletedIds
    });

  } catch (error: any) {
    console.error('[Cron Cleanup] Fatal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
