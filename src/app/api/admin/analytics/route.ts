import { NextResponse } from "next/server";
import { aggregateAnalytics } from "@/lib/server/analytics-aggregator";
import { verifyRequestRole } from "@/lib/server/verify-role";

export async function GET(request: Request) {
  const authResult = await verifyRequestRole(request);
  if (authResult.error) return authResult.error;

  try {
    const data = await aggregateAnalytics();
    return NextResponse.json(data);
  } catch (e: unknown) {
    console.error("Analytics aggregation error:", e);
    const message = e instanceof Error ? e.message : "Failed to aggregate analytics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
