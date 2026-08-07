import { NextResponse } from 'next/server';
import { runBulkModuleSeed } from '@/utils/seedManager';
import { verifyRequestRole } from '@/lib/server/verify-role';

export async function POST(req: Request) {
  try {
    // 1. Verify that the requester is at least a Counselor
    const authResult = await verifyRequestRole(req, ["Super Admin", "Admin", "Counselor", "Head of Compliance"]);

    if (authResult.error) return authResult.error;

    // 2. Run the bulk seed operation
    const result = await runBulkModuleSeed();

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error: any) {
    console.error("API Seeding error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
