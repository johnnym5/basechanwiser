import React from "react";
import { FileQuestion, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#1E293B] rounded-[40px] p-10 border border-slate-800 shadow-2xl text-center space-y-8 animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
          <FileQuestion className="w-10 h-10 text-blue-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Page Not Found</h1>
          <p className="text-slate-400 text-sm font-bold leading-relaxed">
            The resource you are looking for might have been removed or is temporarily unavailable.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 w-full py-4 bg-[#1a73e8] text-white font-black rounded-full text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          Go to Dashboard <ArrowRight className="w-4 h-4" />
        </Link>

        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          Error 404 • Basechan ComplianceOS
        </p>
      </div>
    </div>
  );
}
