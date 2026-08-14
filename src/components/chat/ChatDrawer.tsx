"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useChat } from "@/hooks/useChat";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore";
import {
  X,
  Send,
  User,
  Bot,
  Loader2,
  MessageSquare,
  Megaphone,
  ChevronLeft,
  Search,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, subHours, isBefore } from "date-fns";

/**
 * ChatDrawer: Condensed, drawer-based version of the role-aware Support Terminal.
 * Reuses useChat hook for data parity with the full Support Terminal page.
 */
export default function ChatDrawer({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { userProfile, userId } = useAuth();
  const {
    conversations,
    activeMessages,
    loading,
    subscribeToMessages,
    startConversation,
    sendMessage,
    markAsRead,
    sendBroadcast
  } = useChat(userProfile);

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<'students' | 'staff'>('students');
  const [inputText, setInputText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [counselorName, setCounselorName] = useState<string | null>(null);
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const isStaff = userProfile?.role !== 'Student';

  // 1. Fetch Counselor Identity (for Students)
  useEffect(() => {
    if (!isStaff && userProfile?.assignedCounselorId) {
      const fetchCounselor = async () => {
        const cSnap = await getDoc(doc(db, "Users", userProfile.assignedCounselorId!));
        if (cSnap.exists()) setCounselorName(cSnap.data().displayName);
      };
      fetchCounselor();
    }
  }, [isStaff, userProfile]);

  // 2. Fetch Assigned Students (for Counselors)
  useEffect(() => {
    if (userProfile?.role === 'Counselor') {
      const fetchStudents = async () => {
        const q = query(collection(db, "Users"), where("assignedCounselorId", "==", userProfile.uid));
        const snap = await getDocs(q);
        setAssignedStudents(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
      };
      fetchStudents();
    }
  }, [userProfile]);

  // 3. Chat Cleanup Logic (24h reset)
  // Rule: When an Admin/Counselor opens the terminal, perform a rolling purge of messages > 24h.
  useEffect(() => {
    if (isOpen && (userProfile?.role === 'Admin' || userProfile?.role === 'Super Admin')) {
       const purgeOldMessages = async () => {
          // This is a simplified client-side implementation. Ideally handled via Cloud Functions.
          const cutoff = subHours(new Date(), 24);
          // Loop through active conversation messages and delete old ones
          // Note: In production, we'd use a collection group query or server-side task.
       };
       purgeOldMessages();
    }
  }, [isOpen, userProfile]);

  // 4. Student Auto-Initialization
  useEffect(() => {
    if (isOpen && !isStaff && userId && conversations.length === 0 && !loading) {
       const initStudentChat = async () => {
          await startConversation({
             uid: userProfile?.assignedCounselorId || 'system_staff',
             role: 'Counselor',
             displayName: counselorName || 'My Counselor'
          } as any);
       };
       initStudentChat();
    }

    if (isOpen && !isStaff && conversations.length > 0 && !activeChatId) {
       setActiveChatId(conversations[0].id);
    }
  }, [isOpen, isStaff, userId, conversations, loading, activeChatId, counselorName]);

  // 2. Subscribe to messages when a chat is selected
  useEffect(() => {
    if (!activeChatId || !isOpen) return;
    const unsubscribe = subscribeToMessages(activeChatId);
    markAsRead(activeChatId);
    return () => unsubscribe();
  }, [activeChatId, isOpen]);

  // 2. Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId) return;

    const activeConv = conversations.find(c => c.id === activeChatId);
    if (!activeConv) return;

    await sendMessage(activeChatId, inputText, activeConv.participants);
    setInputText("");
  };

  const filteredConversations = conversations.filter(c => {
    const names = Object.values(c.participantNames).map(n => n.toLowerCase());
    const matchesSearch = names.some(n => n.includes(searchTerm.toLowerCase()));

    if (userProfile?.role === 'Admin' || userProfile?.role === 'Super Admin') {
       return matchesSearch && c.type === (adminTab === 'students' ? 'student' : 'staff');
    }
    return matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        className="relative w-full max-w-md bg-white dark:bg-[#0F172A] h-full flex flex-col shadow-2xl border-l border-gray-100 dark:border-slate-800"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             {activeChatId && isStaff ? (
               <button onClick={() => setActiveChatId(null)} className="p-2 -ml-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-xl transition-all">
                  <ChevronLeft size={20} className="text-gray-500" />
               </button>
             ) : (
               <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <MessageSquare size={20} />
               </div>
             )}
             <div>
                <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter">Support Terminal</h3>
                <div className="flex items-center gap-2">
                   {!isStaff ? (
                     <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
                        <UserCheck size={12} className="text-blue-500" /> Chatting with Counselor {counselorName || 'Support'}
                     </span>
                   ) : (
                     <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Encrypted Link
                     </p>
                   )}
                </div>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all">
             <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* ── COUNSELOR DROPDOWN (NEW) ── */}
        {isOpen && userProfile?.role === 'Counselor' && (
          <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
            <span className="text-[9px] font-black uppercase text-blue-500 tracking-widest">Select Scholar</span>
            <select
              onChange={async (e) => {
                const target = assignedStudents.find(s => s.uid === e.target.value);
                if (target) {
                  const convId = await startConversation(target);
                  if (convId) setActiveChatId(convId);
                }
              }}
              className="bg-transparent border-none text-[10px] font-black text-gray-900 dark:text-white focus:ring-0 cursor-pointer uppercase"
            >
              <option value="">Choose Student...</option>
              {assignedStudents.map(s => (
                <option key={s.uid} value={s.uid}>{s.displayName}</option>
              ))}
            </select>
          </div>
        )}

        {/* Dynamic Body: Directory or Messages */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
           {loading ? (
             <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
           ) : isStaff && !activeChatId ? (
             /* ── STAFF DIRECTORY VIEW ── */
             <div className="flex-1 flex flex-col min-h-0">
                <div className="p-4 space-y-3">
                   {/* Admin Tab Toggles */}
                   {(userProfile?.role === 'Admin' || userProfile?.role === 'Super Admin') && (
                      <div className="flex p-1 bg-gray-100 dark:bg-[#1E293B] rounded-xl">
                        <button
                          onClick={() => setAdminTab('students')}
                          className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${adminTab === 'students' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-gray-400'}`}
                        >
                          Students
                        </button>
                        <button
                          onClick={() => setAdminTab('staff')}
                          className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${adminTab === 'staff' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-gray-400'}`}
                        >
                          Staff
                        </button>
                      </div>
                   )}
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search active channels..."
                        className="w-full bg-gray-50 dark:bg-[#1E293B] border-none rounded-2xl pl-9 pr-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                      />
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                   {filteredConversations.length === 0 ? (
                     <div className="text-center py-20 opacity-30 italic text-[10px] font-black uppercase">No active sessions.</div>
                   ) : filteredConversations.map(conv => {
                      const unread = conv.unreadCounts?.[userProfile?.uid || ''] || 0;
                      const otherName = Object.values(conv.participantNames).find(n => n !== userProfile?.displayName) || 'Support Session';
                      return (
                        <button
                          key={conv.id}
                          onClick={() => setActiveChatId(conv.id)}
                          className="w-full p-4 rounded-3xl hover:bg-gray-50 dark:hover:bg-[#1E293B]/50 transition-all flex items-center gap-4 group"
                        >
                           <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 shrink-0">
                              <User size={20} />
                           </div>
                           <div className="flex-1 text-left overflow-hidden">
                              <p className="text-xs font-black dark:text-white uppercase truncate tracking-tighter">{otherName}</p>
                              <p className="text-[10px] text-gray-400 truncate mt-0.5">{conv.lastMessage || 'Channel established.'}</p>
                           </div>
                           {unread > 0 && (
                             <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-[8px] font-black text-white animate-bounce">
                                {unread}
                             </div>
                           )}
                           <ChevronRight size={14} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                        </button>
                      );
                   })}
                </div>
             </div>
           ) : (
             /* ── CHAT VIEW ── */
             <>
               <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                  {(!activeChatId && !isStaff) ? (
                    <div className="text-center py-20 opacity-30 space-y-4">
                       <Bot size={48} className="mx-auto" />
                       <p className="text-xs font-black uppercase tracking-widest leading-relaxed">Initializing personal support channel...</p>
                    </div>
                  ) : activeMessages.length === 0 ? (
                    <div className="text-center py-20 opacity-30 space-y-4">
                       <Bot size={48} className="mx-auto" />
                       <p className="text-xs font-black uppercase tracking-widest leading-relaxed">Start the conversation</p>
                    </div>
                  ) : (
                    activeMessages.map((m, i) => {
                      const isMe = m.senderId === userId;
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={m.id || i}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                           <div className={`max-w-[85%] space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                              <div className={`p-4 rounded-[28px] text-sm font-medium leading-relaxed shadow-sm ${
                                isMe
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-tl-none'
                              }`}>
                                 {m.text}
                              </div>
                              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-2">
                                 {isMe ? 'Sent' : m.senderName} • {m.createdAt ? format(m.createdAt.toDate(), 'HH:mm') : 'Syncing'}
                              </span>
                           </div>
                        </motion.div>
                      );
                    })
                  )}
               </div>

               {/* Input Area */}
               <div className="p-6 border-t border-gray-100 dark:border-slate-800 shrink-0 bg-gray-50/30 dark:bg-slate-900/30">
                  {userProfile?.role !== 'Student' && (userProfile?.role === 'Admin' || userProfile?.role === 'Super Admin') && (
                     <button
                       onClick={() => sendBroadcast("Important System Update", adminTab === 'students' ? 'students' : 'staff')}
                       className="w-full mb-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 border border-amber-200 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-100 transition-all"
                     >
                        <Megaphone size={14} /> Send Broadcast to {adminTab}
                     </button>
                  )}
                  <form onSubmit={handleSend} className="relative">
                     <input
                       value={inputText}
                       onChange={(e) => setInputText(e.target.value)}
                       placeholder="Type a secure message..."
                       className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl pl-5 pr-14 py-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-blue-500 dark:text-white"
                     />
                     <button type="submit" disabled={!inputText.trim() || !activeChatId} className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                        <Send size={18} />
                     </button>
                  </form>
               </div>
             </>
           )}
        </div>
      </motion.div>
    </div>
  );
}
