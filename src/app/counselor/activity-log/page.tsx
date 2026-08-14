'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search as SearchIcon, Filter as FilterIcon, Download as DownloadIcon, Activity as ActivityIcon, ExternalLink as ExternalLinkIcon, Clock as ClockIcon, ChevronRight as ChevronRightIcon, Loader2 } from 'lucide-react';
import AppShell from "@/components/layout/app-shell";
import { db } from "@/lib/firebase/config";
import { collection, query, getDocs, orderBy, limit, where } from "firebase/firestore";
import { formatDistanceToNow, format } from "date-fns";

export default function ActivityLogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [eventType, setEventType] = useState('ALL');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [eventType]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, "activity_logs"), orderBy("createdAt", "desc"), limit(50));

      if (eventType !== 'ALL') {
        q = query(collection(db, "activity_logs"), where("type", "==", eventType), orderBy("createdAt", "desc"), limit(50));
      }

      const snap = await getDocs(q);
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Fetch logs error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderTypeBadge = (type: string) => {
    const base = "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap border transition-all duration-200";
    switch(type) {
      case 'ACADEMIC_MODULE': return <span className={`${base} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}>ACADEMIC</span>;
      case 'DOCUMENT': return <span className={`${base} bg-blue-500/10 text-blue-400 border-blue-500/20`}>DOCUMENT</span>;
      case 'MOCK_INTERVIEW': return <span className={`${base} bg-orange-500/10 text-orange-400 border-orange-500/20`}>INTERVIEW</span>;
      case 'SYSTEM': return <span className={`${base} bg-slate-500/10 text-slate-400 border-slate-500/20`}>SYSTEM</span>;
      default: return <span className={`${base} bg-slate-800/50 text-slate-400 border-slate-700`}>{type}</span>;
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 border border-slate-800 p-8 rounded-[40px] gap-4 shadow-xl">
          <div className="flex items-center space-x-5">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-inner">
              <ActivityIcon className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tighter">System Activity Log</h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Complete audit trail of platform events and student actions.</p>
            </div>
          </div>
          <button className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-slate-700 active:scale-95">
            <DownloadIcon className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filters & Table Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-[40px] overflow-hidden shadow-2xl">

          {/* Controls */}
          <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center bg-slate-900/50 gap-4">
            <div className="relative w-full md:w-96">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by student or event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
              />
            </div>
            <div className="flex space-x-3 w-full md:w-auto">
               <div className="relative flex-1 md:flex-none">
                  <FilterIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full pl-11 pr-10 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest text-white focus:outline-none focus:border-indigo-500 appearance-none transition-all cursor-pointer"
                  >
                    <option value="ALL">All Event Types</option>
                    <option value="ACADEMIC_MODULE">Academic</option>
                    <option value="DOCUMENT">Documents</option>
                    <option value="MOCK_INTERVIEW">Interviews</option>
                    <option value="SYSTEM">System</option>
                  </select>
                  <ChevronRightIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none rotate-90" />
               </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/50 text-[10px] uppercase text-slate-500 font-black tracking-widest border-b border-slate-800">
                <tr>
                  <th className="px-8 py-5">Timestamp</th>
                  <th className="px-8 py-5">Student</th>
                  <th className="px-8 py-5">Event Type</th>
                  <th className="px-8 py-5">Description</th>
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                       <Loader2 className="animate-spin text-indigo-500 mx-auto mb-4" size={32} />
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Retrieving Audit Data...</p>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-gray-500 italic uppercase text-xs font-bold tracking-widest">
                       No events found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="text-white font-black text-xs uppercase tracking-tighter">
                          {event.createdAt?.seconds ? format(event.createdAt.seconds * 1000, 'MMM dd, yyyy') : 'Recently'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold flex items-center mt-1 uppercase tracking-widest">
                          <ClockIcon className="w-3 h-3 mr-1.5"/>
                          {event.createdAt?.seconds ? formatDistanceToNow(event.createdAt.seconds * 1000) + ' ago' : 'Just now'}
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap font-black text-slate-200 text-sm uppercase tracking-tighter">{event.studentName}</td>
                      <td className="px-8 py-6 whitespace-nowrap">{renderTypeBadge(event.type)}</td>
                      <td className="px-8 py-6">
                        <div className="text-slate-200 font-black text-xs uppercase tracking-widest line-clamp-1">{event.action}</div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Link href={`/counselor/students/portfolio?id=${event.studentId}`} className="inline-flex items-center bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-indigo-500/20">
                          Profile <ExternalLinkIcon className="w-3 h-3 ml-2" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination Placeholder */}
          <div className="p-6 bg-slate-900/80 border-t border-slate-800 text-center">
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">End of Audit Trail</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
