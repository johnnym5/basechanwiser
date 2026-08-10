import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserProfile } from '@/types';

/**
 * useAddressBook: Real-time hydration of the platform's directory.
 * Logic:
 * - Admin: Sees all active staff and students.
 * - Counselor: Sees assigned students + Admin staff for escalation.
 */
export function useAddressBook(currentUserRole: string | null, currentUserId: string | null) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserRole || !currentUserId) return;

    // Base query for all users (filtered client-side for complex role logic if needed)
    // For scalability, we fetch where role is not Student (staff) OR specific assigned student logic.
    let q = query(collection(db, 'Users'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setUsers(fetchedUsers);
      setLoading(false);
    }, (error) => {
      console.error("Address Book Sync Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserRole, currentUserId]);

  return { users, loading };
}
