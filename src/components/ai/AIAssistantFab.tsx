"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Trash2,
  Minimize2,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { collection, addDoc, doc, setDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  action?: {
    type: "CREATE_TAILORED_PACK";
    targetStudentId: string;
    packTitle: string;
    category?: string;
    questions: Array<{
      questionText: string;
      options: Array<{ text: string; isCorrect: boolean }>;
      explanation?: string;
    }>;
  };
  actionApproved?: boolean;
}

export default function AIAssistantFab() {
  const { user, role } = useAuth();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionProcessing, setActionProcessing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Initial welcome greeting when first opened
  useEffect(() => {
    if (messages.length === 0 && user) {
      const isStaff = role === "Counselor" || role === "Admin" || role === "Super Admin";
      const initialGreeting: ChatMessage = {
        id: "msg-welcome",
        sender: "assistant",
        text: isStaff
          ? `👋 **Hello ${user.displayName || "Counselor"}!** I am your BASECHANWISER Operations Copilot.\n\nI can analyze student readiness, answer UKVI rules questions, or generate custom recovery Question Packs for students based on their weak areas.`
          : `👋 **Hi ${user.displayName || "Student"}!** I am your 24/7 UKVI Pre-CAS Credibility Mentor.\n\nAsk me anything about UK visa financial rules, 28-day maintenance funds, or practice interview questions!`,
      };
      setMessages([initialGreeting]);
    }
  }, [user, role, messages.length]);

  // Context route title helper
  const getRouteLabel = () => {
    if (pathname.includes("/counselor/dashboard")) return "Counselor Traffic Light Dashboard";
    if (pathname.includes("/counselor/students")) return "Student Directory & Pack Manager";
    if (pathname.includes("/counselor/packs")) return "Question Packs Library";
    if (pathname.includes("/counselor/settings")) return "Settings & Resource Vault";
    if (pathname.includes("/interview-pack")) return "Student Interview Pack Form";
    if (pathname.includes("/learning")) return "Foundation Learning Modules";
    if (pathname.includes("/dashboard")) return "Student Preparation Tracker";
    return "BASECHANWISER Workspace";
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Quick Action Chips
  const getQuickChips = () => {
    if (role === "Counselor" || role === "Admin" || role === "Super Admin") {
      return [
        "📊 Summarize student readiness",
        "🎯 Generate recovery pack for a student",
        "💡 Explain 28-day financial rule",
      ];
    }
    return [
      "💰 What are the 28-day maintenance rules?",
      "⏰ How many hours can I work during term time?",
      "🎯 Help me practice interview questions",
    ];
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !user || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText("");
    setIsLoading(true);

    try {
      // Build API request payload with Context
      const payload = {
        message: userMsg.text,
        history: messages.map((m) => ({ sender: m.sender, text: m.text })),
        context: {
          userRole: role || "Student",
          userUid: user.uid,
          currentRoute: pathname,
          activeEntityData: {
            routeLabel: getRouteLabel(),
          },
        },
      };

      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to query AI Assistant");
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: data.text,
        action: data.action,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "assistant",
          text: `⚠️ **Error:** ${err.message || "Could not reach Gemini AI service. Please check your connection."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Counselor Action Approval Handler: Creates Pack in Firestore & Assigns to Student
  const handleApproveAction = async (msgId: string, action: NonNullable<ChatMessage["action"]>) => {
    setActionProcessing(msgId);
    try {
      // 1. Create Question Pack in `question_packs` collection
      const newPackRef = await addDoc(collection(db, "question_packs"), {
        title: action.packTitle,
        description: `Targeted AI recovery pack created for student (${action.targetStudentId}).`,
        category: action.category || "Financial Credibility",
        videoUrl: "",
        passScore: 80,
        isDefault: false,
        questions: action.questions.map((q, idx) => ({
          id: `q-ai-${idx}-${Date.now()}`,
          questionText: q.questionText,
          options: q.options.map((opt, oIdx) => ({
            id: `opt-ai-${oIdx}`,
            text: opt.text,
            isCorrect: opt.isCorrect,
          })),
          explanation: q.explanation || "",
        })),
        createdAt: serverTimestamp(),
      });

      // 2. If targetStudentId is provided or found, append pack ID to student document in `Users`
      if (action.targetStudentId) {
        try {
          const userDocRef = doc(db, "Users", action.targetStudentId);
          await setDoc(userDocRef, { assignedPackIds: arrayUnion(newPackRef.id) }, { merge: true });
        } catch (e) {
          console.warn("Could not auto-assign to specific UID, pack created in library:", e);
        }
      }

      // Mark message action as approved
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, actionApproved: true } : m))
      );

      showToast(`Question Pack "${action.packTitle}" successfully created & saved to library!`, "success");
    } catch (err: any) {
      console.error("Action execution error:", err);
      showToast(`Failed to create Question Pack: ${err.message}`, "error");
    } finally {
      setActionProcessing(null);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Toast Notification inside Copilot overlay */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500"
              : "bg-rose-600 text-white border-rose-500"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── 1. Floating Action Button (FAB) ───────────────────────── */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setHasUnread(false);
          }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-[#1a73e8] to-blue-600 hover:from-[#1557b0] hover:to-blue-700 text-white shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 group focus:outline-none ring-4 ring-blue-500/20"
          title="Open BASECHANWISER AI Copilot"
          aria-label="BASECHANWISER AI Copilot"
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
          {hasUnread && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full" />
          )}
        </button>
      )}

      {/* ── 2. Slide-Over Chat Panel / Overlay Drawer ───────────── */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 w-full sm:w-[400px] h-full sm:h-[600px] max-h-[100dvh] bg-white dark:bg-gray-800 sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-slide-up sm:animate-fade-up">

          {/* Panel Header */}
          <div className="bg-gradient-to-r from-blue-600 to-[#1a73e8] p-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm tracking-tight font-google truncate">
                  BASECHANWISER Copilot
                </h3>
                <p className="text-[10px] text-blue-100 flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Context: {getRouteLabel()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-xl hover:bg-white/20 text-blue-100 transition-colors"
                title="Clear Chat History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors"
                title="Minimize Copilot"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs bg-gray-50/50 dark:bg-gray-900/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "assistant" && (
                  <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-[#1a73e8] dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5 border border-blue-200 dark:border-blue-800">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3.5 space-y-2 leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#1a73e8] text-white rounded-br-xs shadow-xs"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-xs shadow-xs"
                  }`}
                >
                  {/* Message Content rendered formatted */}
                  <div className="whitespace-pre-wrap font-sans text-xs">
                    {msg.text}
                  </div>

                  {/* AI Action Block Confirmation Card (if Counselor Tailored PackAction generated) */}
                  {msg.action && msg.action.type === "CREATE_TAILORED_PACK" && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 bg-blue-50/80 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-xs">
                        <PlusCircle className="w-4 h-4 text-[#1a73e8]" />
                        <span>Proposed Question Pack</span>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white text-xs">
                        {msg.action.packTitle}
                      </p>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400">
                        {msg.action.questions.length} Questions • Category: {msg.action.category || "Financial Credibility"}
                      </p>

                      {msg.actionApproved ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs pt-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Pack Created & Assigned to Library!</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApproveAction(msg.id, msg.action!)}
                          disabled={actionProcessing === msg.id}
                          className="w-full mt-1 py-2 px-3 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {actionProcessing === msg.id ? "Creating Pack..." : "Approve & Save Pack to Library"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {msg.sender === "user" && (
                  <div className="w-7 h-7 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-center text-gray-400 dark:text-gray-500 text-xs italic">
                <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-[#1a73e8] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <span>BASECHANWISER Copilot is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Context Action Chips */}
          <div className="px-3 py-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex gap-2 overflow-x-auto shrink-0">
            {getQuickChips().map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                disabled={isLoading}
                className="whitespace-nowrap text-[11px] font-semibold px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-gray-700 dark:text-gray-300 hover:text-[#1a73e8] dark:hover:text-blue-300 border border-gray-200 dark:border-gray-600 transition-colors shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Text Input Footer */}
          <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 shrink-0 pb-safe">
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
              placeholder={`Ask Copilot (${role || "Student"})...`}
              className="flex-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl px-3.5 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#1a73e8] resize-none max-h-24"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              className="w-9 h-9 rounded-2xl bg-[#1a73e8] hover:bg-[#1557b0] text-white flex items-center justify-center transition-all disabled:opacity-40 shrink-0 shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
