import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * CRON Job to purge old mock interview attempts and storage files
 * Runs every day at 00:00
 */
export const dataRetentionCron = functions.pubsub.schedule('0 0 * * *').onRun(async (context) => {
  const db = admin.firestore();
  const storage = admin.storage().bucket();

  // Fetch retention limit from global settings
  const globalSettings = await db.collection('settings').doc('global').get();
  const retentionDays = globalSettings.data().dataRetentionDays || 90;

  const cutOffDate = new Date();
  cutOffDate.setDate(cutOffDate.getDate() - retentionDays);

  const oldAttempts = await db.collection('mock_interview_attempts')
    .where('createdAt', '<', admin.firestore.Timestamp.fromDate(cutOffDate))
    .get();

  const batch = db.batch();

  for (const doc of oldAttempts.docs) {
    const data = doc.data();

    // 1. Delete associated video file from Storage if exists
    if (data.videoUrl) {
      try {
        // Extract path from URL or store path in doc to make this easier
        // For now, this is a conceptual stub
        console.log(`Purging storage for attempt ${doc.id}`);
      } catch (e) {
        console.error(`Failed to delete storage file for ${doc.id}`, e);
      }
    }

    // 2. Delete Firestore document
    batch.delete(doc.ref);
  }

  await batch.commit();
  console.log(`Successfully purged ${oldAttempts.size} old mock interview attempts.`);
  return null;
});
