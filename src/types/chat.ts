import { Timestamp } from "firebase/firestore";

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any; // Firestore Timestamp
  isBroadcast?: boolean; // Flag for special styling
}

export interface Conversation {
  id: string; // studentId or 'staff_admin_uid'
  participants: string[];
  participantNames: Record<string, string>; // uid -> name for display
  lastMessage: string;
  lastUpdatedAt: any;
  unreadCounts: Record<string, number>; // uid -> count
  type: 'student' | 'staff';
}
