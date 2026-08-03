import { AppRole } from "@/types";

/**
 * Domain-Based Role Logic:
 * - Email ending strictly in "@basechaninternational.com" => "Admin"
 *   e.g. ithub@basechaninternational.com
 * - Email matching "*.basechaninternational@gmail.com" => "Counselor" (Staff)
 *   e.g. johnmary.basechaninternational@gmail.com
 * - Otherwise => "Student"
 */
export function evaluateDomainRole(email: string | null | undefined, isAnonymous: boolean): AppRole {
  if (!email || isAnonymous) {
    return "Student";
  }

  const normalized = email.trim().toLowerCase();

  if (normalized.endsWith("@basechaninternational.com")) {
    return "Admin";
  }

  if (normalized.endsWith(".basechaninternational@gmail.com")) {
    return "Counselor";
  }

  return "Student";
}
