import { AppRole } from "@/types";

/**
 * Enhanced Strict Role Assignment Logic:
 *
 * 1. SUPER ADMIN: jegbase@gmail.com
 * 2. COUNSELOR: johnmary.basechaninternational@gmail.com (or anything with .basechaninternational@gmail.com)
 * 3. ADMIN: ithub@basechaninternational.com (or anything ending in @basechaninternational.com / @basechan.com)
 * 4. STUDENT: Default
 */
export function evaluateDomainRole(email: string | null | undefined, isAnonymous: boolean): AppRole {
  if (!email || isAnonymous) {
    return "Student";
  }

  const normalized = email.trim().toLowerCase();

  // 1. Super Admin
  if (normalized === "jegbase@gmail.com") {
    return "Super Admin";
  }

  // 2. Counselor Check (Gmail staff aliases)
  if (normalized.includes("basechaninternational@gmail.com")) {
    return "Counselor";
  }

  // 3. Admin Check (Corporate domains)
  if (
    normalized.endsWith("@basechaninternational.com") ||
    normalized.endsWith("@basechan.com") ||
    normalized.includes(".basechan@gmail.com")
  ) {
    return "Admin";
  }

  // 4. Fallback Default
  return "Student";
}
