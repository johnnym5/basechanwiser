import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  increment,
  writeBatch,
  getDocs,
  setDoc,
  limit,
  getDoc
} from 'firebase/firestore';
import { Conversation, Message } from '@/types/chat';
import { UserProfile } from '@/types';

/**
 * useChat: Operational hook for the Support Terminal.
 * Features: StudentId-tied persistence, role-based filtering, and global broadcast batching.
 */
export function useChat(userProfile: UserProfile | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Conversations based on Role
  useEffect(() => {
    if (!userProfile) return;

    let q;
    if (userProfile.role === 'Admin' || userProfile.role === 'Super Admin') {
      q = query(collection(db, 'conversations'), orderBy('lastUpdatedAt', 'desc'));
    } else if (userProfile.role === 'Counselor') {
      // Logic: Only show students assigned to this counselor
      q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userProfile.uid),
        orderBy('lastUpdatedAt', 'desc')
      );
    } else {
      // Student: Only see their own chat (ID is usually their studentId)
      q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userProfile.uid),
        limit(1)
      );
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Conversation));
      setConversations(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  // 2. Fetch Messages with automatic read receipt
  const subscribeToMessages = (conversationId: string) => {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      setActiveMessages(msgs);
    });
  };

  // 3. Initialize or Start Chat
  const startConversation = async (target: UserProfile) => {
    if (!userProfile) return null;

    // For students, use studentId as ID for persistence across reassignments
    const convId = target.role === 'Student' ? (target.studentId || target.uid) : `staff_${target.uid}`;
    const convRef = doc(db, 'conversations', convId);
    const snap = await getDoc(convRef);

    if (!snap.exists()) {
      await setDoc(convRef, {
        participants: [userProfile.uid, target.uid],
        participantNames: {
          [userProfile.uid]: userProfile.displayName || 'Staff',
          [target.uid]: target.displayName || target.email
        },
        lastMessage: "Channel established.",
        lastUpdatedAt: serverTimestamp(),
        unreadCounts: { [target.uid]: 0, [userProfile.uid]: 0 },
        type: target.role === 'Student' ? 'student' : 'staff'
      });
    } else {
      // Ensure current staff member is a participant (for counselor inheritance)
      const data = snap.data();
      if (!data.participants.includes(userProfile.uid)) {
        await updateDoc(convRef, {
          participants: [...data.participants, userProfile.uid],
          [`participantNames.${userProfile.uid}`]: userProfile.displayName || 'Counselor'
        });
      }
    }
    return convId;
  };

  // 4. Send Message
  const sendMessage = async (conversationId: string, text: string, recipientIds: string[]) => {
    if (!userProfile) return;

    const messageData = {
      senderId: userProfile.uid,
      senderName: userProfile.displayName || 'Staff',
      text,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'conversations', conversationId, 'messages'), messageData);

    const updates: any = {
      lastMessage: text,
      lastUpdatedAt: serverTimestamp(),
    };

    recipientIds.forEach(rid => {
      if (rid !== userProfile.uid) {
        updates[`unreadCounts.${rid}`] = increment(1);
      }
    });

    await updateDoc(doc(db, 'conversations', conversationId), updates);
  };

  const markAsRead = async (conversationId: string) => {
    if (!userProfile) return;
    await updateDoc(doc(db, 'conversations', conversationId), {
      [`unreadCounts.${userProfile.uid}`]: 0
    });
  };

  // 5. Admin Global Broadcast
  const sendBroadcast = async (text: string, targetType: 'students' | 'staff') => {
    if (userProfile?.role !== 'Admin' && userProfile?.role !== 'Super Admin') return;

    const batch = writeBatch(db);
    const typeKey = targetType === 'students' ? 'student' : 'staff';
    const convsToNotify = conversations.filter(c => c.type === typeKey);

    convsToNotify.forEach(conv => {
      const msgRef = doc(collection(db, 'conversations', conv.id, 'messages'));
      batch.set(msgRef, {
        senderId: userProfile.uid,
        senderName: `BROADCAST: ${userProfile.displayName}`,
        text,
        createdAt: serverTimestamp(),
        isBroadcast: true
      });

      const updates: any = {
        lastMessage: `📢 ${text}`,
        lastUpdatedAt: serverTimestamp(),
      };

      conv.participants.forEach(pid => {
        if (pid !== userProfile.uid) updates[`unreadCounts.${pid}`] = increment(1);
      });

      batch.update(doc(db, 'conversations', conv.id), updates);
    });

    await batch.commit();
  };

  return {
    conversations,
    activeMessages,
    loading,
    subscribeToMessages,
    startConversation,
    sendMessage,
    markAsRead,
    sendBroadcast
  };
}
