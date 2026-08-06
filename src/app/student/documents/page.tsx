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
        <h1 className="text-2xl font-bold text-white">My Documents</h1>
        <p className="text-slate-400">
          Upload your required UKVI compliance documents here.
          Only PDF, JPG, and PNG formats are accepted.
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
        <div className="mt-8 bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h3 className="text-lg font-bold text-white mb-4">Uploaded Files</h3>
          <ul className="space-y-3">
            {Object.entries(userProfile.documents).map(([key, url]) => (
              <li key={key} className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                <span className="text-slate-300 capitalize font-medium">
                  {key.replace(/_/g, ' ')}
                </span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 text-sm font-bold transition-colors"
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
