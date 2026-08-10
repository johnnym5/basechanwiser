/**
 * Global Promise Timeout Utility:
 * Wraps any Promise (such as Firebase Firestore getDocs calls) in a Promise.race against a timeout timer.
 * Rejects with Error('REQUEST_TIMEOUT') if the operation takes longer than `ms` milliseconds.
 * 
 * Memory Cleanup Logic:
 * Uses a finally block to execute clearTimeout(timerId) immediately when the promise settles (either
 * by resolving or rejecting). This prevents memory leaks and ensures background timers don't persist in memory.
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number = 10000): Promise<T> {
  let timerId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => {
      reject(new Error('REQUEST_TIMEOUT'));
    }, ms);
  });

  try {
    // Promise.race returns as soon as the first promise (primary query OR timeout) settles
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    // Memory cleanup: Clear timer immediately to avoid leaks or orphaned background timeouts
    if (timerId!) {
      clearTimeout(timerId);
    }
  }
}
