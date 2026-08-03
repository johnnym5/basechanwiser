import { AppRole } from "@/types";

/**
 * Domain-Based Role Evaluation Rules:
 *
 * 1. ADMIN — Triggered automatically for emails matching:
 *      (name)@basechaninternational.com
 *    Can also be explicitly assigned by an existing Admin via the
 *    User Management tab in Counselor Settings.
 *
 * 2. COUNSELOR — Triggered automatically for staff emails ending in:
 *      (name).basechaninternational@gmail.com
 *
 * 3. STUDENT — Default role for all standard Google Sign-In and
 *    anonymous logins that don't match the above patterns.
 */
export function evaluateDomainRole(email: string | null | undefined, isAnonymous: boolean): AppRole {
  // Anonymous users and users without email are always Students
  if (!email || isAnonymous) {
    return "Student";
  }

  const normalized = email.trim().toLowerCase();

  // Super admin override: specific email gets full admin rights
  if (normalized === "jegbase@gmail.com") {
    return "Admin";
  }
  if (normalized.endsWith("@basechaninternational.com")) {
    return "Admin";
  }

  // ── Rule 2: Counselor ──────────────────────────────────────────
  // Staff Gmail aliases: (name).basechaninternational@gmail.com
  // e.g. sarah.basechaninternational@gmail.com
  if (normalized.endsWith(".basechaninternational@gmail.com")) {
    return "Counselor";
  }

  // ── Rule 3: Student (default) ──────────────────────────────────
  // All other Google Sign-In and anonymous logins
  return "Student";
}
