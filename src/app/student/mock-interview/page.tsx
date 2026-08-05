"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { Loader2, Send, XCircle, AlertTriangle, ShieldCheck, Sparkles } from "lucide-react";

type ChatRole = "ai" | "student" | "system";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

const categories = ["Financial", "Academic", "Career", "Full UKVI Mock"];

const createMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export default function StudentMockInterviewPage() {
  const { userId, loading } = useAuth();
  const [category, setCategory] = useState<string>(categories[0]);
  const [started, setStarted] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [scores, setScores] = useState<number[]>([]);
  const [metrics, setMetrics] = useState({ accuracy: 70, grammar: 70, consistency: 70 });
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const averageScore = useMemo(() => {
    if (!scores.length) return 0;
    return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
  }, [scores]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const appendMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const startInterview = async () => {
    if (!userId) {
      setError("Please sign in before starting a mock interview.");
      return;
    }
    setError(null);
    setStatusMessage("Starting your UKVI mock interview...");
    setStarted(true);
    setInProgress(true);
    setMessages([]);
    setInputText("");
    setCurrentQuestion("");
    setScores([]);
    setRedFlags([]);
    setSessionId(null);
    setMetrics({ accuracy: 70, grammar: 70, consistency: 70 });

    try {
      const res = await fetch("/api/ai/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: userId,
          category,
          action: "start",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to start the mock interview.");
      }

      setCurrentQuestion(data?.nextQuestion || "");
      appendMessage({ id: createMessageId(), role: "ai", content: data?.nextQuestion || "I cannot generate a first question right now." });
      setStatusMessage("Interview started. Answer the first question when ready.");
    } catch (err: any) {
      setError(err.message || "Unexpected error while starting interview.");
      setStarted(false);
      setInProgress(false);
    }
  };

  const sendAnswer = async () => {
    if (!userId || !currentQuestion.trim() || !inputText.trim()) return;
    setError(null);
    setStatusMessage("Submitting your answer for evaluation...");

    const answer = inputText.trim();
    appendMessage({ id: createMessageId(), role: "student", content: answer });
    setInputText("");

    try {
      const res = await fetch("/api/ai/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: userId,
          category,
          action: "step",
          questionText: currentQuestion,
          studentResponse: answer,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to evaluate your answer.");
      }

      appendMessage({ id: createMessageId(), role: "system", content: data?.feedback || "AI coach could not generate feedback." });
      appendMessage({ id: createMessageId(), role: "ai", content: data?.nextQuestion || "Unable to ask the next question right now." });

      setCurrentQuestion(data?.nextQuestion || "");
      setScores((prev) => [...prev, Number(data?.score ?? 0)]);
      setMetrics({
        accuracy: clamp(Number(data?.accuracy ?? data?.score ?? 70)),
        grammar: clamp(Number(data?.grammar ?? 70)),
        consistency: clamp(Number(data?.consistency ?? 70)),
      });
      setRedFlags(Array.isArray(data?.redFlags) ? data.redFlags : []);
      setStatusMessage("Answer evaluated. Continue to the next question.");
    } catch (err: any) {
      setError(err.message || "Unexpected error while submitting answer.");
    }
  };

  const endInterview = async () => {
    if (!userId) {
      setError("You must be signed in to save the interview session.");
      return;
    }

    const finalScore = averageScore;
    const transcript = messages
      .filter((item) => item.role === "ai" || item.role === "student")
      .map((message) => ({ role: message.role, content: message.content }));

    setSaving(true);
    setError(null);
    setStatusMessage("Saving your mock interview session...");

    try {
      const res = await fetch("/api/ai/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: userId,
          category,
          action: "complete",
          finalScore,
          transcript,
          redFlagsTriggered: redFlags.length,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to save the interview session.");
      }
      setSessionId(data?.sessionId || null);
      setStatusMessage("Interview saved successfully.");
      setInProgress(false);
    } catch (err: any) {
      setError(err.message || "Unexpected error while saving session.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 pb-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">AI Mock Interview Coach</h1>
            </div>
            <p className="max-w-2xl text-sm text-gray-500 dark:text-slate-400">Practice unlimited UKVI-style interview questions with a strict, fair ECO coach. Select your focus area, answer each prompt, and get feedback instantly.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:w-auto">
            <div className="rounded-[32px] border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
              <span className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-slate-500">Overall Score</span>
              <p className="mt-3 text-4xl font-black text-slate-900 dark:text-white">{averageScore}%</p>
            </div>
            <div className="rounded-[32px] border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
              <span className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-slate-500">Session Status</span>
              <p className="mt-3 text-xl font-black text-slate-900 dark:text-white">{inProgress ? "In Progress" : started ? "Completed" : "Ready"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_0.9fr] gap-8">
          <section className="rounded-[40px] border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-sm p-6 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-slate-500">Interview focus</p>
                <div className="mt-3 flex items-center gap-3">
                  <select
                    value={category}
                    disabled={inProgress}
                    onChange={(event) => setCategory(event.target.value)}
                    className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-gray-900 dark:text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    {categories.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <button
                    onClick={startInterview}
                    disabled={inProgress || loading}
                    className="rounded-full bg-[#1a73e8] text-white font-black uppercase text-xs tracking-[0.3em] px-5 py-3 hover:bg-[#1658b1] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Start Mock Interview
                  </button>
                </div>
              </div>
              <div className="rounded-3xl bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-800 dark:text-blue-200">
                <p className="font-black">Coach Note</p>
                <p className="mt-2 text-sm leading-6">Answer each question clearly, avoid intent-based statements, and keep your UK study purpose strong.</p>
              </div>
            </div>

            <div className="flex-1 overflow-hidden rounded-[32px] border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111827] p-5">
              <div className="h-[56vh] overflow-y-auto space-y-4 pr-2">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-slate-500">
                    <p className="text-lg font-black">Your interview transcript will appear here.</p>
                    <p className="mt-3 text-sm">Start the interview to see questions, evaluation feedback, and coaching advice.</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className={`max-w-[95%] ${message.role === "student" ? "ml-auto text-right" : "mr-auto"}`}>
                      <div className={`inline-flex flex-col gap-2 rounded-[32px] px-5 py-4 shadow-sm ${
                        message.role === "ai"
                          ? "bg-slate-900 text-white"
                          : message.role === "student"
                            ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                            : "bg-amber-100 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100"
                      }`}>
                        <span className="text-xs uppercase tracking-[0.24em] font-black">
                          {message.role === "ai" ? "ECO Coach" : message.role === "student" ? "Your Answer" : "Evaluation"}
                        </span>
                        <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messageEndRef} />
              </div>
            </div>

            <div className="mt-6 rounded-[32px] border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <textarea
                  rows={4}
                  value={inputText}
                  disabled={!inProgress}
                  onChange={(event) => setInputText(event.target.value)}
                  placeholder={inProgress ? "Type your answer here..." : "Start the interview to unlock the chat."}
                  className="min-h-[140px] w-full rounded-3xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-4 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <div className="flex flex-col gap-3">
                  <button
                    onClick={sendAnswer}
                    disabled={!inProgress || !inputText.trim()}
                    className="rounded-full bg-[#1a73e8] text-white uppercase text-xs tracking-[0.3em] font-black px-5 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="inline-flex items-center gap-2"><Send className="w-4 h-4" /> Send</span>
                  </button>
                  <button
                    onClick={endInterview}
                    disabled={!started || saving}
                    className="rounded-full bg-slate-900 text-white uppercase text-xs tracking-[0.3em] font-black px-5 py-4 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="inline-flex items-center gap-2"><XCircle className="w-4 h-4" /> End Interview</span>
                  </button>
                </div>
              </div>
              {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
              {statusMessage && <p className="mt-4 text-sm text-gray-500 dark:text-slate-400">{statusMessage}</p>}
              {sessionId && <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-300">Session saved: {sessionId}</p>}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[40px] border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm">
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Live Coaching Metrics</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Track your current mock interview performance and warning signals as you answer.</p>

              <div className="mt-6 space-y-5">
                <div>
                  <div className="flex items-center justify-between text-sm uppercase tracking-[0.3em] text-gray-400 dark:text-slate-500 font-bold mb-3">Accuracy <span>{metrics.accuracy}%</span></div>
                  <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${metrics.accuracy}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm uppercase tracking-[0.3em] text-gray-400 dark:text-slate-500 font-bold mb-3">Grammar <span>{metrics.grammar}%</span></div>
                  <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${metrics.grammar}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm uppercase tracking-[0.3em] text-gray-400 dark:text-slate-500 font-bold mb-3">Consistency <span>{metrics.consistency}%</span></div>
                  <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${metrics.consistency}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[40px] border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm">
              <div className="flex items-center gap-3 text-lg font-black text-gray-900 dark:text-white">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                <span>Red Flag Warnings</span>
              </div>
              <div className="mt-4 space-y-3">
                {redFlags.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-500 dark:text-slate-400">
                    <p>No red flags detected yet. Keep your intent clear and study-focused.</p>
                  </div>
                ) : (
                  redFlags.map((flag, index) => (
                    <div key={index} className="rounded-3xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-900 dark:text-amber-100">
                      {flag}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[40px] border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm">
              <div className="flex items-center gap-3 text-lg font-black text-gray-900 dark:text-white">
                <Sparkles className="w-6 h-6 text-blue-500" />
                <span>Quick Tips</span>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-gray-500 dark:text-slate-400 list-disc list-inside leading-6">
                <li>Answer each question directly and briefly.</li>
                <li>Avoid statements that sound like permanent settlement intentions.</li>
                <li>Keep your study goal aligned with the chosen category.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
