import { NextResponse } from 'next/server';
import { runBulkModuleSeed } from '@/utils/seedManager';
import { verifyRequestRole } from '@/lib/server/verify-role';

export async function POST(req: Request) {
  try {
    // 1. Verify that the requester is an Admin or Super Admin
    const authResult = await verifyRequestRole(req);
    // Standard platform check: if no error, user is at least Counselor.
    // For seeding, let's restrict to Admin/Super Admin if possible,
    // but verifyRequestRole's standard return doesn't differentiate easily without checking role field.
    if (authResult.error) return authResult.error;

    const role = (authResult as any).role;
    if (role !== 'Admin' && role !== 'Super Admin') {
        return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

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
