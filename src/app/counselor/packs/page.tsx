"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  Search,
  Edit3,
  Copy,
  Trash2,
  Check,
  AlertCircle,
  HelpCircle,
  Video,
  Award,
  Sparkles,
  Layers,
} from "lucide-react";
import { collection, getDocs, doc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { QuestionPack } from "@/types";

export default function QuestionPacksDashboardPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (role !== "Admin" && role !== "Counselor" && role !== "Super Admin") {
        router.push("/dashboard");
      }
    }
  }, [user, role, loading, router]);

  const [packs, setPacks] = useState<QuestionPack[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchPacks = async () => {
    setDataLoading(true);
    try {
      const snap = await getDocs(collection(db, "question_packs"));
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuestionPack));
        setPacks(list);
      } else {
        setPacks([]);
      }
    } catch (err) {
      console.warn("Packs fetch error:", err);
      setPacks([]);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchPacks();
  }, []);

  const handleDuplicatePack = async (pack: QuestionPack) => {
    try {
      const duplicateData = {
        title: `${pack.title} (Copy)`,
        description: pack.description || "",
        category: pack.category || "General Compliance",
        videoUrl: pack.videoUrl || "",
        passScore: pack.passScore || 80,
        isDefault: false,
        questions: pack.questions || [],
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await addDoc(collection(db, "question_packs"), duplicateData);
      showToast("Question pack duplicated successfully!", "success");
      fetchPacks();
    } catch (err) {
      console.error("Duplicate error:", err);
      showToast("Failed to duplicate question pack.", "error");
    }
  };

  const handleDeletePack = async (packId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await deleteDoc(doc(db, "question_packs", packId));
      showToast("Question pack deleted.", "success");
      setPacks((prev) => prev.filter((p) => p.id !== packId));
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete question pack.", "error");
    }
  };

  const categories = ["All", "UKVI Core Curriculum", "General Compliance", "Financial", "Academic", "University Specific"];

  const filteredPacks = packs.filter((p) => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <AppShell>
      <div className="space-y-6">
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

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 font-google">
              <FolderKanban className="w-6 h-6 text-[#1a73e8] dark:text-blue-400" /> Question Packs Library
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Create, organize, and manage compliance question packs for student assignment.
            </p>
          </div>

          <Link
            href="/counselor/packs/editor?id=new"
            className="px-5 py-2.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 active:scale-95 w-fit"
          >
            <Plus className="w-4 h-4" /> Create New Pack
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${
                    isSelected
                      ? "bg-blue-100 dark:bg-blue-900/40 text-[#1a73e8] dark:text-blue-300 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search packs..."
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full pl-9 pr-4 py-1.5 text-xs text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Packs Grid */}
        {dataLoading ? (
          <div className="flex items-center justify-center p-12 text-gray-500 dark:text-gray-400 font-semibold">
            <Sparkles className="w-5 h-5 animate-spin text-[#1a73e8] dark:text-blue-400" /> Loading question packs...
          </div>
        ) : filteredPacks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 border border-gray-200 dark:border-gray-700 text-center space-y-3">
            <Layers className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-google">No Question Packs Found</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {searchTerm || selectedCategory !== "All"
                ? "No question packs match your search or category filter."
                : "Create your first Question Pack using the '+ Create New Pack' button above."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPacks.map((pack) => (
              <div
                key={pack.id}
                className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200/80 dark:border-gray-700 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {pack.category || "General Compliance"}
                    </span>
                    {pack.isDefault && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Default Pack
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug">{pack.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{pack.description || "Compliance drill pack."}</p>

                  <div className="flex items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-300 pt-1">
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-[#1a73e8] dark:text-blue-400" />
                      {pack.questions ? pack.questions.length : 0} Questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      {pack.passScore || 80}% Pass Mark
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                  <Link
                    href={`/counselor/packs/editor?id=${pack.id}`}
                    className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </Link>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicatePack(pack)}
                      className="p-2 rounded-xl text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Duplicate Pack"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePack(pack.id, pack.title)}
                      className="p-2 rounded-xl text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-red-900/30 transition-colors"
                      title="Delete Pack"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
