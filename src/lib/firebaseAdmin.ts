// src/lib/firebaseAdmin.ts
/**
 * Initialize Firebase Admin SDK for server-side use.
 */
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp();
}

export const db = getFirestore();
export const adminApp = getApp();
export { Timestamp };
