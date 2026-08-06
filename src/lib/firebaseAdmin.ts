import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

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
export const db = getFirestore();
export const adminDb = db;
export const auth = getAuth();

export { Timestamp, FieldValue };
