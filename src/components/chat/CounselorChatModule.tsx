"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Send, User, Loader2 } from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  where,
  limit
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
}

export default function CounselorChatModule() {
  const { user, userProfile, role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // For students, the "chatId" is their own UID.
  // For counselors, they would normally select a student, but in this unified drawer,
  // we'll assume it opens the chat with their primary assigned counselor or student context.
  // To keep it simple for this task, if student: chat with their counselor.
  // If counselor: show a message that they should select a student from the directory for now,
  // or implement a "Recent Chats" list later.

  const studentId = role === "Student" ? user?.uid : null;

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    // Query messages for this student's chat thread
    const q = query(
      collection(db, "chats"),
      where("studentId", "==", studentId),
      orderBy("createdAt", "asc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => unsubscribe();
  }, [studentId]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user || !studentId) return;

    const text = inputText.trim();
    setInputText("");

    try {
      await addDoc(collection(db, "chats"), {
        studentId,
        senderId: user.uid,
        senderName: userProfile?.displayName || user.displayName || "User",
        text,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  if (role !== "Student") {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900">
        <User size={48} className="text-slate-700 mb-4" />
        <h3 className="text-white font-bold mb-2">Counselor Chat</h3>
        <p className="text-slate-400 text-sm">
          As a counselor, please select a student from the "My Students" directory to start a direct chat.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-indigo-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-slate-500 text-sm">No messages yet. Say hi to your counselor!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.senderId === user?.uid ? "items-end" : "items-start"}`}>
              <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                msg.senderId === user?.uid ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-200 border border-slate-700"
              }`}>
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">
                {msg.senderName} • {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <div className="flex gap-2">
          <textarea
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none max-h-32"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
