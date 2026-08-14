import { useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/**
 * useSystemNotifications: Global hook to handle Browser/Windows System Push Notifications.
 * Listens for new activities related to the current counselor/admin in real-time.
 */
export function useSystemNotifications(user: any, role: string | null) {
  useEffect(() => {
    if (!user || !role) return;

    // 1. Request Native Browser/OS Notification Permission
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    // 2. Define visibility scope
    // Admins see everything, Counselors see their assigned student activities
    const mountTime = Timestamp.now();
    let q;

    if (role === 'Admin' || role === 'Super Admin') {
      q = query(
        collection(db, 'activity_logs'),
        where('createdAt', '>=', mountTime)
      );
    } else if (role === 'Counselor') {
      q = query(
        collection(db, 'activity_logs'),
        where('counselorId', '==', user.uid),
        where('createdAt', '>=', mountTime)
      );
    } else {
      return; // Students don't receive push notifications for activity logs
    }

    // 3. Set up the Real-time Listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();

          // 4. Trigger Native OS Push Notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('BASECHANWISER Alert', {
              body: `${data.studentName} ${data.action}`,
              icon: '/logo.png', // Enterprise branding
              tag: change.doc.id, // Prevent duplicate alerts for the same event
            });
          }
        }
      });
    }, (error) => {
      console.error("Push Notification Listener Error:", error);
    });

    return () => unsubscribe();
  }, [user, role]);
}
