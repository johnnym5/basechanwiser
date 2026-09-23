"use client";

import React, { useState } from "react";
import { PackField, PackFieldType } from "@/types/pack";
import { ShieldCheck, Plus, Trash2, RotateCcw, X, Layers } from "lucide-react";

export interface StudentDossierEditorProps {
  fields: PackField[];
  answers?: Record<string, any>;
  formData?: Record<string, any>;
  canEdit?: boolean;
  onAnswerChange?: (fieldId: string, value: any) => void;
  onChange?: (updates: Record<string, any>) => void;
  onAddField?: (field: PackField) => void;
  onDeleteField?: (fieldId: string) => void;
  onResetToDefault?: () => void;
}

export default function StudentDossierEditor({
  fields,
  answers,
  formData,
  canEdit = true,
  onAnswerChange,
  onChange,
  onAddField,
  onDeleteField,
  onResetToDefault,
}: StudentDossierEditorProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // New field state
  const [newLabel, setNewLabel] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("Academic & Admission Justification");
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [newType, setNewType] = useState<PackFieldType>("short_text");
  const [newOptions, setNewOptions] = useState("");

  const currentAnswers = answers || formData || {};

  const categories = Array.from(
    new Set(fields.map((f) => f.category?.trim() || "General"))
  );

  const handleFieldValueChange = (fieldId: string, val: any) => {
    if (onAnswerChange) {
      onAnswerChange(fieldId, val);
    }
    if (onChange) {
      onChange({ [fieldId]: val });
    }
  };

  const handleCreateField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !onAddField) return;

    const selectedCategory =
      newCategory === "__CUSTOM__" ? customCategoryInput.trim() : newCategory;

    const field: PackField = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      label: newLabel.trim(),
      description: newDescription.trim() || undefined,
      category: selectedCategory || "Custom Questions",
      type: newType,
      options:
        newType === "select"
          ? newOptions.split(",").map((o) => o.trim()).filter(Boolean)
          : undefined,
      required: false,
      isCustom: true,
    };

    onAddField(field);

    // Reset Form
    setNewLabel("");
    setNewDescription("");
    setCustomCategoryInput("");
    setNewOptions("");
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300 pb-10">
      {/* Top Management Bar */}
      {canEdit && (onAddField || onResetToDefault) && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-slate-900/50 dark:bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-white">
                Pack Configuration
              </h3>
              <p className="text-[10px] font-bold text-slate-400">
                Customize question set or reset to default template
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onResetToDefault && (
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="px-4 py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
              >
                <RotateCcw size={14} /> Reset to Default
              </button>
            )}

            {onAddField && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
              >
                <Plus size={14} /> Add Question
              </button>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Grouped Field Sections */}
      {categories.map((catName) => {
        const catFields = fields.filter(
          (f) => (f.category?.trim() || "General") === catName
        );

        return (
          <div
            key={catName}
            className="space-y-6 pt-6 border-t border-gray-100 dark:border-slate-800 first:border-0 first:pt-0"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black uppercase text-blue-500 tracking-[0.2em] border-l-4 border-blue-500 pl-4">
                {catName}
              </p>
              <span className="text-[9px] font-bold uppercase text-slate-500 tracking-widest bg-slate-800 px-3 py-1 rounded-full">
                {catFields.length} {catFields.length === 1 ? "field" : "fields"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {catFields.map((field) => {
                const isLongText = field.type === "long_text";
                const fieldValue = currentAnswers[field.id] ?? "";

                return (
                  <div
                    key={field.id}
                    className={`relative group bg-gray-50/50 dark:bg-slate-900/40 p-5 rounded-2xl border border-gray-100 dark:border-slate-800/80 transition-all hover:border-slate-700 ${
                      isLongText ? "md:col-span-2" : ""
                    }`}
                  >
                    {/* Delete Question Button */}
                    {canEdit && onDeleteField && (
                      <button
                        type="button"
                        onClick={() => onDeleteField(field.id)}
                        className="absolute top-4 right-4 text-slate-500 hover:text-rose-500 p-1.5 rounded-lg transition-colors hover:bg-rose-500/10"
                        title="Delete Question"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}

                    <div className="space-y-2 pr-8">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {field.label}
                        </label>
                        {field.required && (
                          <span className="text-rose-500 font-bold text-xs">*</span>
                        )}
                        {field.isCustom && (
                          <span className="text-[8px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            Custom
                          </span>
                        )}
                      </div>

                      {field.description && (
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 italic">
                          {field.description}
                        </p>
                      )}

                      {/* Render Input based on type */}
                      {field.type === "long_text" ? (
                        <textarea
                          name={field.id}
                          value={fieldValue}
                          onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                          rows={4}
                          placeholder={field.description || `Enter ${field.label.toLowerCase()}...`}
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 text-sm font-medium leading-relaxed text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner resize-none mt-2"
                        />
                      ) : field.type === "select" ? (
                        <select
                          name={field.id}
                          value={fieldValue}
                          onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner mt-2"
                        >
                          <option value="">Select option...</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type === "number" ? "number" : "text"}
                          name={field.id}
                          value={fieldValue}
                          onChange={(e) =>
                            handleFieldValueChange(
                              field.id,
                              field.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value
                            )
                          }
                          placeholder={field.description || `Enter ${field.label.toLowerCase()}...`}
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner mt-2"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Counselor Verification Toggle */}
      <div className="pt-6">
        <div className="flex items-center justify-between p-8 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-[32px]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <ShieldCheck size={20} />
              <p className="text-sm font-black uppercase tracking-widest">
                Counselor Audit
              </p>
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-tight">
              Final verification of physical document consistency
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleFieldValueChange("docsVerified", !currentAnswers.docsVerified)}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              currentAnswers.docsVerified
                ? "bg-emerald-600 text-white shadow-xl shadow-emerald-500/20"
                : "bg-white dark:bg-slate-800 text-gray-400 border border-gray-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-500"
            }`}
          >
            {currentAnswers.docsVerified ? "VERIFIED ✓" : "MARK AS VERIFIED"}
          </button>
        </div>
      </div>

      {/* Add Question Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-8 space-y-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-xl"
            >
              <X size={20} />
            </button>

            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-white">
                Add Custom Question
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Add a student-specific question to this pack
              </p>
            </div>

            <form onSubmit={handleCreateField} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Question Prompt *
                </label>
                <input
                  type="text"
                  required
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Portfolio Project Details"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Helper Description / Hint
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. Explain key technologies used..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Group / Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ New Group...</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Input Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as PackFieldType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="short_text">Short Text</option>
                    <option value="long_text">Long Text</option>
                    <option value="number">Number</option>
                    <option value="select">Dropdown Select</option>
                    <option value="file">File Upload</option>
                  </select>
                </div>
              </div>

              {newCategory === "__CUSTOM__" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Custom Group Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    placeholder="e.g. Visa & Immigration Documents"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              {newType === "select" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Dropdown Options (comma-separated) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOptions}
                    onChange={(e) => setNewOptions(e.target.value)}
                    placeholder="Option 1, Option 2, Option 3"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-3 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-500"
                >
                  Add Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 space-y-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
              <RotateCcw size={28} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tight text-white">
                Reset to Default Pack?
              </h3>
              <p className="text-xs font-medium text-slate-400 leading-relaxed">
                This will remove all custom questions added for this student and restore the global template set. Existing answer data will be preserved.
              </p>
            </div>

            <div className="flex justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-6 py-3 rounded-2xl border border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsResetConfirmOpen(false);
                  if (onResetToDefault) onResetToDefault();
                }}
                className="px-6 py-3 rounded-2xl bg-rose-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-500"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
