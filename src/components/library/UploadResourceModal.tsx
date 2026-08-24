'use client';

import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { formatDriveEmbedUrl } from '@/lib/utils/drive-helpers';
import { Link2, ShieldCheck, FolderLock, X, Loader2, Save } from 'lucide-react';
import { QuestionPack } from '@/types';

interface UploadResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId: string | null;
  initialData?: any;
  onSuccess: () => void;
}

export default function UploadResourceModal({ isOpen, onClose, editId, initialData, onSuccess }: UploadResourceModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileType, setFileType] = useState('pdf');
  const [rawDriveUrl, setRawDriveUrl] = useState('');
  const [linkedPackId, setLinkedPackId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packs, setPacks] = useState<QuestionPack[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchPacks();
      if (editId && initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setFileType(initialData.fileType || 'pdf');
        setRawDriveUrl(initialData.fileUrl || '');
        setLinkedPackId(initialData.linkedPackId || '');
      } else {
        setTitle('');
        setDescription('');
        setFileType('pdf');
        setRawDriveUrl('');
        setLinkedPackId('');
      }
    }
  }, [isOpen, editId, initialData]);

  const fetchPacks = async () => {
    try {
      const snap = await getDocs(collection(db, "question_packs"));
      setPacks(snap.docs.map(d => ({ id: d.id, ...d.data() } as QuestionPack)));
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !rawDriveUrl) {
      alert('Please provide a title and a valid Drive URL / direct link.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Transform raw Google Drive URL into an embed preview link
      const embeddableUrl = formatDriveEmbedUrl(rawDriveUrl);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        fileType,
        fileUrl: embeddableUrl,
        linkedPackId: linkedPackId || null,
        updatedAt: serverTimestamp(),
      };

      // 2. Write ONLY to Firestore (Zero Firebase Storage bandwidth used)
      if (editId) {
        await updateDoc(doc(db, 'library_resources', editId), payload);
      } else {
        await addDoc(collection(db, 'library_resources'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving resource metadata:', error);
      alert('Failed to save resource. Check network/permissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[40px] p-8 shadow-2xl space-y-6">

        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3 text-white">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <FolderLock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter">{editId ? "Update Resource" : "Link Drive Resource"}</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Central Repository Uplink</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Resource Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. UKVI Financial Credibility Guide"
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Short Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary for students..."
              className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-3xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none transition-all leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">File Type</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl px-4 py-3.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="pdf">PDF Document</option>
                <option value="video">Video (MP4 / Drive)</option>
                <option value="audio">Audio Briefing</option>
                <option value="doc">Word / Direct Link</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Link Assessment Pack</label>
              <select
                required
                value={linkedPackId}
                onChange={e => setLinkedPackId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl px-4 py-3.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                  <option value="">Select a Quiz Pack</option>
                  {packs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Direct Google Drive URL / File Link *</label>
            <div className="relative">
              <Link2 className="w-5 h-5 text-slate-500 absolute left-4 top-4" />
              <input
                type="url"
                value={rawDriveUrl}
                onChange={(e) => setRawDriveUrl(e.target.value)}
                placeholder="Paste Drive Share Link..."
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                required
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-3 flex items-start gap-2 ml-1 leading-relaxed">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Direct Google Drive links automatically convert to secure embedded previews.</span>
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[28px] text-xs uppercase tracking-[0.2em] transition-all shadow-2xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <><Loader2 className="animate-spin" size={18} /> Saving to Vault...</>
              ) : (
                <><Save size={18} /> {editId ? "Update Resource" : "Publish to Library"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
