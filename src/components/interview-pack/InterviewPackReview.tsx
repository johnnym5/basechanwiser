"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs } from "firebase/firestore";
import { PackField, StudentPackData, PackFile } from "@/types/pack";
import { Loader2, ShieldCheck, ExternalLink, Download, FileText, Plus, Save, Trash2, User } from "lucide-react";

export default function InterviewPackReview({ studentId }: { studentId: string }) {
  const [fields, setFields] = useState<PackField[]>([]);
  const [data, setData] = useState<StudentPackData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentInfo, setStudentInfo] = useState<any>(null);

  useEffect(() => {
    if (studentId) fetchData();
  }, [studentId]);

  const fetchData = async () => {
    // 1. Fetch student info
    const userSnap = await getDoc(doc(db, "Users", studentId));
    if (userSnap.exists()) setStudentInfo(userSnap.data());

    // 2. Fetch config (standard fields)
    const configSnap = await getDoc(doc(db, "interview_pack_configs", "default"));
    let standardFields: PackField[] = [];
    if (configSnap.exists()) {
      standardFields = configSnap.data().fields as PackField[];
    }

    // 3. Fetch student specific overrides/custom fields
    const customSnap = await getDoc(doc(db, "Users", studentId, "overrides", "interview_pack"));
    let customFields: PackField[] = [];
    if (customSnap.exists()) {
      customFields = customSnap.data().fields || [];
    }

    setFields([...standardFields, ...customFields]);

    // 4. Fetch student data
    const dataSnap = await getDoc(doc(db, "Users", studentId, "interview_pack", "data"));
    if (dataSnap.exists()) {
      setData(dataSnap.data() as StudentPackData);
    }
    setLoading(false);
  };

  const addCustomField = async () => {
    const label = prompt("Enter the label for the new field/document request:");
    if (!label) return;

    const type = confirm("Is this a File Upload request? (OK = File, Cancel = Text)") ? 'file' : 'short_text';

    const newField: PackField = {
      id: `custom_${Date.now()}`,
      label,
      type,
      required: true,
      category: "Counselor Requests"
    };

    const newFields = [...fields, newField];
    setFields(newFields);

    const customFields = newFields.filter(f => f.id.startsWith('custom_'));
    await setDoc(doc(db, "Users", studentId, "overrides", "interview_pack"), { fields: customFields }, { merge: true });
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  const categories = Array.from(new Set(fields.map(f => f.category)));

  return (
    <div className="space-y-12 pb-20">
      <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="p-8 border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-blue-500 shadow-sm border border-gray-100 dark:border-slate-700">
                <User size={24} />
             </div>
             <div className="space-y-0.5">
                <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">{studentInfo?.displayName || 'Student'}</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reviewing Completed Pack</p>
             </div>
          </div>
          <button
            onClick={addCustomField}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Request Custom Data
          </button>
        </div>

        <div className="p-8 md:p-10 space-y-12">
          {categories.map((cat) => (
            <div key={cat} className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500 border-b border-indigo-100 dark:border-indigo-900/30 pb-2">{cat}</h3>
              <div className="grid grid-cols-1 gap-6">
                {fields.filter(f => f.category === cat).map((field) => {
                  const val = data[field.id];
                  const isFile = field.type === 'file';

                  return (
                    <div key={field.id} className="bg-gray-50/50 dark:bg-slate-900/50 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{field.label}</p>
                        {isFile ? (
                          val ? (
                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                              <ShieldCheck size={16} /> Document Uploaded
                            </div>
                          ) : (
                            <div className="text-rose-500 font-bold text-sm italic">Pending Submission</div>
                          )
                        ) : (
                          <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                            {val && typeof val === 'string' ? val : <span className="italic text-gray-400">No data provided</span>}
                          </p>
                        )}
                      </div>

                      {isFile && val && (
                        <div className="flex items-center gap-3">
                           <a
                            href={(val as PackFile).fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 text-blue-600 hover:text-blue-700 transition-all flex items-center gap-2 text-xs font-bold"
                           >
                             <Download size={16} /> Download {(val as PackFile).fileName.split('.').pop()?.toUpperCase()}
                           </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
