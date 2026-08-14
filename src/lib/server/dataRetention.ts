import { adminDb, adminAuth, adminStorage } from '@/lib/firebaseAdmin';

/**
 * Cascade Deletion Engine: Permanently purges a user's entire footprint from the platform.
 * Targets: Auth, Firestore (Multiple Collections), and Storage Buckets.
 */
export async function completelyWipeUser(userId: string) {
  console.log(`[DataRetention] Starting full purge for user: ${userId}`);

  try {
    // 1. DELETE FIRESTORE DATA (Batching for performance)
    const collectionsToClean = [
      { name: 'Users', field: '__name__' }, // Document itself
      { name: 'quiz_attempts', field: 'userId' },
      { name: 'Interview_Packs', field: 'userId' },
      { name: 'interview_packs', field: 'userId' },
      { name: 'mock_interview_attempts', field: 'studentId' },
      { name: 'evaluations', field: 'studentId' },
      { name: 'activity_logs', field: 'studentId' },
      { name: 'notifications', field: 'userId' },
      { name: 'reminders', field: 'userId' }
    ];

    for (const col of collectionsToClean) {
      let q = adminDb.collection(col.name).where(col.field, '==', userId);

      // Special case for the main user document and its sub-collections
      if (col.field === '__name__') {
        const userRef = adminDb.collection(col.name).doc(userId);

        // Purge portfolio sub-collections (study_guide, document_vault)
        const portfolioCols = ['study_guide', 'document_vault'];
        for (const sub of portfolioCols) {
           const subSnap = await userRef.collection('portfolio').doc(sub).get();
           if (subSnap.exists) await subSnap.ref.delete();
        }

        await userRef.delete();
        continue;
      }

      const snapshot = await q.get();
      if (!snapshot.empty) {
        const batch = adminDb.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        console.log(`[DataRetention] Purged ${snapshot.size} docs from ${col.name}`);
      }
    }

    // 2. DELETE FIREBASE STORAGE FILES (Videos, PDFs)
    try {
      const bucket = adminStorage.bucket();
      const folderPrefixes = [`mock_interviews/${userId}/`, `documents/${userId}/`, `packs/${userId}/`];

      for (const prefix of folderPrefixes) {
        await bucket.deleteFiles({ prefix });
      }
      console.log(`[DataRetention] Cleared storage folders for: ${userId}`);
    } catch (storageErr) {
      console.warn(`[DataRetention] Storage cleanup skipped or failed:`, storageErr);
    }

    // 3. DELETE CHAT ROOMS & MESSAGES
    // Logic: Look for conversations where this user was a participant
    const convsSnap = await adminDb.collection('conversations')
      .where('participants', 'array-contains', userId)
      .get();

    for (const convDoc of convsSnap.docs) {
      // Delete sub-collection messages first
      const msgsSnap = await convDoc.ref.collection('messages').get();
      const msgBatch = adminDb.batch();
      msgsSnap.docs.forEach(m => msgBatch.delete(m.ref));
      await msgBatch.commit();

      // Delete the conversation document
      await convDoc.ref.delete();
    }

    // 4. DELETE AUTH RECORD
    try {
      await adminAuth.deleteUser(userId);
      console.log(`[DataRetention] Deleted Auth record for: ${userId}`);
    } catch (authErr: any) {
      if (authErr.code !== 'auth/user-not-found') {
        throw authErr;
      }
    }

    console.log(`[DataRetention] PURGE COMPLETE: ${userId}`);
    return true;

  } catch (error) {
    console.error(`[DataRetention] FATAL ERROR during purge of ${userId}:`, error);
    throw error;
  }
}
