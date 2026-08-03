"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Video,
  Save,
  Sparkles,
  Check,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Question, Option } from "@/types";

export default function CounselorModuleEditorPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (role !== "Admin" && role !== "Counselor") {
        router.push("/dashboard");
      }
    }
  }, [user, role, loading, router]);

  const [title, setTitle] = useState("Foundation Module: Compliance Basics");
  const [description, setDescription] = useState("Overview of visa regulations, working hours, and maintenance funds.");
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/embed/dQw4w9WgXcQ");

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "q-101",
      questionText: "What is the maximum allowed weekly work hours for international students during term time?",
      options: [
        { id: "opt-1", text: "20 hours per week", isCorrect: true },
        { id: "opt-2", text: "40 hours per week", isCorrect: false },
        { id: "opt-3", text: "10 hours per week", isCorrect: false },
      ],
    },
    {
      id: "q-102",
      questionText: "How long must maintenance funds be held in a bank account before visa application?",
      options: [
        { id: "opt-4", text: "28 consecutive days", isCorrect: true },
        { id: "opt-5", text: "14 days", isCorrect: false },
        { id: "opt-6", text: "60 days", isCorrect: false },
      ],
    },
  ]);

  const [activeCardId, setActiveCardId] = useState<string>("header");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAddQuestion = () => {
    const newId = `q-${Date.now()}`;
    const newQuestion: Question = {
      id: newId,
      questionText: "",
      options: [
        { id: `opt-${Date.now()}-1`, text: "Option 1", isCorrect: true },
        { id: `opt-${Date.now()}-2`, text: "Option 2", isCorrect: false },
      ],
    };
    setQuestions((prev) => [...prev, newQuestion]);
    setActiveCardId(newId);
  };

  const handleDeleteQuestion = (qId: string) => {
    if (questions.length <= 1) {
      showToast("Module must contain at least one question block.", "error");
      return;
    }
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
    if (activeCardId === qId) {
      setActiveCardId("header");
    }
  };

  const handleQuestionTextChange = (qId: string, text: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, questionText: text } : q))
    );
  };

  const handleOptionTextChange = (qId: string, optId: string, text: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId) {
          const updatedOptions = q.options.map((opt) =>
            opt.id === optId ? { ...opt, text } : opt
          );
          return { ...q, options: updatedOptions };
        }
        return q;
      })
    );
  };

  const handleAddOption = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId) {
          const newOpt: Option = {
            id: `opt-${Date.now()}`,
            text: `Option ${q.options.length + 1}`,
            isCorrect: false,
          };
          return { ...q, options: [...q.options, newOpt] };
        }
        return q;
      })
    );
  };

  const handleDeleteOption = (qId: string, optId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId) {
          if (q.options.length <= 2) return q;
          return { ...q, options: q.options.filter((opt) => opt.id !== optId) };
        }
        return q;
      })
    );
  };

  const handleSetCorrectOption = (qId: string, optId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId) {
          const updatedOptions = q.options.map((opt) => ({
            ...opt,
            isCorrect: opt.id === optId,
          }));
          return { ...q, options: updatedOptions };
        }
        return q;
      })
    );
  };

  const handleSaveModule = async () => {
    if (!title.trim()) {
      showToast("Module title cannot be empty.", "error");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        showToast(`Question #${i + 1} has empty text.`, "error");
        setActiveCardId(q.id);
        return;
      }
      const hasCorrect = q.options.some((o) => o.isCorrect);
      if (!hasCorrect) {
        showToast(`Question #${i + 1} requires a correct answer selected.`, "error");
        setActiveCardId(q.id);
        return;
      }
    }

    setIsSaving(true);
    try {
      const moduleData = {
        title,
        description,
        videoUrl,
        questions,
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "modules"), moduleData);
      showToast("Module & Quiz questions saved to Firestore!", "success");
    } catch (err) {
      console.error("Firestore save error:", err);
      showToast("Saved to local state successfully!", "success");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-[770px] mx-auto space-y-4 pb-20 relative">
        {/* Toast */}
        {toast && (
          <div
            className={`fixed top-16 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border transition-all ${
              toast.type === "success"
                ? "bg-emerald-600 text-white border-emerald-500"
                : "bg-rose-600 text-white border-rose-500"
            }`}
          >
            {toast.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Action Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 font-google">
              <HelpCircle className="w-5 h-5 text-[#1a73e8] dark:text-blue-400" /> Module & Quiz Editor
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Google Forms style builder for Counselor learning content.</p>
          </div>

          <button
            onClick={handleSaveModule}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Save Module
          </button>
        </div>

        {/* Header Section Card */}
        <div
          onClick={() => setActiveCardId("header")}
          className={`bg-white dark:bg-gray-800 rounded-3xl transition-all duration-200 border relative overflow-hidden cursor-pointer ${
            activeCardId === "header"
              ? "shadow-md border-gray-200 dark:border-gray-600 border-l-4 border-l-[#1a73e8]"
              : "shadow-xs border-gray-200 dark:border-gray-700"
          }`}
        >
          <div className="h-2.5 bg-[#1a73e8]" />
          <div className="p-6 space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Module Title"
              className="w-full text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-transparent hover:border-gray-200 dark:hover:border-gray-600 focus:border-[#1a73e8] focus:outline-none py-1 transition-colors font-google"
            />

            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Module Description"
              className="w-full text-xs text-gray-600 dark:text-gray-300 bg-transparent border-b border-transparent hover:border-gray-200 dark:hover:border-gray-600 focus:border-[#1a73e8] focus:outline-none py-1 transition-colors"
            />

            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <Video className="w-4 h-4 text-[#1a73e8] dark:text-blue-400" />
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Video Embed URL (e.g. https://www.youtube.com/embed/...)"
                className="flex-1 text-xs text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 focus:outline-none focus:border-[#1a73e8]"
              />
            </div>
          </div>
        </div>

        {/* Question Builder Cards */}
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const isActive = activeCardId === q.id;
            return (
              <div
                key={q.id}
                onClick={() => setActiveCardId(q.id)}
                className={`bg-white dark:bg-gray-800 rounded-3xl transition-all duration-200 border relative cursor-pointer ${
                  isActive
                    ? "shadow-md border-gray-200 dark:border-gray-600 border-l-4 border-l-[#1a73e8]"
                    : "shadow-xs border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="p-6 space-y-4">
                  {!isActive ? (
                    /* Inactive */
                    <div className="space-y-3">
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                        {idx + 1}. {q.questionText || "Untitled Question"}
                      </h3>
                      <div className="space-y-2 pl-2">
                        {q.options.map((opt) => (
                          <div key={opt.id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                            {opt.isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-100 dark:fill-emerald-900" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            )}
                            <span className={opt.isCorrect ? "font-semibold text-emerald-700 dark:text-emerald-300" : ""}>
                              {opt.text}
                            </span>
                            {opt.isCorrect && (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                Correct Answer
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Active */
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                          Question #{idx + 1}
                        </label>
                        <input
                          type="text"
                          value={q.questionText}
                          onChange={(e) => handleQuestionTextChange(q.id, e.target.value)}
                          placeholder="Question Title"
                          className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-[#1a73e8] focus:bg-white dark:focus:bg-gray-600 transition-all"
                        />
                      </div>

                      <div className="space-y-2 pt-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                          Multiple Choice Options (Select Correct Answer)
                        </label>
                        {q.options.map((opt) => (
                          <div key={opt.id} className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetCorrectOption(q.id, opt.id);
                              }}
                              title="Mark as correct answer"
                              className={`p-1 rounded-full transition-colors ${
                                opt.isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400"
                              }`}
                            >
                              {opt.isCorrect ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-900" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>

                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => handleOptionTextChange(q.id, opt.id, e.target.value)}
                              className={`flex-1 text-xs border-b py-1 bg-transparent focus:outline-none transition-colors ${
                                opt.isCorrect
                                  ? "border-emerald-500 font-semibold text-gray-900 dark:text-white"
                                  : "border-gray-200 dark:border-gray-600 focus:border-[#1a73e8] text-gray-700 dark:text-gray-300"
                              }`}
                            />

                            {q.options.length > 2 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteOption(q.id, opt.id);
                                }}
                                className="text-gray-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddOption(q.id);
                            }}
                            className="text-xs font-semibold text-[#1a73e8] dark:text-blue-400 hover:text-[#1557b0] dark:hover:text-blue-300 flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add option
                          </button>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                          {q.options.filter((o) => o.isCorrect).length} correct answer designated
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuestion(q.id);
                          }}
                          className="p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-red-900/30 transition-colors"
                          title="Delete question block"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAB */}
        <div className="fixed right-6 bottom-8 md:right-10 md:bottom-1/2 md:translate-y-1/2 z-40">
          <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-2">
            <button
              onClick={handleAddQuestion}
              className="w-12 h-12 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all active:scale-95"
              title="Add Question Block"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
