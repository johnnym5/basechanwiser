"use client";

import { useState, useEffect } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, listAll } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth/auth-context';
import { FileText, Download, UploadCloud, Loader2 } from 'lucide-react';

export default function ResourceVault() {
  const { effectiveRole } = useAuth();
  const [files, setFiles] = useState<{name: string, url: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const isAdmin = effectiveRole === 'Admin' || effectiveRole === 'Super Admin';

  const fetchFiles = async () => {
    setLoading(true);
    const listRef = ref(storage, 'resources');
    try {
      const res = await listAll(listRef);
      const filePromises = res.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return { name: itemRef.name, url };
      });
      setFiles(await Promise.all(filePromises));
    } catch (error) {
      console.error("Error fetching resources", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setUploading(true);
    const file = e.target.files[0];
    const fileRef = ref(storage, `resources/${file.name}`);

    try {
      const uploadTask = uploadBytesResumable(fileRef, file);
      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed', null, reject, () => resolve(uploadTask));
      });
      await fetchFiles(); // Refresh list
    } catch (error) {
      console.error("Upload error", error);
      alert("Failed to upload file. Check storage rules or connection.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 font-google">
          <FileText className="text-indigo-500"/> Open Resource Vault
        </h2>

        {isAdmin && (
          <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 text-sm font-bold transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
            {uploading ? <Loader2 className="animate-spin" size={16}/> : <UploadCloud size={16}/>}
            {uploading ? 'Uploading...' : 'Upload PDF'}
            <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file, i) => (
            <a
              key={i}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-slate-800 p-4 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 group"
            >
              <div className="flex items-center gap-3 truncate">
                <FileText className="text-slate-500 group-hover:text-indigo-400" size={18} />
                <span className="text-slate-200 text-sm font-medium truncate pr-4">{file.name}</span>
              </div>
              <Download className="text-indigo-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" size={18}/>
            </a>
          ))}
          {files.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-800 rounded-2xl">
               <p className="text-slate-500 text-sm font-medium">No resources available yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
