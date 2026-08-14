import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb as db, adminApp } from "@/lib/firebaseAdmin";
import { AppRole } from "@/types";

export const ANALYTICS_ROLES: AppRole[] = ["Super Admin", "Head of Compliance"];

export type VerifiedCaller = {
  uid: string;
  role: AppRole;
  email?: string | null;
};

type VerifyResult =
  | { caller: VerifiedCaller; error?: undefined }
  | { caller?: undefined; error: NextResponse };

/**
 * Verify Firebase ID token and ensure caller has one of the allowed roles.
 * Reads authoritative role from Firestore Users doc; falls back to Super Admin domain check.
 */
export async function verifyRequestRole(
  request: Request,
  allowedRoles: AppRole[] = ANALYTICS_ROLES
): Promise<VerifyResult> {
  const authHeader =
    request.headers.get("authorization") || request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      error: NextResponse.json({ error: "Missing or invalid authorization token" }, { status: 401 }),
    };
  }

  const idToken = authHeader.split(" ")[1];

  try {
    const decoded = await getAuth(adminApp).verifyIdToken(idToken);
    const callerUid = decoded.uid;
    const tokenEmail = decoded.email?.toLowerCase() ?? null;

    const callerSnap = await db.collection("Users").doc(callerUid).get();
    const profile = callerSnap.exists ? callerSnap.data() : null;
    let role = (profile?.role as AppRole) || null;

    if (!role && tokenEmail === "jegbase@gmail.com") {
      role = "Super Admin";
    }

    if (!role || !allowedRoles.includes(role)) {
      return {
        error: NextResponse.json(
          { error: "Forbidden: insufficient permissions for this resource" },
          { status: 403 }
        ),
      };
    }

    return {
      caller: {
        uid: callerUid,
        role,
        email: profile?.email ?? tokenEmail,
      },
    };
  } catch (e) {
    console.warn("Token verification failed:", e);
    return {
      error: NextResponse.json({ error: "Invalid auth token" }, { status: 401 }),
    };
  }
}
