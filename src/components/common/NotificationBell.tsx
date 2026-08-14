"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, X, Check, ExternalLink, CalendarClock, MessageSquare, AlertCircle, Info, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { AppNotification, Reminder } from "@/types";
import { formatDistanceToNow } from "date-fns";
import EmptyState from "./EmptyState";

export default function NotificationBell() {
  const { user, userId, role } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Real-time Notifications Listener
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: AppNotification[] = [];
      let unread = 0;
      snap.forEach((d) => {
        const data = d.data() as AppNotification;
        list.push({ id: d.id, ...data });
        if (!data.isRead) unread++;
      });
      setNotifications(list);
      setUnreadCount(unread);
    });

    return () => unsub();
  }, [userId]);

  // 2. Background Reminder Checker (Client-side Cron)
  useEffect(() => {
    if (!userId || role !== "Counselor") return;

    const checkReminders = async () => {
      try {
        const now = Date.now();
        // Query for this counselor's untriggered reminders only
        const q = query(
          collection(db, "reminders"),
          where("counselorUid", "==", userId),
          where("isTriggered", "==", false)
        );
        const snap = await getDocs(q);

        for (const d of snap.docs) {
          const reminder = { id: d.id, ...d.data() } as Reminder;

          if (reminder.triggerAt <= now) {
            // Trigger! Create notifications for both Counselor and Student
            const batchPromises = [
              // Notification for Counselor
              addDoc(collection(db, "notifications"), {
                userId: reminder.counselorUid,
                title: "🔔 Reminder Triggered",
                message: `Reminder for Student ${reminder.studentId}: ${reminder.message}`,
                isRead: false,
                link: `/counselor/students/portfolio?id=${reminder.studentUid}`,
                createdAt: serverTimestamp(),
              }),
              // Notification for Student
              addDoc(collection(db, "notifications"), {
                userId: reminder.studentUid,
                title: "📝 Study Task Reminder",
                message: reminder.message,
                isRead: false,
                link: "/dashboard",
                createdAt: serverTimestamp(),
              }),
              // Update Reminder as triggered
              updateDoc(doc(db, "reminders", d.id), { isTriggered: true })
            ];
            await Promise.all(batchPromises);
            console.log(`[ReminderEngine] Triggered reminder: ${reminder.id}`);
          }
        }
      } catch (err) {
        console.error("[ReminderEngine] Error:", err);
      }
    };

    // Run every minute
    const interval = setInterval(checkReminders, 60000);
    checkReminders(); // Initial check

    return () => clearInterval(interval);
  }, [userId, role]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, link: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { isRead: true });
      setIsOpen(false);
      router.push(link);
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.isRead);
      for (const n of unread) {
        if (n.id) await updateDoc(doc(db, "notifications", n.id), { isRead: true });
      }
    } catch (err) {
      console.error("Mark all as read error:", err);
    }
  };

  const getIcon = (title: string) => {
    if (!title) return <Info className="w-4 h-4 text-gray-400" />;
    if (title.includes("Reminder")) return <CalendarClock className="w-4 h-4 text-blue-500" />;
    if (title.includes("Message")) return <MessageSquare className="w-4 h-4 text-purple-500" />;
    if (title.includes("Urgent") || title.includes("Risk")) return <AlertCircle className="w-4 h-4 text-rose-500" />;
    return <Info className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-[#1E293B] animate-in zoom-in duration-300">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gray-50/50 dark:bg-[#0F172A]/50">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-tighter">Notifications</h3>
              {unreadCount > 0 && <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase">{unreadCount} New</span>}
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-[10px] font-black text-[#1a73e8] dark:text-blue-400 uppercase tracking-widest hover:underline flex items-center gap-1">
                <Check className="w-3 h-3" /> Mark All Read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50 dark:divide-slate-800">
            {notifications.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="All Caught Up!"
                description="You have no new notifications at this time. We'll alert you of any activity here."
              />
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => notif.id && handleMarkAsRead(notif.id, notif.link)}
                  className={`p-4 flex gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#0F172A] transition-colors relative ${!notif.isRead ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}`}
                >
                  {!notif.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1a73e8]" />}
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${!notif.isRead ? 'bg-white dark:bg-[#1E293B] shadow-sm' : 'bg-gray-50 dark:bg-[#0F172A]'}`}>
                    {getIcon(notif.title)}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className={`text-[13px] leading-tight dark:text-white ${!notif.isRead ? "font-black" : "font-bold text-gray-700"}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                      {notif.message}
                    </p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pt-1">
                      {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt.seconds * 1000), { addSuffix: true }) : "Just now"}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 mt-1" />
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-gray-100 dark:border-slate-700 text-center">
            <button
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Close Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
