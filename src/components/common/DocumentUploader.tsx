"use client";

import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth/auth-context';
import { FileUp, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface DocumentUploaderProps {
  documentType: string; // e.g., 'passport', 'transcript', 'cas_letter'
  onUploadSuccess: (url: string, documentType: string) => void;
  acceptedTypes?: string; // e.g., '.pdf,image/*'
}

/**
 * DocumentUploader: Restored native Firebase Storage binary uploads.
 */
export default function DocumentUploader({
  documentType,
  onUploadSuccess,
  acceptedTypes = ".pdf,.jpg,.jpeg,.png"
}: DocumentUploaderProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(false);
      setProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setIsUploading(true);
    setError(null);

    try {
      const fileRef = ref(storage, `documents/${user.uid}/${documentType}_${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(percent);
        },
        (err) => {
          console.error("Upload failed:", err);
          setError("Failed to upload document. Please try again.");
          setIsUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setSuccess(true);
          setIsUploading(false);
          onUploadSuccess(downloadURL, documentType);
          setFile(null);
          setTimeout(() => setSuccess(false), 3000);
        }
      );
    } catch (err) {
      console.error(err);
      setError("Critical error during upload.");
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          Upload {documentType.replace(/_/g, ' ')}
        </h4>
        {success && (
          <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase">
            <CheckCircle size={14}/> Complete
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative group">
          <input
            type="file"
            accept={acceptedTypes}
            onChange={handleFileChange}
            className="block w-full text-xs text-slate-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-xl file:border-0
              file:text-xs file:font-black file:uppercase
              file:bg-indigo-600/20 file:text-indigo-400
              hover:file:bg-indigo-600/30 transition-all cursor-pointer"
          />
        </div>

        {error && (
          <p className="text-[10px] font-black text-rose-400 flex items-center gap-1 uppercase tracking-tighter">
            <AlertCircle size={14}/> {error}
          </p>
        )}

        {isUploading && (
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <button
          onClick={handleUpload}
          type="button"
          disabled={!file || isUploading}
          className={`flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
            !file || isUploading
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-900/20 active:scale-95'
          }`}
        >
          {isUploading ? (
            <><Loader2 className="animate-spin w-4 h-4" /> {progress}%</>
          ) : (
            <><FileUp size={16}/> Push to Cloud Vault</>
          )}
        </button>
      </div>
    </div>
  );
}
