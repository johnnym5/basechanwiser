// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb, adminApp } from '@/lib/firebaseAdmin';
import { verifyRequestRole } from '@/lib/server/verify-role';
import { AppRole, StaffPermissions } from '@/types';

/**
 * PATCH /api/admin/users
 * Updates a staff member's Global Role and Granular Permissions.
 * Enforces self-lockout protection and updates Firebase Auth Custom Claims.
 */
export async function PATCH(request: Request) {
  const authResult = await verifyRequestRole(request, ["Admin", "Super Admin"]);
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const { targetUid, role, permissions } = body as {
      targetUid: string;
      role: AppRole;
      permissions: StaffPermissions;
    };

    if (!targetUid || !role || !permissions) {
      return NextResponse.json({ error: "Missing required fields: targetUid, role, or permissions." }, { status: 400 });
    }

    // 1. SELF-LOCKOUT PROTECTION:
    // Prevent an admin from demoting themselves or removing their own settings-edit permission.
    if (targetUid === authResult.caller.uid) {
      if (role !== "Admin" && role !== "Super Admin") {
        return NextResponse.json({ error: "Security Guard: You cannot demote your own administrative role." }, { status: 403 });
      }
      if (!permissions.canEditSettings) {
        return NextResponse.json({ error: "Security Guard: You cannot remove your own permission to edit settings." }, { status: 403 });
      }
    }

    // 2. FIREBASE AUTH CUSTOM CLAIMS:
    // Sync the role and permissions to the user's Auth token so firestore.rules can read them securely.
    await getAuth(adminApp).setCustomUserClaims(targetUid, {
      role,
      permissions
    });

    // 3. FIRESTORE SYNC:
    // Update the authoritative user document.
    await adminDb.collection("Users").doc(targetUid).update({
      role,
      permissions,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUid} successfully updated with role ${role}.`,
    });

  } catch (err: any) {
    console.error("[Admin API] Failed to update user permissions:", err);
    return NextResponse.json({ error: err.message || "Failed to update staff member." }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Invites / Adds a new staff member (placeholder for account creation logic).
 */
export async function POST(request: Request) {
  const authResult = await verifyRequestRole(request, ["Admin", "Super Admin"]);
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const { email, displayName, role } = body;

    if (!email || !displayName || !role) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // In a full implementation, you would trigger a Firebase Auth invite email here.
    // For now, we seed the Firestore doc so the user gets the role upon their first Google sign-in.
    const newUserRef = adminDb.collection("Users").doc(); // Temporary ID or based on email hash
    await newUserRef.set({
      email,
      displayName,
      role,
      permissions: {
        canDownloadDocs: role === "Admin",
        canEditSettings: role === "Admin",
        canManageModules: role === "Admin",
      },
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, message: "Staff member pre-registered. They can now sign in with Google." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
