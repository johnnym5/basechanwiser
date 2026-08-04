import { Loader2 } from 'lucide-react';

export default function FullScreenLoader() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0F172A] text-slate-200">
      <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4"/>
      <p className="text-lg font-medium animate-pulse">Loading workspace...</p>
    </div>
  );
}
