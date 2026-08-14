import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export const logActivityAndNotify = async ({
  studentId, studentName, counselorId, type, message, link
}: {
  studentId: string; studentName: string; counselorId: string; type: string; message: string; link?: string;
}) => {
  try {
    // Notify Counselor
    if (counselorId) {
      await addDoc(collection(db, 'notifications'), {
        userId: counselorId,
        studentId,
        type,
        message: `${studentName} ${message}`,
        link: link || `/counselor/students/portfolio?id=${studentId}`,
        read: false,
        createdAt: serverTimestamp()
      });
    }
    // Log for Global Activity Feed (Used for Dashboard & System Push Notifications)
    await addDoc(collection(db, 'activity_logs'), {
      studentId,
      studentName,
      counselorId: counselorId || null, // Critical for Push Notification filtering
      type,
      action: message,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};
