"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useChat } from "@/hooks/useChat";
import { useAddressBook } from "@/hooks/useAddressBook";
import { db } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import {
  Send,
  Users,
  User,
  Megaphone,
  MessageSquare,
  Loader2,
  Search,
  ChevronRight,
  ShieldCheck,
  History,
  X,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

type AdminTab = 'students' | 'staff';

/**
 * SupportTerminal: Professional role-aware messaging hub.
 * Features: Address book hydration, real-time presence, and global broadcast.
 */
export default function SupportTerminal() {
  const { userProfile, userId } = useAuth();

  // Role-Based Support State
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [counselorName, setCounselorName] = useState<string | null>(null);

  // 1. Hook Integration
  const {
    conversations,
    activeMessages,
    loading: chatLoading,
    subscribeToMessages,
    startConversation,
    sendMessage,
    markAsRead,
    sendBroadcast
  } = useChat(userProfile);

  const { users, loading: addressLoading } = useAddressBook(userProfile?.role || null, userProfile?.uid || null);

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<AdminTab>('students');
  const [inputText, setText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastText, setBroadcastText] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const isGlobalAdmin = userProfile?.role === 'Admin' || userProfile?.role === 'Super Admin';

  // 2. Role-Based Support Initialization
  useEffect(() => {
    if (userProfile?.role === 'Counselor') {
      const fetchStudents = async () => {
        try {
          const q = query(collection(db, 'Users'), where('assignedCounselorId', '==', userProfile.uid));
          const snap = await getDocs(q);
          const students = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
          setAssignedStudents(students);
          if (students.length > 0) {
            // Automatically select the first student to start the link
            handleSelectContact(students[0]);
            setSelectedStudentId(students[0].uid);
          }
        } catch (err) {
          console.error("Error fetching assigned students:", err);
        }
      };
      fetchStudents();
    } else if (userProfile?.role === 'Student') {
      setSelectedStudentId(userProfile.uid);

      // Fetch assigned counselor name
      if (userProfile?.assignedCounselorId) {
        const fetchCounselor = async () => {
          const cSnap = await getDoc(doc(db, "Users", userProfile.assignedCounselorId!));
          if (cSnap.exists()) setCounselorName(cSnap.data().displayName);
        };
        fetchCounselor();
      }
    }
  }, [userProfile]);

  // 3. Filter Registry (Address Book) Logic
  // Optimized with useMemo to handle instant search across high-density lists.
  const displayList = useMemo(() => {
    return users.filter(u => {
      // Security: Don't show self in the address book
      if (u.uid === userProfile?.uid) return false;

      const matchesSearch = (u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                            (u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

      if (!matchesSearch) return false;

      // Role-Based Visibility Rules
      if (isGlobalAdmin) {
         // Admins see everyone grouped by tab
         return adminTab === 'students' ? u.role === 'Student' : u.role !== 'Student';
      } else if (userProfile?.role === 'Counselor') {
         // Counselors see assigned students OR Admins for support escalation
         return (u.role === 'Student' && u.assignedCounselorId === userProfile.uid) ||
                (u.role === 'Admin' || u.role === 'Super Admin' || u.role === 'Head of Compliance');
      }
      return false;
    });
  }, [users, searchTerm, adminTab, userProfile, isGlobalAdmin]);

  // 3. Subscription & Read Management
  useEffect(() => {
    if (!activeChatId) return;
    const unsubscribe = subscribeToMessages(activeChatId);
    markAsRead(activeChatId);
    return () => unsubscribe();
  }, [activeChatId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages]);

  // 4. Action Handlers
  const handleSelectContact = async (target: any) => {
    const convId = await startConversation(target);
    if (convId) setActiveChatId(convId);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId) return;

    const activeConv = conversations.find(c => c.id === activeChatId);
    if (!activeConv) return;

    await sendMessage(activeChatId, inputText, activeConv.participants);
    setText("");
  };

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) return;
    await sendBroadcast(broadcastText, adminTab);
    setBroadcastText("");
    setShowBroadcast(false);
    alert("Broadcast dispatched successfully.");
  };

  if (chatLoading || addressLoading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin text-blue-500" size={48} />
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Establishing Secure Uplink...</p>
    </div>
  );

  const activeConv = conversations.find(c => c.id === activeChatId);

  return (
    <div className="flex h-[75vh] bg-white dark:bg-[#0F172A] rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 transition-all">

      {/* ── SIDEBAR: Address Book ── */}
      <div className="w-80 border-r border-gray-50 dark:border-slate-800 flex flex-col bg-gray-50/30 dark:bg-slate-900/50">

        <div className="p-6 border-b border-gray-50 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
             <h2 className="text-sm font-black dark:text-white uppercase tracking-widest">Address Book</h2>
             {isGlobalAdmin && (
               <button
                 onClick={() => setShowBroadcast(true)}
                 className="p-2.5 rounded-xl bg-indigo-600 text-white hover:scale-110 transition-all shadow-lg shadow-indigo-500/30"
               >
                 <Megaphone size={16} />
               </button>
             )}
          </div>

          {isGlobalAdmin && (
            <div className="flex p-1 bg-gray-100 dark:bg-[#1E293B] rounded-2xl">
               <button
                 onClick={() => setAdminTab('students')}
                 className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${adminTab === 'students' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 Students
               </button>
               <button
                 onClick={() => setAdminTab('staff')}
                 className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${adminTab === 'staff' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
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
               placeholder="Instant search..."
               className="w-full bg-white dark:bg-[#1E293B] border-none rounded-2xl pl-9 pr-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 shadow-sm"
             />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
           {displayList.length === 0 ? (
             <div className="text-center py-20 opacity-30 italic text-[10px] font-black uppercase">No contacts found.</div>
           ) : displayList.map(contact => {
              // Check if we have an active conversation with this contact to show unread
              const associatedConv = conversations.find(c => c.participants.includes(contact.uid));
              const unread = associatedConv?.unreadCounts?.[userProfile?.uid || ''] || 0;
              const isActive = activeConv?.participants.includes(contact.uid);

              return (
                <button
                  key={contact.uid}
                  onClick={() => handleSelectContact(contact)}
                  className={`w-full p-4 rounded-[28px] transition-all flex items-center gap-4 group ${isActive ? 'bg-white dark:bg-[#1E293B] shadow-md border border-gray-100 dark:border-slate-700' : 'hover:bg-white/50 dark:hover:bg-[#1E293B]/30'}`}
                >
                   <div className="relative shrink-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 dark:bg-slate-800 text-gray-400'}`}>
                         {contact.displayName?.charAt(0).toUpperCase()}
                      </div>
                      {/* Real-time Presence Indicator */}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-white dark:border-[#1E293B] transition-colors ${contact.isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-400'}`} />
                   </div>
                   <div className="flex-1 text-left overflow-hidden">
                      <p className="text-xs font-black dark:text-white uppercase truncate tracking-tighter">{contact.displayName}</p>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">{contact.role}</p>
                   </div>
                   {unread > 0 && (
                     <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-lg animate-bounce">
                        {unread}
                     </div>
                   )}
                </button>
              );
           })}
        </div>
      </div>

      {/* ── CHAT WINDOW ── */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#0F172A] relative">
         {activeChatId && activeConv ? (
           <>
             {/* Dynamic Header */}
             <div className="p-6 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between bg-gray-50/20 dark:bg-slate-950/20">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                      <MessageSquare size={24} />
                   </div>
                   <div className="flex items-center gap-4">
                      {userProfile?.role === 'Student' ? (
                        <div className="flex items-center gap-3">
                           <div>
                              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                 Security Uplink Active
                              </p>
                              <h3 className="text-sm font-black dark:text-white uppercase tracking-widest mt-0.5">
                                 Chatting with Counselor {counselorName || 'Support'}
                              </h3>
                           </div>
                        </div>
                      ) : (
                        <div>
                           <h3 className="text-sm font-black dark:text-white uppercase tracking-widest">
                             {Object.entries(activeConv.participantNames).find(([uid]) => uid !== userProfile?.uid)?.[1]}
                           </h3>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                             Encrypted Data Link
                           </p>
                        </div>
                      )}

                      {userProfile?.role === 'Counselor' && (
                        <div className="ml-4">
                          <select
                            value={selectedStudentId || ""}
                            onChange={(e) => {
                              const student = assignedStudents.find(s => s.uid === e.target.value);
                              if (student) {
                                handleSelectContact(student);
                                setSelectedStudentId(student.uid);
                              }
                            }}
                            className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-700 text-xs font-bold dark:text-white rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                          >
                            <option value="" disabled>Select a Student to Chat</option>
                            {assignedStudents.length === 0 ? (
                              <option value="">No Assigned Students</option>
                            ) : (
                              assignedStudents.map(student => (
                                <option key={student.uid} value={student.uid}>
                                  {student.displayName || student.email}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                      )}
                   </div>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                   Channel: {activeChatId}
                </div>
             </div>

             {/* Feed */}
             <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                {activeMessages.map((m, i) => {
                  const isMe = m.senderId === userProfile?.uid;
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      key={m.id || i}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                       <div className={`max-w-[70%] space-y-1 ${isMe ? 'text-right' : 'text-left'}`}>
                          <div className={`p-5 rounded-[32px] text-sm font-bold leading-relaxed shadow-sm ${
                            m.isBroadcast
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 border-2 border-amber-200 dark:border-amber-800 italic rounded-b-none'
                              : isMe
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-gray-100 dark:bg-[#1E293B] dark:text-slate-200 rounded-tl-none'
                          }`}>
                             {m.isBroadcast && <Megaphone size={14} className="inline mr-2 mb-1 text-amber-600" />}
                             {m.text}
                          </div>
                          <div className="flex items-center gap-2 px-2 mt-1">
                             <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{isMe ? 'CONFIRMED' : m.senderName}</span>
                             <span className="text-[8px] font-bold text-gray-300">•</span>
                             <span className="text-[8px] font-black text-gray-300 uppercase">{m.createdAt ? format(m.createdAt.toDate(), 'HH:mm') : 'Sync...'}</span>
                          </div>
                       </div>
                    </motion.div>
                  );
                })}
             </div>

             {/* Secure Input Area */}
             <form onSubmit={handleSend} className="p-8 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-50 dark:border-slate-800 flex gap-4 items-center">
                <input
                  value={inputText}
                  onChange={e => setText(e.target.value)}
                  placeholder="Enter encrypted transmission..."
                  className="flex-1 bg-white dark:bg-[#1E293B] border-none rounded-[28px] px-8 py-5 text-sm font-bold shadow-inner focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
                <button
                  disabled={!inputText.trim()}
                  className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-blue-500/30 disabled:opacity-50"
                >
                   <Send size={22} />
                </button>
             </form>
           </>
         ) : (
           <div className="flex-1 flex flex-col items-center justify-center space-y-8 opacity-20">
              <Users size={160} strokeWidth={1} className="text-gray-400" />
              <div className="text-center space-y-3">
                 <h3 className="text-3xl font-black uppercase tracking-tighter dark:text-white">Directory Selection Pending</h3>
                 <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-500">Initiate Data Link from Sidebar</p>
              </div>
           </div>
         )}
      </div>

      {/* ── BROADCAST OVERLAY ── */}
      <AnimatePresence>
        {showBroadcast && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-[40px] p-12 shadow-2xl border border-gray-100 dark:border-slate-700 space-y-8"
             >
                <div className="flex items-center gap-5 text-indigo-600">
                   <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center"><Megaphone size={32} /></div>
                   <div>
                      <h2 className="text-3xl font-black uppercase tracking-tighter dark:text-white leading-none">Global Broadcast</h2>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Wide-Beam Transmission</p>
                   </div>
                </div>
                <div className="space-y-6">
                   <p className="text-xs font-bold text-gray-500 uppercase leading-relaxed tracking-widest">
                      Transmission content will be delivered to all nodes in the <span className="text-indigo-600 font-black">{adminTab}</span> directory.
                   </p>
                   <textarea
                     value={broadcastText}
                     onChange={e => setBroadcastText(e.target.value)}
                     rows={6}
                     className="w-full bg-gray-50 dark:bg-[#0F172A] border-none rounded-[32px] p-8 text-sm font-bold focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none shadow-inner"
                     placeholder="Enter high-priority content..."
                   />
                </div>
                <div className="flex gap-4 pt-4">
                   <button onClick={() => setShowBroadcast(false)} className="flex-1 py-5 text-xs font-black uppercase text-gray-400 hover:text-gray-900 transition-all">Abort</button>
                   <button onClick={handleBroadcast} className="flex-2 px-10 py-5 bg-indigo-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-500/40 active:scale-95 transition-all">Execute Transmission</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
