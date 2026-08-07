"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
  getDocs,
  limit,
  doc,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { X, Send, User, Bot, AlertCircle, Loader2, MessageSquare, Megaphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatDrawer({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user, userId, role, effectiveRole } = useAuth();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = effectiveRole === 'Admin' || effectiveRole === 'Super Admin';

  // 1. Initialize or find chat
  useEffect(() => {
    if (!userId || !isOpen) return;

    async function initChat() {
      setLoading(true);
      // For simplicity, students have one main chat with "staff" or specific counselor
      // Here we'll use a fixed naming convention for 1-on-1 chats

      if (!isAdmin) {
        // Student logic: Find chat where participants includes student and 'staff'
        const q = query(collection(db, "chats"), where("participants", "array-contains", userId), limit(1));
        const snap = await getDocs(q);

        if (snap.empty) {
          const newChat = await addDoc(collection(db, "chats"), {
            participants: [userId, 'staff_broadcast'],
            updatedAt: serverTimestamp(),
            lastMessage: "Welcome to support!"
          });
          setActiveChatId(newChat.id);
        } else {
          setActiveChatId(snap.docs[0].id);
        }
      } else {
        // Admin logic: Default to broadcast or select a user
        setActiveChatId('staff_broadcast');
      }
      setLoading(false);
    }

    initChat();
  }, [userId, isOpen, isAdmin]);

  // 2. Listen to messages
  useEffect(() => {
    if (!activeChatId || !isOpen) return;

    const q = query(
      collection(db, "chats", activeChatId, "messages"),
      orderBy("createdAt", "asc"),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
    });

    return () => unsub();
  }, [activeChatId, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId) return;

    const text = inputText;
    setInputText("");

    try {
      await addDoc(collection(db, "chats", activeChatId, "messages"), {
        senderId: userId,
        senderName: user?.displayName || "User",
        text,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, "chats", activeChatId), {
        lastMessage: text,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl border-l border-gray-100 dark:border-slate-800"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <MessageSquare size={20} />
             </div>
             <div>
                <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter">Support Terminal</h3>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Staff Online
                </p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all">
             <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Message Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-inherit scrollbar-hide">
           {loading ? (
             <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" /></div>
           ) : messages.length === 0 ? (
             <div className="text-center py-20 opacity-30 space-y-4">
                <Bot size={48} className="mx-auto" />
                <p className="text-xs font-black uppercase tracking-widest">Start the conversation</p>
             </div>
           ) : (
             messages.map((m) => {
               const isMe = m.senderId === userId;
               return (
                 <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">{m.senderName}</span>
                       <div className={`p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm ${
                         isMe
                         ? 'bg-blue-600 text-white rounded-tr-none'
                         : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-tl-none'
                       }`}>
                          {m.text}
                       </div>
                    </div>
                 </div>
               );
             })
           )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-gray-100 dark:border-slate-800 shrink-0">
           {isAdmin && (
              <div className="flex gap-2 mb-4">
                 <button
                  onClick={() => setIsBroadcast(!isBroadcast)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${isBroadcast ? 'bg-amber-50 text-amber-600 border-amber-200' : 'text-gray-400 border-gray-100 dark:border-slate-800'}`}
                 >
                    <Megaphone size={14} /> Global Broadcast
                 </button>
              </div>
           )}
           <form onSubmit={handleSendMessage} className="relative">
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Secure message link..."
                className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl pl-5 pr-14 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all">
                 <Send size={18} />
              </button>
           </form>
        </div>
      </motion.div>
    </div>
  );
}
