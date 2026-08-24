"use client";

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth/auth-context';
import DocumentUploader from '@/components/common/DocumentUploader';

export default function StudentDocuments() {
  const { user, userProfile } = useAuth();

  const handleSaveToFirestore = async (url: string, docType: string) => {
    if (!user) return;

    try {
      const userRef = doc(db, 'Users', user.uid);
      // Update the specific document field dynamically
      await updateDoc(userRef, {
        [`documents.${docType}`]: url,
        updatedAt: serverTimestamp()
      });
      alert(`${docType.replace(/_/g, ' ')} successfully saved!`);
    } catch (error) {
      console.error("Error saving document URL to Firestore:", error);
      alert("Failed to save document reference. Please try again.");
    }
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-400">Please sign in to manage your documents.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">My Documents</h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
          Upload your required UKVI compliance documents here.
          Your files are encrypted and stored securely in our cloud vault.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DocumentUploader
          documentType="passport"
          onUploadSuccess={handleSaveToFirestore}
        />
        <DocumentUploader
          documentType="cas_letter"
          onUploadSuccess={handleSaveToFirestore}
        />
        <DocumentUploader
          documentType="bank_statement"
          onUploadSuccess={handleSaveToFirestore}
        />
      </div>

      {/* Displaying already uploaded documents */}
      {userProfile?.documents && Object.keys(userProfile.documents).length > 0 && (
        <div className="mt-8 bg-slate-900 border border-slate-800 p-8 rounded-[32px] shadow-sm">
          <h3 className="text-sm font-black text-white mb-6 uppercase tracking-widest border-b border-slate-800 pb-3">Uploaded Files</h3>
          <ul className="space-y-4">
            {Object.entries(userProfile.documents).map(([key, url]) => (
              <li key={key} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-slate-800 group hover:border-indigo-500/30 transition-all">
                <span className="text-slate-300 capitalize font-black text-xs uppercase tracking-tight">
                  {key.replace(/_/g, ' ')}
                </span>
                <a
                  href={url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-800 text-indigo-400 hover:bg-indigo-600 hover:text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                >
                  View Document
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
