"use client";

import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth/auth-context';
import { FileUp, CheckCircle, AlertCircle } from 'lucide-react';

interface DocumentUploaderProps {
  documentType: string; // e.g., 'passport', 'transcript', 'cas_letter'
  onUploadSuccess: (url: string, documentType: string) => void;
  acceptedTypes?: string; // e.g., '.pdf,image/*'
}

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
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setIsUploading(true);
    setError(null);

    // Create a reference: documents/{userId}/{documentType}_{timestamp}_{filename}
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
        setFile(null); // Clear selection after success
      }
    );
  };

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-slate-200 capitalize">
          Upload {documentType.replace(/_/g, ' ')}
        </h4>
        {success && <CheckCircle className="text-green-500" size={20}/>}
      </div>

      <div className="flex flex-col gap-3">
        <input
          type="file"
          accept={acceptedTypes}
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-600/20 file:text-indigo-400
            hover:file:bg-indigo-600/30 transition-colors"
        />

        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertCircle size={14}/> {error}
          </p>
        )}

        {isUploading && (
          <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
            <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
          </div>
        )}

        <button
          onClick={handleUpload}
          type="button"
          disabled={!file || isUploading}
          className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-colors ${
            !file || isUploading
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          <FileUp size={16}/>
          {isUploading ? `Uploading... ${progress}%` : 'Upload File'}
        </button>
      </div>
    </div>
  );
}
