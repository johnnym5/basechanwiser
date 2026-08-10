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
  where
} from "firebase/firestore";
import { MockQuestionSet } from "@/types/mock";
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
  ShieldCheck
} from "lucide-react";

export default function MockConfigEditor() {
  const [sets, setSets] = useState<MockQuestionSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>("");
  const [editingSet, setEditingSet] = useState<MockQuestionSet | null>(null);
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
      const q = query(collection(db, "mock_interview_sets"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as MockQuestionSet));
      setSets(list);

      // Auto-select first active set or default set if none selected
      const activeSets = list.filter(s => !s.isArchived);
      if (activeSets.length > 0 && !selectedSetId) {
        const defaultSet = activeSets.find(s => s.isDefault) || activeSets[0];
        handleSelectSet(defaultSet.id, list);
      }
    } catch (e) {
      console.error("Error fetching question sets:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const q = query(collection(db, "Users"), where("role", "==", "Student"));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
      setStudents(list);
    } catch (e) {
      console.error("Error fetching students:", e);
    }
  };

  const handleSelectSet = (id: string, currentSets: MockQuestionSet[] = sets) => {
    setSelectedSetId(id);
    const found = currentSets.find(s => s.id === id);
    if (found) {
      setEditingSet({ ...found });
    } else {
      setEditingSet(null);
    }
  };

  const createNewSet = () => {
    const newSet: MockQuestionSet = {
      id: `set_${Date.now()}`,
      title: "New Question Set",
      timePerQuestionSeconds: 60,
      isRandomized: false,
      questions: ["Why do you want to study this course?", "Why this specific university?"],
      isDefault: sets.filter(s => !s.isArchived).length === 0,
      isArchived: false,
      createdAt: new Date()
    };
    setEditingSet(newSet);
    setSelectedSetId(newSet.id);
  };

  const handleSave = async () => {
    if (!editingSet) return;
    setSaving(true);
    try {
      const setRef = doc(db, "mock_interview_sets", editingSet.id);
      await setDoc(setRef, {
        ...editingSet,
        isArchived: editingSet.isArchived ?? false,
        createdAt: editingSet.createdAt || serverTimestamp()
      }, { merge: true });

      alert("Question set saved successfully!");
      fetchSets();
    } catch (e) {
      console.error("Error saving set:", e);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const setAsDefault = async () => {
    if (!editingSet) return;
    setSaving(true);
    try {
      const batch = writeBatch(db);

      // Remove current default flag from all other sets
      sets.forEach(s => {
        if (s.isDefault) {
          batch.update(doc(db, "mock_interview_sets", s.id), { isDefault: false });
        }
      });

      // Set new default
      batch.update(doc(db, "mock_interview_sets", editingSet.id), { isDefault: true, isArchived: false });

      await batch.commit();
      setEditingSet({ ...editingSet, isDefault: true, isArchived: false });
      fetchSets();
    } catch (e) {
      console.error("Error setting default set:", e);
    } finally {
      setSaving(false);
    }
  };

  // Soft Delete (Archive) Set
  const archiveSet = async () => {
    if (!editingSet) return;
    if (!confirm(`Are you sure you want to archive "${editingSet.title}"? It will be hidden from active student selections.`)) return;

    setSaving(true);
    try {
      const setRef = doc(db, "mock_interview_sets", editingSet.id);
      await updateDoc(setRef, { isArchived: true, isDefault: false });

      alert("Question set archived successfully.");
      setEditingSet(null);
      setSelectedSetId("");
      fetchSets();
    } catch (e) {
      console.error("Error archiving set:", e);
      alert("Failed to archive set.");
    } finally {
      setSaving(false);
    }
  };

  const unarchiveSet = async () => {
    if (!editingSet) return;
    setSaving(true);
    try {
      const setRef = doc(db, "mock_interview_sets", editingSet.id);
      await updateDoc(setRef, { isArchived: false });

      alert("Question set restored to active list.");
      setEditingSet({ ...editingSet, isArchived: false });
      fetchSets();
    } catch (e) {
      console.error("Error restoring set:", e);
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    if (!editingSet) return;
    const newQ: MockQuestion = {
      id: `q_${Date.now()}`,
      text: "New Question Text",
      timeLimit: editingSet.timePerQuestionSeconds || 60
    };
    setEditingSet({ ...editingSet, questions: [...editingSet.questions, newQ] });
  };

  const removeQuestion = (idx: number) => {
    if (!editingSet) return;
    const q = [...editingSet.questions];
    q.splice(idx, 1);
    setEditingSet({ ...editingSet, questions: q });
  };

  const updateQuestionText = (idx: number, text: string) => {
    if (!editingSet) return;
    const q = [...editingSet.questions];
    const currentQ = q[idx];
    if (typeof currentQ === 'string') {
      q[idx] = text;
    } else {
      q[idx] = { ...currentQ, text };
    }
    setEditingSet({ ...editingSet, questions: q });
  };

  const updateQuestionTime = (idx: number, time: number) => {
    if (!editingSet) return;
    const q = [...editingSet.questions];
    const currentQ = q[idx];
    if (typeof currentQ === 'string') {
      q[idx] = { id: `q_${idx}`, text: currentQ, timeLimit: time };
    } else {
      q[idx] = { ...currentQ, timeLimit: time };
    }
    setEditingSet({ ...editingSet, questions: q });
  };

  // Handle student selection change for override UI
  const handleSelectStudentForAssignment = (uid: string) => {
    setSelectedStudentUid(uid);
    const targetStudent = students.find(s => s.uid === uid);
    if (targetStudent) {
      setAssignedSetForStudent(targetStudent.assignedMockSetId || "");
    } else {
      setAssignedSetForStudent("");
    }
  };

  const handleSaveStudentAssignment = async () => {
    if (!selectedStudentUid) {
      alert("Please select a student first.");
      return;
    }
    setSavingStudentAssign(true);
    try {
      const userRef = doc(db, "Users", selectedStudentUid);
      await updateDoc(userRef, {
        assignedMockSetId: assignedSetForStudent || null
      });

      // Update local state list
      setStudents(prev =>
        prev.map(s => (s.uid === selectedStudentUid ? { ...s, assignedMockSetId: assignedSetForStudent || null } : s))
      );

      alert("Student question set assignment updated successfully!");
    } catch (e) {
      console.error("Error saving student set assignment:", e);
      alert("Failed to update student assignment.");
    } finally {
      setSavingStudentAssign(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" /></div>;

  const activeSets = sets.filter(s => !s.isArchived);
  const archivedSets = sets.filter(s => s.isArchived);

  return (
    <div className="space-y-12 pb-32">
      {/* Top Bar: Question Set Selector & Create Button */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1 space-y-1">
          <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-2">
            <LayoutGrid className="text-blue-500" size={24} /> Question Set Manager
          </h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Select or create a curriculum for mock interviews</p>
        </div>

        {/* Clean top-level dropdown + "+ Create New Set" button */}
        <div className="flex items-center gap-3">
          <select
            value={selectedSetId}
            onChange={(e) => handleSelectSet(e.target.value)}
            className="bg-gray-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 min-w-[280px]"
          >
            <option value="">-- Choose a Question Set --</option>
            {activeSets.length > 0 && (
              <optgroup label="Active Sets">
                {activeSets.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.isDefault ? '⭐ ' : ''}{s.title} ({s.questions.length} Qs)
                  </option>
                ))}
              </optgroup>
            )}
            {archivedSets.length > 0 && (
              <optgroup label="Archived Sets">
                {archivedSets.map(s => (
                  <option key={s.id} value={s.id}>
                    📦 {s.title} (Archived)
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <button
            onClick={createNewSet}
            className="px-6 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Plus size={18} /> + Create New Set
          </button>
        </div>
      </div>

      {/* Editable Set Properties */}
      {editingSet && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6 bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-black uppercase tracking-widest text-blue-500">Set Configuration</h3>
                  {editingSet.isArchived && (
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] font-black uppercase rounded-full">
                      Archived
                    </span>
                  )}
                </div>
                {editingSet.isDefault ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-[10px] font-black uppercase rounded-full border border-amber-200">
                    <Star size={12} fill="currentColor" /> Global Default
                  </span>
                ) : !editingSet.isArchived && editingSet.category !== 'core' ? (
                  <button onClick={setAsDefault} className="text-[10px] font-black uppercase text-gray-400 hover:text-amber-500 underline transition-all">
                    Set as Global Default
                  </button>
                ) : null}
              </div>

              {editingSet.category === 'core' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl text-blue-600 text-[10px] font-bold uppercase tracking-widest">
                  <ShieldCheck size={14} /> Core modules cannot be deleted to ensure platform stability.
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Set Title</label>
                  <input
                    value={editingSet.title}
                    onChange={e => setEditingSet({ ...editingSet, title: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Standard UKVI Core Questions"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Time Per Question (Sec)</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="number"
                        value={editingSet.timePerQuestionSeconds}
                        onChange={e => setEditingSet({ ...editingSet, timePerQuestionSeconds: parseInt(e.target.value) || 60 })}
                        className="w-full bg-gray-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Initial Randomization</label>
                    <button
                      type="button"
                      onClick={() => setEditingSet({ ...editingSet, isRandomized: !editingSet.isRandomized })}
                      className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-2 ${
                        editingSet.isRandomized
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300'
                          : 'bg-gray-50 border-gray-100 text-gray-400 dark:bg-slate-900 dark:border-slate-800'
                      }`}
                    >
                      <Shuffle size={16} /> {editingSet.isRandomized ? 'Shuffle On' : 'Fixed Order'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Commit & Soft-Delete (Archive) Controls */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[40px] p-8 text-white flex flex-col justify-between shadow-xl shadow-blue-500/20">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Save size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-2xl font-black uppercase tracking-tighter">Save Changes</h4>
                  <p className="text-xs text-blue-100 font-bold leading-relaxed">
                    Updates will apply to future mock interview sessions using this set.
                  </p>
                </div>
              </div>
              <div className="space-y-3 pt-8">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                >
                  {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                  Commit Set Changes
                </button>

                {editingSet.category !== 'core' && (
                  editingSet.isArchived ? (
                    <button
                      onClick={unarchiveSet}
                      disabled={saving}
                      className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-700 transition-all"
                    >
                      Unarchive Set
                    </button>
                  ) : (
                    <button
                      onClick={archiveSet}
                      disabled={saving}
                      className="w-full py-4 bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-white border border-rose-400/30 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                    >
                      <Archive size={18} /> Archive Set (Soft Delete)
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Question List Editor */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-widest text-blue-500">
                Curriculum Questions ({editingSet.questions.length})
              </h3>
              <button
                onClick={addQuestion}
                className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all"
              >
                + Add Question
              </button>
            </div>

            <div className="space-y-3">
              {editingSet.questions.map((q, idx) => {
                const questionText = typeof q === 'string' ? q : q.text;
                const questionTime = typeof q === 'string' ? editingSet.timePerQuestionSeconds : q.timeLimit;

                return (
                  <div key={idx} className="flex items-center gap-4 bg-gray-50 dark:bg-[#0F172A] p-4 rounded-2xl border border-gray-100 dark:border-slate-800 group">
                    <div className="p-2 text-gray-300 group-hover:text-blue-500 cursor-grab active:cursor-grabbing">
                      <GripVertical size={20} />
                    </div>
                    <span className="text-xs font-black text-gray-400 w-8">#{idx + 1}</span>
                    <input
                      value={questionText}
                      onChange={e => updateQuestionText(idx, e.target.value)}
                      className="flex-1 bg-transparent border-none text-sm font-bold dark:text-slate-200 focus:ring-0"
                      placeholder="Enter question text..."
                    />

                    <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                       <Clock size={12} className="text-gray-400" />
                       <input
                         type="number"
                         value={questionTime}
                         onChange={e => updateQuestionTime(idx, parseInt(e.target.value) || 60)}
                         className="w-12 bg-transparent border-none text-[10px] font-black text-blue-600 focus:ring-0 p-0 text-center"
                       />
                       <span className="text-[8px] font-bold text-gray-400 uppercase">Sec</span>
                    </div>

                    <button
                      onClick={() => removeQuestion(idx)}
                      className="p-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Student Specific Overrides Section */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-black dark:text-white uppercase tracking-tighter flex items-center gap-2">
            <Users className="text-indigo-500" size={22} /> Student Specific Overrides
          </h3>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
            Assign specialized Question Sets to individual students, overriding global default curriculum
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-2">
          {/* Select Student */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 block">Select Student</label>
            <select
              value={selectedStudentUid}
              onChange={e => handleSelectStudentForAssignment(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose a Student --</option>
              {students.map(s => (
                <option key={s.uid} value={s.uid}>
                  {s.displayName || s.email} {s.studentId ? `(${s.studentId})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Assign Specialized Question Set Dropdown */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 block">Assign Specialized Question Set</label>
            <select
              value={assignedSetForStudent}
              onChange={e => setAssignedSetForStudent(e.target.value)}
              disabled={!selectedStudentUid}
              className="w-full bg-gray-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <option value="">Use Global Default Set</option>
              {activeSets.map(s => (
                <option key={s.id} value={s.id}>
                  {s.isDefault ? '⭐ ' : ''}{s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Save Assignment Button */}
          <div>
            <button
              onClick={handleSaveStudentAssignment}
              disabled={!selectedStudentUid || savingStudentAssign}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 active:scale-95"
            >
              {savingStudentAssign ? <Loader2 className="animate-spin" size={16} /> : <UserCheck size={18} />}
              Save Assignment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
