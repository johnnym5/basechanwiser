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
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const SUPPORTIVE_RESPONSES = [
  "I'm here to support your UKVI preparation. Have you reviewed the 28-day rule lately?",
  "That's a great question. Remember to be specific about your chosen university in your answers.",
  "Stay focused on your goals! Your counselor will review your dossier soon.",
  "Excellent progress so far. Consistency is key to a successful CAS interview.",
  "I recommend checking the Resource Vault for the latest UKVI compliance checklists.",
  "Your career plans back home are a vital part of the 'Genuine Student' test. Keep refining them!",
  "Friendly reminder: ensure your bank statements meet the 31-day closing date requirement.",
  "You're doing great! Keep practicing your verbal delivery to sound natural and confident."
];

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
}

export default function AiChatModule() {
  const { user, role } = useAuth();
  const pathname = usePathname();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
          ? `👋 **Hello ${user.displayName || "Counselor"}!** I am your BASECHANWISER Operations Copilot. (Baseline Mode Active)`
          : `👋 **Hi ${user.displayName || "Student"}!** I am your 24/7 UKVI Pre-CAS Credibility Mentor. (Baseline Mode Active)`,
      };
      setMessages([initialGreeting]);
    }
  }, [user, role, messages.length]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getQuickChips = () => {
    if (role === "Counselor" || role === "Admin" || role === "Super Admin") {
      return [
        "📊 Summarize readiness",
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
      // Simulate network delay for baseline mode
      await new Promise(resolve => setTimeout(resolve, 800));

      const randomMsg = SUPPORTIVE_RESPONSES[Math.floor(Math.random() * SUPPORTIVE_RESPONSES.length)];
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: `[Offline Mode] ${randomMsg}\n\n(Note: AI services are currently disabled for baseline stability.)`,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      showToast("Error processing message", "error");
    } finally {
      setIsLoading(false);
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
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 items-center text-slate-500 text-xs italic">
            <Sparkles size={16} className="animate-spin text-indigo-400" />
            <span>Thinking...</span>
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
            placeholder="Ask anything..."
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
