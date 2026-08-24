"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Link2, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { formatDriveEmbedUrl } from '@/lib/utils/drive-helpers';

interface DocumentUploaderProps {
  documentType: string; // e.g., 'passport', 'transcript', 'cas_letter'
  onUploadSuccess: (url: string, documentType: string) => void;
  acceptedTypes?: string; // Kept for interface compatibility
}

/**
 * DocumentLinker (formerly Uploader):
 * Decommissioned Firebase Storage uploads to prevent billing errors.
 * Strictly accepts direct links or Google Drive URLs.
 */
export default function DocumentUploader({
  documentType,
  onUploadSuccess,
}: DocumentUploaderProps) {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleLink = async () => {
    if (!url || !user) {
      setError("Please provide a valid URL.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Transform Google Drive links to embeddable previews automatically
      const finalUrl = formatDriveEmbedUrl(url);

      setSuccess(true);
      onUploadSuccess(finalUrl, documentType);
      setUrl('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Linking failed:", err);
      setError("Failed to process link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          Link {documentType.replace(/_/g, ' ')}
        </h4>
        {success && (
          <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase animate-in fade-in">
            <CheckCircle size={14}/> Linked
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative">
          <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(null); }}
            placeholder="Paste Google Drive or Web Link..."
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        {error && (
          <p className="text-[10px] font-black text-rose-400 flex items-center gap-1 uppercase tracking-tighter ml-1">
            <AlertCircle size={14}/> {error}
          </p>
        )}

        <button
          onClick={handleLink}
          type="button"
          disabled={!url || isSubmitting}
          className={`flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
            !url || isSubmitting
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20 active:scale-95'
          }`}
        >
          {isSubmitting ? (
            <><Loader2 className="animate-spin w-4 h-4" /> Processing...</>
          ) : (
            <>Attach Document Link</>
          )}
        </button>

        <p className="text-[9px] text-slate-500 flex items-start gap-1.5 italic leading-relaxed px-1">
          <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
          Drive links are automatically converted to secure in-app previews.
        </p>
      </div>
    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
