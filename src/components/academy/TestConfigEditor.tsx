"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  where,
  deleteDoc
} from "firebase/firestore";
import { TestQuestionSet, TestQuestion, QuizOption } from "@/types/academy";
import { UserProfile } from "@/types";
import {
  Loader2,
  Plus,
  Archive,
  Save,
  Clock,
  Shuffle,
  Star,
  GripVertical,
  UserCheck,
  LayoutGrid,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  ShieldCheck
} from "lucide-react";

export default function TestConfigEditor() {
  const [sets, setSets] = useState<TestQuestionSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>("");
  const [editingSet, setEditingSet] = useState<TestQuestionSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Student Assignment State
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedStudentUid, setSelectedStudentUid] = useState<string>("");
  const [assignedSetForStudent, setAssignedSetForStudent] = useState<string>("");
  const [savingStudentAssign, setSavingStudentAssign] = useState(false);

  useEffect(() => {
    fetchSets();
    fetchStudents();
  }, []);

  const fetchSets = async () => {
    try {
      const q = query(collection(db, "test_question_sets"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as TestQuestionSet));
      setSets(list);

      if (list.length > 0 && !selectedSetId) {
        const defaultSet = list.find(s => s.isDefault && !s.isArchived) || list.find(s => !s.isArchived) || list[0];
        handleSelectSet(defaultSet.id, list);
      }
    } catch (e) {
      console.error("Error fetching test sets:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const q = query(collection(db, "Users"), where("role", "==", "Student"));
      const snap = await getDocs(q);
      setStudents(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectSet = (id: string, currentSets: TestQuestionSet[] = sets) => {
    setSelectedSetId(id);
    const found = currentSets.find(s => s.id === id);
    setEditingSet(found ? { ...found } : null);
  };

  const createNewSet = () => {
    const newSet: TestQuestionSet = {
      id: `test_set_${Date.now()}`,
      title: "New Learning Test",
      timePerQuestionSeconds: 30,
      isRandomized: false,
      questions: [
        {
          id: `q_${Date.now()}`,
          prompt: "New Question Prompt?",
          options: [
            { id: 'opt_1', text: "Option A" },
            { id: 'opt_2', text: "Option B" },
            { id: 'opt_3', text: "Option C" },
            { id: 'opt_4', text: "Option D" },
          ],
          correctOptionId: 'opt_1'
        }
      ],
      isDefault: sets.filter(s => !s.isArchived).length === 0,
      isArchived: false,
      category: 'supplemental',
      createdAt: new Date()
    };
    setEditingSet(newSet);
    setSelectedSetId(newSet.id);
  };

  const handleSave = async () => {
    if (!editingSet) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "test_question_sets", editingSet.id), {
        ...editingSet,
        createdAt: editingSet.createdAt || serverTimestamp()
      }, { merge: true });
      alert("Test set saved!");
      fetchSets();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const setAsDefault = async () => {
    if (!editingSet) return;
    setSaving(true);
    try {
      const batch = writeBatch(db);
      sets.forEach(s => {
        if (s.isDefault) batch.update(doc(db, "test_question_sets", s.id), { isDefault: false });
      });
      batch.update(doc(db, "test_question_sets", editingSet.id), { isDefault: true, isArchived: false });
      await batch.commit();
      setEditingSet({ ...editingSet, isDefault: true, isArchived: false });
      fetchSets();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const archiveSet = async () => {
    if (!editingSet) return;
    if (!confirm(`Archive "${editingSet.title}"?`)) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "test_question_sets", editingSet.id), { isArchived: true, isDefault: false });
      setEditingSet(null);
      setSelectedSetId("");
      fetchSets();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    if (!editingSet) return;
    const newQ: TestQuestion = {
      id: `q_${Date.now()}`,
      prompt: "New Question?",
      options: [
        { id: 'opt_1', text: "Option A" },
        { id: 'opt_2', text: "Option B" },
        { id: 'opt_3', text: "Option C" },
        { id: 'opt_4', text: "Option D" },
      ],
      correctOptionId: 'opt_1'
    };
    setEditingSet({ ...editingSet, questions: [...editingSet.questions, newQ] });
  };

  const removeQuestion = (idx: number) => {
    if (!editingSet) return;
    const q = [...editingSet.questions];
    q.splice(idx, 1);
    setEditingSet({ ...editingSet, questions: q });
  };

  const updateQuestion = (idx: number, updates: Partial<TestQuestion>) => {
    if (!editingSet) return;
    const q = [...editingSet.questions];
    q[idx] = { ...q[idx], ...updates };
    setEditingSet({ ...editingSet, questions: q });
  };

  const updateOption = (qIdx: number, oIdx: number, text: string) => {
    if (!editingSet) return;
    const questions = [...editingSet.questions];
    const options = [...questions[qIdx].options];
    options[oIdx] = { ...options[oIdx], text };
    questions[qIdx] = { ...questions[qIdx], options };
    setEditingSet({ ...editingSet, questions });
  };

  const handleSelectStudentForAssignment = (uid: string) => {
    setSelectedStudentUid(uid);
    const targetStudent = students.find(s => s.uid === uid);
    setAssignedSetForStudent(targetStudent?.assignedTestSetId || "");
  };

  const handleSaveStudentAssignment = async () => {
    if (!selectedStudentUid) return;
    setSavingStudentAssign(true);
    try {
      await updateDoc(doc(db, "Users", selectedStudentUid), {
        assignedTestSetId: assignedSetForStudent || null
      });
      setStudents(prev => prev.map(s => (s.uid === selectedStudentUid ? { ...s, assignedTestSetId: assignedSetForStudent || null } : s)));
      alert("Student test assignment updated!");
    } catch (e) {
      console.error(e);
    } finally {
      setSavingStudentAssign(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" /></div>;

  const activeSets = sets.filter(s => !s.isArchived);
  const archivedSets = sets.filter(s => s.isArchived);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Set Selector */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1 space-y-1">
          <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">Learning Test Manager</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Select or create a curriculum for learning tests</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedSetId}
            onChange={(e) => handleSelectSet(e.target.value)}
            className="bg-gray-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 min-w-[280px]"
          >
            <option value="">-- Choose a Test Set --</option>
            {activeSets.map(s => <option key={s.id} value={s.id}>{s.isDefault ? '⭐ ' : ''}{s.title}</option>)}
            {archivedSets.length > 0 && <optgroup label="Archived">{archivedSets.map(s => <option key={s.id} value={s.id}>📦 {s.title}</option>)}</optgroup>}
          </select>
          <button onClick={createNewSet} className="px-6 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-md active:scale-95">
            <Plus size={18} /> Create New
          </button>
        </div>
      </div>

      {editingSet && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6 bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-black uppercase tracking-widest text-blue-500">Test Configuration</h3>
                {editingSet.isDefault ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-[10px] font-black uppercase rounded-full border border-amber-200">
                    <Star size={12} fill="currentColor" /> Global Default
                  </span>
                ) : !editingSet.isArchived && editingSet.category !== 'core' && (
                  <button onClick={setAsDefault} className="text-[10px] font-black uppercase text-gray-400 hover:text-amber-500 underline">Set as Global Default</button>
                )}
              </div>

              {editingSet.category === 'core' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl text-blue-600 text-[10px] font-bold uppercase tracking-widest">
                  <ShieldCheck size={14} /> Core modules cannot be deleted to ensure platform stability.
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Test Title</label>
                  <input value={editingSet.title} onChange={e => setEditingSet({ ...editingSet, title: e.target.value })} className="w-full bg-gray-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Category Taxonomy</label>
                    <select
                      value={editingSet.category}
                      onChange={e => setEditingSet({ ...editingSet, category: e.target.value as 'core' | 'supplemental' })}
                      className="w-full bg-gray-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="core">Core Learning Track</option>
                      <option value="supplemental">Supplemental Pack</option>
                    </select>
                  </div>
                  {editingSet.category === 'core' && (
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Track Order Index</label>
                      <input
                        type="number"
                        value={editingSet.orderIndex || 0}
                        onChange={e => setEditingSet({ ...editingSet, orderIndex: parseInt(e.target.value) || 0 })}
                        className="w-full bg-gray-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Time Per Question (Sec)</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input type="number" value={editingSet.timePerQuestionSeconds} onChange={e => setEditingSet({ ...editingSet, timePerQuestionSeconds: parseInt(e.target.value) || 30 })} className="w-full bg-gray-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Initial Randomization</label>
                    <button onClick={() => setEditingSet({ ...editingSet, isRandomized: !editingSet.isRandomized })} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all ${editingSet.isRandomized ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                      <Shuffle size={16} className="inline mr-2" /> {editingSet.isRandomized ? 'Shuffle On' : 'Fixed Order'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-600 rounded-[40px] p-8 text-white flex flex-col justify-between shadow-xl">
               <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center"><Save /></div>
                  <div className="space-y-1">
                    <h4 className="text-2xl font-black uppercase tracking-tighter">Save Changes</h4>
                    <p className="text-xs text-indigo-100 font-bold leading-relaxed">Updating this set will affect all future student test sessions.</p>
                  </div>
               </div>
               <div className="space-y-3 pt-8">
                 <button onClick={handleSave} disabled={saving} className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">
                   {saving ? <Loader2 className="animate-spin" /> : <Save size={18} className="inline mr-2" />} Save Test Set
                 </button>
                 {!editingSet.isDefault && editingSet.category !== 'core' && (
                   <button onClick={archiveSet} className="w-full py-4 bg-indigo-500/30 border border-indigo-400/50 text-white rounded-2xl font-black text-xs uppercase tracking-widest">
                     <Archive size={18} className="inline mr-2" /> Archive Set
                   </button>
                 )}
               </div>
            </div>
          </div>

          {/* MCQ Bank */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-widest text-blue-500">MCQ Bank ({editingSet.questions.length})</h3>
              <button onClick={addQuestion} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase">+ Add MCQ</button>
            </div>

            <div className="space-y-12">
              {editingSet.questions.map((q, qIdx) => (
                <div key={q.id} className="space-y-6 relative border-l-4 border-gray-100 dark:border-slate-800 pl-8 ml-4">
                  <button onClick={() => removeQuestion(qIdx)} className="absolute -left-12 top-0 p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={20} /></button>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400">Question Prompt #{qIdx + 1}</label>
                    <input value={q.prompt} onChange={e => updateQuestion(qIdx, { prompt: e.target.value })} className="w-full bg-gray-50 dark:bg-slate-900 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt, oIdx) => (
                      <div key={opt.id} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${q.correctOptionId === opt.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900'}`}>
                        <button onClick={() => updateQuestion(qIdx, { correctOptionId: opt.id })} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${q.correctOptionId === opt.id ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'}`}>
                          {q.correctOptionId === opt.id && <CheckCircle2 size={14} />}
                        </button>
                        <input value={opt.text} onChange={e => updateOption(qIdx, oIdx, e.target.value)} className="flex-1 bg-transparent border-none text-xs font-bold focus:ring-0 dark:text-slate-200" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Assignment */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 space-y-6">
            <h3 className="text-lg font-black dark:text-white uppercase tracking-tighter flex items-center gap-2"><Users className="text-indigo-500" /> Student Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Select Student</label>
                <select value={selectedStudentUid} onChange={e => handleSelectStudentForAssignment(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Choose Student --</option>
                  {students.map(s => <option key={s.uid} value={s.uid}>{s.displayName || s.email}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Assign Test Set</label>
                <select value={assignedSetForStudent} onChange={e => setAssignedSetForStudent(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500">
                  <option value="">Global Default</option>
                  {activeSets.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
              <button onClick={handleSaveStudentAssignment} disabled={savingStudentAssign || !selectedStudentUid} className="py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">
                {savingStudentAssign ? <Loader2 className="animate-spin mx-auto" /> : 'Save Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
