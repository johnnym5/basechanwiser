'use client';

import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { Link2, ShieldCheck, FolderLock, X, Loader2, Save, UploadCloud, FileText } from 'lucide-react';
import { QuestionPack } from '@/types';
import { useAuth } from '@/lib/auth/auth-context';

interface UploadResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId: string | null;
  initialData?: any;
  onSuccess: () => void;
}

export default function UploadResourceModal({ isOpen, onClose, editId, initialData, onSuccess }: UploadResourceModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileType, setFileType] = useState('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [linkedPackId, setLinkedPackId] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [packs, setPacks] = useState<QuestionPack[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchPacks();
      if (editId && initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setFileType(initialData.fileType || 'pdf');
        setLinkedPackId(initialData.linkedPackId || '');
        setIsPublic(initialData.isPublic !== undefined ? initialData.isPublic : true);
      } else {
        setTitle('');
        setDescription('');
        setFileType('pdf');
        setLinkedPackId('');
        setIsPublic(true);
        setFile(null);
        setUploadProgress(0);
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
    if (!title) {
      alert('Please provide a title.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalFileUrl = initialData?.fileUrl || "";

      if (file) {
        // 1. Create a reference in the fresh Firebase Storage bucket
        const fileStorageRef = ref(storage, `library/${Date.now()}_${file.name}`);

        // 2. Upload file binary
        const uploadTask = uploadBytesResumable(fileStorageRef, file);

        finalFileUrl = await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => reject(error),
            async () => {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadUrl);
            }
          );
        });
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        fileType,
        fileUrl: finalFileUrl,
        linkedPackId: linkedPackId || null,
        isPublic: isPublic,
        updatedAt: serverTimestamp(),
        uploadedBy: user?.uid || 'anonymous'
      };

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
      console.error('Error saving resource:', error);
      alert('Failed to save resource. Check network/permissions.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[40px] p-8 shadow-2xl space-y-6">

        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3 text-white">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter">{editId ? "Update Resource" : "Upload to Library"}</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Native Storage Uplink</p>
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
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Resource Type</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl px-4 py-3.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="pdf">PDF Document</option>
                <option value="video">Video Session</option>
                <option value="audio">Audio Briefing</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Target Quiz Pack (Optional)</label>
              <select
                value={linkedPackId}
                onChange={e => setLinkedPackId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl px-4 py-3.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                  <option value="">No Mission Pack</option>
                  {packs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
             <input
               type="checkbox"
               id="isPublic"
               checked={isPublic}
               onChange={(e) => setIsPublic(e.target.checked)}
               className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
             />
             <label htmlFor="isPublic" className="flex-1 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                Public Visibility (Accessible to all scholars)
             </label>
          </div>

          <div className="relative group">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Select File binary *</label>
            <div className="border-2 border-dashed border-slate-700 rounded-3xl p-8 text-center group-hover:border-indigo-500 transition-all bg-slate-950/50 relative overflow-hidden">
               <UploadCloud className="w-10 h-10 text-slate-600 mx-auto mb-2" />
               <p className="text-xs font-bold text-slate-400">{file ? file.name : "Drop mission asset here or click to browse"}</p>
               <input
                 type="file"
                 onChange={(e) => e.target.files && setFile(e.target.files[0])}
                 className="absolute inset-0 opacity-0 cursor-pointer"
                 required={!editId}
               />
            </div>
            {uploadProgress > 0 && (
              <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[28px] text-xs uppercase tracking-[0.2em] transition-all shadow-2xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <><Loader2 className="animate-spin" size={18} /> {uploadProgress > 0 ? `Uploading ${Math.round(uploadProgress)}%` : 'Syncing...'}</>
              ) : (
                <><Save size={18} /> {editId ? "Update Resource" : "Deploy to Storage"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
