import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyRequestRole } from '@/lib/server/verify-role';
import { CORE_UKVI_MODULES, CORE_UKVI_MOCK_SET } from '@/lib/seed/academy-seed';

/**
 * API Route: Seed Core UKVI Training Track
 * Security: Strictly guarded by Firebase Admin SDK token verification.
 * Mode: Aggressive (Overwrites existing core documents to ensure data integrity)
 */
export async function POST(req: Request) {
  try {
    // 1. SECURITY CHECK with DEVELOPMENT BYPASS
    const isDev = process.env.NODE_ENV === 'development';
    const authResult = await verifyRequestRole(req, ["Super Admin", "Admin"]);

    // If verification fails AND we are not in development mode, block the request.
    if (authResult.error && !isDev) {
      console.error("[Seed Modules] Unauthorized access attempt blocked in production.");
      return authResult.error;
    }

    if (isDev && authResult.error) {
      console.log("[Seed Modules] Auth token invalid, but allowing seed due to LOCALHOST environment.");
    }

    const batch = adminDb.batch();

    // 1. SEED TEST MODULES (Academy Track)
    // Collection: test_question_sets
    const testSetsRef = adminDb.collection('test_question_sets');

    for (const coreModule of CORE_UKVI_MODULES) {
      if (!coreModule.id) continue;

      const docRef = testSetsRef.doc(coreModule.id);

      // We use set() WITHOUT the exists check to force a curriculum refresh/restoration
      batch.set(docRef, {
        ...coreModule,
        isArchived: false,
        isDefault: true,
        category: 'core',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString() // We set this for new installs, updates will overwrite
      }, { merge: true });
    }

    // 2. SEED MOCK INTERVIEW SET
    // Collection: mock_interview_sets
    const mockSetsRef = adminDb.collection('mock_interview_sets');
    const mockDocRef = mockSetsRef.doc(CORE_UKVI_MOCK_SET.id);

    batch.set(mockDocRef, {
      ...CORE_UKVI_MOCK_SET,
      isArchived: false,
      isDefault: true,
      category: 'core',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }, { merge: true });

    // Execute atomic batch
    await batch.commit();

    console.log(`[Seed Modules] Successfully seeded ${CORE_UKVI_MODULES.length} modules and 1 mock set.`);

    return NextResponse.json({
      success: true,
      restoredCount: CORE_UKVI_MODULES.length + 1,
      message: `Curriculum successfully synchronized. ${CORE_UKVI_MODULES.length} core modules and the official mock set are now live.`
    });

  } catch (error: any) {
    console.error("[Seed Modules] Fatal Seeding Error:", error);
    return NextResponse.json({
      error: error.message || "Failed to seed curriculum. Check server logs."
    }, { status: 500 });
  }
}
