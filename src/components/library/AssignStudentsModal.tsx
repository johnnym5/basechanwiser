'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { X, Search, CheckCircle2, User, Loader2, Save, Users } from 'lucide-react';
import { UserProfile } from '@/types';

interface AssignStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceIds: string[];
  onSuccess: () => void;
}

export default function AssignStudentsModal({ isOpen, onClose, resourceIds, onSuccess }: AssignStudentsModalProps) {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
      setSelectedStudentIds([]);
    }
  }, [isOpen]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "Users"));
      const list = snap.docs
        .map(d => ({ uid: d.id, ...d.data() } as UserProfile))
        .filter(u => u.role === 'Student');
      setStudents(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (uid: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleAssign = async () => {
    if (resourceIds.length === 0) return;
    setSaving(true);
    try {
      const batch = writeBatch(db);
      resourceIds.forEach(resId => {
        const ref = doc(db, 'library_resources', resId);
        batch.update(ref, {
          assignedStudentIds: selectedStudentIds,
          isPublic: selectedStudentIds.length === 0, // If none selected, maybe make it public or private?
          // Actually, let's keep isPublic separate.
          updatedAt: new Date()
        });
      });
      await batch.commit();
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to assign resources.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const filteredStudents = students.filter(s =>
    (s.displayName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-[40px] p-8 shadow-2xl space-y-6 flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between border-b border-slate-800 pb-6 shrink-0">
          <div className="flex items-center space-x-3 text-white">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter">Assign Resources</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Control Access for {resourceIds.length} Assets</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="relative shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search scholars by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl pl-12 pr-6 py-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-hide">
          {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : filteredStudents.length === 0 ? (
            <p className="text-center text-slate-500 text-xs py-10">No matching scholars found.</p>
          ) : filteredStudents.map(student => (
            <button
              key={student.uid}
              onClick={() => toggleStudent(student.uid)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                selectedStudentIds.includes(student.uid)
                  ? 'bg-blue-500/10 border-blue-500/50 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-blue-400">
                  {student.displayName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold truncate max-w-[200px]">{student.displayName}</p>
                  <p className="text-[10px] font-medium opacity-50 truncate max-w-[200px]">{student.email}</p>
                </div>
              </div>
              {selectedStudentIds.includes(student.uid) && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
            </button>
          ))}
        </div>

        <div className="pt-6 border-t border-slate-800 shrink-0">
          <button
            onClick={handleAssign}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[28px] text-xs uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Confirm Assignments
          </button>
        </div>
      </div>
    </div>
  );
}
