"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
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

export default function AiChatModule() {
  const { user, role, userProfile } = useAuth();
  const pathname = usePathname();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionProcessing, setActionProcessing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0 && user) {
      const isStaff = role === "Counselor" || role === "Admin" || role === "Super Admin";
      const initialGreeting: ChatMessage = {
        id: "msg-welcome",
        sender: "assistant",
        text: isStaff
          ? `👋 **Hello ${user.displayName || "Counselor"}!** I am your BASECHANWISER Operations Copilot.\n\nI can analyze student readiness, answer UKVI rules questions, or generate custom recovery Question Packs for students.`
          : `👋 **Hi ${user.displayName || "Student"}!** I am your 24/7 UKVI Pre-CAS Credibility Mentor.\n\nAsk me anything about UK visa financial rules or practice interview questions!`,
      };
      setMessages([initialGreeting]);
    }
  }, [user, role, messages.length]);

  const getRouteLabel = () => {
    if (pathname.includes("/counselor/dashboard")) return "Counselor Dashboard";
    if (pathname.includes("/counselor/students")) return "Student Directory";
    if (pathname.includes("/counselor/packs")) return "Question Packs";
    if (pathname.includes("/interview-pack")) return "Interview Pack Form";
    if (pathname.includes("/learning")) return "Learning Modules";
    if (pathname.includes("/dashboard")) return "Preparation Tracker";
    return "BASECHANWISER Workspace";
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getQuickChips = () => {
    if (role === "Counselor" || role === "Admin" || role === "Super Admin") {
      return [
        "📊 Summarize readiness",
        "🎯 Generate recovery pack",
        "💡 Explain 28-day rule",
      ];
    }
    return [
      "💰 Financial rules",
      "⏰ Working hours",
      "🎯 Interview practice",
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
      const payload = {
        message: userMsg.text,
        history: messages.map((m) => ({ sender: m.sender, text: m.text })),
        context: {
          userRole: role || "Student",
          userUid: user.uid,
          currentRoute: pathname,
          activeEntityData: {
            routeLabel: getRouteLabel(),
            targetUniversity: userProfile?.targetUniversity || "Unknown",
            targetCourse: userProfile?.targetCourse || "Unknown"
          },
        }
      };

      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 429) {
        showToast(data.error || "Rate limit exceeded. Please wait.", "error");
        setIsLoading(false);
        return;
      }

      if (!response.ok) throw new Error(data?.error || "Failed to reach AI service");

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
          text: `⚠️ **Error:** ${err.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAction = async (msgId: string, action: NonNullable<ChatMessage["action"]>) => {
    setActionProcessing(msgId);
    try {
      const newPackRef = await addDoc(collection(db, "question_packs"), {
        title: action.packTitle,
        description: `AI recovery pack for student (${action.targetStudentId}).`,
        category: action.category || "Financial Credibility",
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

      if (action.targetStudentId) {
        const userDocRef = doc(db, "Users", action.targetStudentId);
        await setDoc(userDocRef, { assignedPackIds: arrayUnion(newPackRef.id) }, { merge: true });
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, actionApproved: true } : m))
      );
      showToast(`Pack "${action.packTitle}" successfully created!`, "success");
    } catch (err: any) {
      showToast(`Failed to create pack: ${err.message}`, "error");
    } finally {
      setActionProcessing(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {toast && (
        <div className={`absolute top-4 left-4 right-4 z-50 px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold border ${
          toast.type === "success" ? "bg-emerald-600 text-white border-emerald-500" : "bg-rose-600 text-white border-rose-500"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            {msg.sender === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                <Bot size={18} />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
              msg.sender === "user" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-200 border border-slate-700"
            }`}>
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {msg.action?.type === "CREATE_TAILORED_PACK" && (
                <div className="mt-3 p-3 bg-slate-900/50 rounded-xl border border-indigo-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                    <PlusCircle size={14} />
                    <span>Proposed Question Pack</span>
                  </div>
                  <p className="font-bold text-white text-xs">{msg.action.packTitle}</p>
                  {msg.actionApproved ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 size={14} /> <span>Created!</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleApproveAction(msg.id, msg.action!)}
                      disabled={!!actionProcessing}
                      className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {actionProcessing === msg.id ? "Creating..." : "Approve & Save"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 items-center text-slate-500 text-xs italic">
            <Sparkles size={16} className="animate-spin text-indigo-400" />
            <span>AI is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-t border-slate-800 flex gap-2 overflow-x-auto bg-slate-800/30">
        {getQuickChips().map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip)}
            className="whitespace-nowrap text-[10px] font-bold px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input */}
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
            placeholder="Ask AI..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none max-h-32"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
