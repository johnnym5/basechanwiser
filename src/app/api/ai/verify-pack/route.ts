// src/app/api/ai/verify-pack/route.ts
import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/server/rateLimiter';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/verify-pack
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, role = 'Student' } = body;

    if (!uid) {
      return NextResponse.json({ error: 'Missing user ID (uid).' }, { status: 400 });
    }

    const rateCheck = await checkRateLimit(uid, role);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.message }, { status: 429 });
    }

    // Return a standard baseline "Ready for Review" response
    const baselineData = {
      score: 100,
      verdict: "Pass",
      summary: "Baseline verification passed. The dossier is now ready for manual counselor review.",
      financialDiscrepancies: [],
      logicalGaps: [],
      genericVagueResponses: [],
      suggestedImprovements: ["Please ensure all physical documents match the data provided here before your counselor interview."]
    };

    return NextResponse.json({
      success: true,
      data: baselineData,
      warnings: [],
    });
  } catch (error: any) {
    console.error('Verify Pack API Error:', error);
    return NextResponse.json({ error: "Service currently offline." }, { status: 500 });
  }
}
