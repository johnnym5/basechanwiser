/**
 * Global Promise Timeout Utility:
 * Wraps any Promise (such as Firebase Firestore getDocs calls) in a Promise.race against a timeout timer.
 * Rejects with an error if the operation takes longer than `ms` milliseconds.
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number = 10000): Promise<T> {
  let timerId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => {
      reject(new Error(`Request timed out after ${ms}ms`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timerId!) {
      clearTimeout(timerId);
    }
  }
}
