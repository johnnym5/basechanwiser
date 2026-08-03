// src/lib/server/rateLimiter.ts

const STUDENT_DAILY_LIMIT = 50;
const STUDENT_MINUTE_LIMIT = 5;

export interface RateLimitStatus {
  allowed: boolean;
  message?: string;
  statusCode?: number;
}

interface UserRateRecord {
  dailyCount: number;
  lastReset: number;
  perMinuteCount: number;
  minuteWindowStart: number;
}

const memoryStore: Map<string, UserRateRecord> = new Map();

/**
 * Checks and increments AI rate limit for a user UID based on role using fast in-memory store.
 * - 5 req/min, 50 req/day for Students
 * - Counselors and Admins bypass limits
 */
export async function checkRateLimit(uid: string, role: string = 'Student'): Promise<RateLimitStatus> {
  if (role === 'Admin' || role === 'Counselor') {
    return { allowed: true };
  }

  const now = Date.now();
  let record = memoryStore.get(uid);

  if (!record) {
    record = {
      dailyCount: 0,
      lastReset: now,
      perMinuteCount: 0,
      minuteWindowStart: now,
    };
    memoryStore.set(uid, record);
  }

  // Reset daily count if 24h passed
  if (now - record.lastReset >= 24 * 60 * 60 * 1000) {
    record.dailyCount = 0;
    record.lastReset = now;
  }

  // Reset minute count if 1 min passed
  if (now - record.minuteWindowStart >= 60 * 1000) {
    record.perMinuteCount = 0;
    record.minuteWindowStart = now;
  }

  if (record.perMinuteCount >= STUDENT_MINUTE_LIMIT) {
    return {
      allowed: false,
      statusCode: 429,
      message: "AI rate limit exceeded. Maximum 5 requests per minute allowed. Please wait a moment before trying again.",
    };
  }

  if (record.dailyCount >= STUDENT_DAILY_LIMIT) {
    return {
      allowed: false,
      statusCode: 429,
      message: "AI rate limit exceeded. Daily limit of 50 requests reached. Please try again tomorrow.",
    };
  }

  record.dailyCount += 1;
  record.perMinuteCount += 1;

  return { allowed: true };
}
