"use client";

import React from "react";
import { LayoutGrid, Plus, Trash2 } from "lucide-react";

interface RubricsPanelProps {
  config: any;
  onChange: (field: string, value: any) => void;
}

export default function RubricsPanel({ config, onChange }: RubricsPanelProps) {
  const rubric = config.globalRubric || [];

  const addItem = () => {
    const newItem = { id: Date.now().toString(), label: "New Criteria", maxScore: 10 };
    onChange("globalRubric", [...rubric, newItem]);
  };

  const updateItem = (id: string, label: string, maxScore: number) => {
    const updated = rubric.map((r: any) => (r.id === id ? { ...r, label, maxScore } : r));
    onChange("globalRubric", updated);
  };

  const deleteItem = (id: string) => {
    const updated = rubric.filter((r: any) => r.id !== id);
    onChange("globalRubric", updated);
  };

  return (
    <div className="space-y-10 animate-in fade-in">
      <div className="border-b border-slate-800 pb-6">
        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Evaluation & Rubrics</h3>
        <p className="text-sm text-slate-400 font-medium">Define standard criteria for Counselor evaluations and mock scoring.</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          {rubric.map((r: any) => (
            <div key={r.id} className="flex items-center gap-6 bg-slate-900/50 p-6 rounded-[32px] border border-slate-800 shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <LayoutGrid className="text-emerald-500" size={20} />
              </div>
              <input
                type="text"
                value={r.label}
                onChange={(e) => updateItem(r.id, e.target.value, r.maxScore)}
                className="flex-1 bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500"
                placeholder="Criteria Label"
              />
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Max Score</span>
                <input
                  type="number"
                  value={r.maxScore}
                  onChange={(e) => updateItem(r.id, r.label, parseInt(e.target.value) || 0)}
                  className="w-20 bg-slate-800 border-none rounded-2xl px-2 py-3 text-sm font-black text-indigo-400 text-center focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button onClick={() => deleteItem(r.id)} className="p-3 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all">
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        <button onClick={addItem} className="group flex items-center gap-3 text-indigo-400 text-xs font-black uppercase tracking-widest hover:text-indigo-300 transition-all pt-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20">
            <Plus size={16} />
          </div>
          Add Evaluative Criteria
        </button>
      </div>
    </div>
  );
}
