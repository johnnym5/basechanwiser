"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { MockInterviewConfig, MockInterviewQuestion } from "@/types/mock";
import { Loader2, Plus, Trash2, Save, User } from "lucide-react";

export default function MockConfigEditor() {
  const [config, setConfig] = useState<MockInterviewConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentOverride, setStudentOverride] = useState<MockInterviewConfig | null>(null);

  useEffect(() => {
    fetchGlobalConfig();
    fetchStudents();
  }, []);

  const fetchGlobalConfig = async () => {
    const snap = await getDoc(doc(db, "mock_interview_configs", "default"));
    if (snap.exists()) {
      setConfig(snap.data() as MockInterviewConfig);
    }
    setLoading(false);
  };

  const fetchStudents = async () => {
    const snap = await getDocs(collection(db, "Users"));
    const list = snap.docs.map(d => ({ uid: d.id, ...d.data() })).filter((u: any) => u.role === 'Student');
    setStudents(list);
  };

  const fetchStudentOverride = async (uid: string) => {
    if (!uid) {
      setStudentOverride(null);
      return;
    }
    const snap = await getDoc(doc(db, "Users", uid, "overrides", "mock_interview"));
    if (snap.exists()) {
      setStudentOverride(snap.data() as MockInterviewConfig);
    } else {
      setStudentOverride(config);
    }
  };

  const handleSaveGlobal = async () => {
    if (!config) return;
    setSaving(true);
    await setDoc(doc(db, "mock_interview_configs", "default"), config);
    setSaving(false);
    alert("Global config saved!");
  };

  const handleSaveOverride = async () => {
    if (!selectedStudentId || !studentOverride) return;
    setSaving(true);
    await setDoc(doc(db, "Users", selectedStudentId, "overrides", "mock_interview"), studentOverride);
    setSaving(false);
    alert("Student override saved!");
  };

  const addQuestion = (target: 'global' | 'override') => {
    const newQ: MockInterviewQuestion = { id: Date.now().toString(), text: "New Question" };
    if (target === 'global' && config) {
      setConfig({ ...config, questions: [...config.questions, newQ] });
    } else if (target === 'override' && studentOverride) {
      setStudentOverride({ ...studentOverride, questions: [...studentOverride.questions, newQ] });
    }
  };

  const removeQuestion = (target: 'global' | 'override', id: string) => {
    if (target === 'global' && config) {
      setConfig({ ...config, questions: config.questions.filter(q => q.id !== id) });
    } else if (target === 'override' && studentOverride) {
      setStudentOverride({ ...studentOverride, questions: studentOverride.questions.filter(q => q.id !== id) });
    }
  };

  const updateQuestion = (target: 'global' | 'override', id: string, text: string) => {
    if (target === 'global' && config) {
      setConfig({ ...config, questions: config.questions.map(q => q.id === id ? { ...q, text } : q) });
    } else if (target === 'override' && studentOverride) {
      setStudentOverride({ ...studentOverride, questions: studentOverride.questions.map(q => q.id === id ? { ...q, text } : q) });
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-12 pb-20">
      {/* Global Config Section */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold dark:text-white">Global Mock Interview Config</h2>
          <button onClick={handleSaveGlobal} disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold">
            <Save size={16} /> Save Global
          </button>
        </div>

        {config && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-bold text-gray-500">Duration (Minutes):</label>
              <input
                type="number"
                value={config.durationMinutes}
                onChange={(e) => setConfig({ ...config, durationMinutes: parseInt(e.target.value) })}
                className="bg-gray-50 dark:bg-slate-900 border-none rounded-xl px-4 py-2 w-24 text-sm font-bold"
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-bold text-gray-500">Question Bank:</p>
              {config.questions.map((q) => (
                <div key={q.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) => updateQuestion('global', q.id, e.target.value)}
                    className="flex-1 bg-gray-50 dark:bg-slate-900 border-none rounded-xl px-4 py-2 text-sm"
                  />
                  <button onClick={() => removeQuestion('global', q.id)} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button onClick={() => addQuestion('global')} className="flex items-center gap-2 text-blue-500 text-sm font-bold hover:underline mt-2">
                <Plus size={16} /> Add Question
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Overrides Section */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
        <h2 className="text-xl font-bold dark:text-white mb-6">Student Specific Overrides</h2>

        <div className="flex items-center gap-4 mb-8">
          <User className="text-gray-400" />
          <select
            value={selectedStudentId}
            onChange={(e) => { setSelectedStudentId(e.target.value); fetchStudentOverride(e.target.value); }}
            className="flex-1 bg-gray-50 dark:bg-slate-900 border-none rounded-xl px-4 py-2 text-sm font-bold"
          >
            <option value="">Select a Student to customize...</option>
            {students.map(s => (
              <option key={s.uid} value={s.uid}>{s.displayName} ({s.email})</option>
            ))}
          </select>
        </div>

        {selectedStudentId && studentOverride && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-widest text-blue-500">Customizing for Student</h3>
              <button onClick={handleSaveOverride} disabled={saving} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20">
                <Save size={16} /> Save Override
              </button>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm font-bold text-gray-500">Duration (Minutes):</label>
              <input
                type="number"
                value={studentOverride.durationMinutes}
                onChange={(e) => setStudentOverride({ ...studentOverride, durationMinutes: parseInt(e.target.value) })}
                className="bg-gray-50 dark:bg-slate-900 border-none rounded-xl px-4 py-2 w-24 text-sm font-bold text-indigo-600"
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-bold text-gray-500">Questions for this Student:</p>
              {studentOverride.questions.map((q) => (
                <div key={q.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) => updateQuestion('override', q.id, e.target.value)}
                    className="flex-1 bg-gray-50 dark:bg-slate-900 border-none rounded-xl px-4 py-2 text-sm border-l-4 border-indigo-500"
                  />
                  <button onClick={() => removeQuestion('override', q.id)} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button onClick={() => addQuestion('override')} className="flex items-center gap-2 text-indigo-500 text-sm font-bold hover:underline mt-2">
                <Plus size={16} /> Add Custom Question
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
