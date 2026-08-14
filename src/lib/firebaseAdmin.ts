import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

/**
 * Initialize Firebase Admin SDK for server-side use.
 */
try {
  if (!getApps().length) {
    initializeApp();
    console.log("[FirebaseAdmin] SDK Initialized using environment defaults");
  }
} catch (e) {
  console.error("[FirebaseAdmin] Initialization Error:", e);
}

export const adminApp = getApp();
export const adminDb = getFirestore();
export const adminAuth = getAuth();
export const adminStorage = getStorage();

export { Timestamp, FieldValue };
