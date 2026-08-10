'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Download, Activity, ExternalLink, Clock, ChevronRight } from 'lucide-center'; // wait, lucide-react
import { Search as SearchIcon, Filter as FilterIcon, Download as DownloadIcon, Activity as ActivityIcon, ExternalLink as ExternalLinkIcon, Clock as ClockIcon, ChevronRight as ChevronRightIcon } from 'lucide-react';
import AppShell from "@/components/layout/app-shell";

export default function ActivityLogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [eventType, setEventType] = useState('ALL');

  // Mock data for initial UI scaffolding
  const mockEvents = [
    { id: 1, studentName: 'Cletus M.', studentId: '123', type: 'ACADEMIC', action: 'Passed Module 2', desc: 'Score: 90%. Auto-advanced to Module 3.', timestamp: '10 mins ago', date: 'Oct 24, 2023' },
    { id: 2, studentName: 'John D.', studentId: '456', type: 'DOCUMENT', action: 'Uploaded Statement', desc: 'Bank Statement (PDF) submitted for review.', timestamp: '1 hour ago', date: 'Oct 24, 2023' },
    { id: 3, studentName: 'Sarah K.', studentId: '789', type: 'SYSTEM', action: 'Account Created', desc: 'Invited by Admin. Status set to New.', timestamp: '2 hours ago', date: 'Oct 24, 2023' },
    { id: 4, studentName: 'David O.', studentId: '101', type: 'INTERVIEW', action: 'Submitted Mock', desc: 'UKVI Drill #1 recording finalized.', timestamp: '4 hours ago', date: 'Oct 24, 2023' },
  ];

  const renderTypeBadge = (type: string) => {
    const base = "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap border transition-all duration-200";
    switch(type) {
      case 'ACADEMIC': return <span className={`${base} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}>ACADEMIC</span>;
      case 'DOCUMENT': return <span className={`${base} bg-blue-500/10 text-blue-400 border-blue-500/20`}>DOCUMENT</span>;
      case 'INTERVIEW': return <span className={`${base} bg-orange-500/10 text-orange-400 border-orange-500/20`}>INTERVIEW</span>;
      case 'SYSTEM': return <span className={`${base} bg-slate-500/10 text-slate-400 border-slate-500/20`}>SYSTEM</span>;
      default: return null;
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
                    <option value="ACADEMIC">Academic</option>
                    <option value="DOCUMENT">Documents</option>
                    <option value="INTERVIEW">Interviews</option>
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
                {mockEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-white font-black text-xs uppercase tracking-tighter">{event.date}</div>
                      <div className="text-[10px] text-slate-500 font-bold flex items-center mt-1 uppercase tracking-widest"><ClockIcon className="w-3 h-3 mr-1.5"/> {event.timestamp}</div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap font-black text-slate-200 text-sm uppercase tracking-tighter">{event.studentName}</td>
                    <td className="px-8 py-6 whitespace-nowrap">{renderTypeBadge(event.type)}</td>
                    <td className="px-8 py-6">
                      <div className="text-slate-200 font-black text-xs uppercase tracking-widest">{event.action}</div>
                      <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tight line-clamp-1">{event.desc}</div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Link href={`/counselor/students/portfolio?id=${event.studentId}`} className="inline-flex items-center bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-indigo-500/20">
                        Profile <ExternalLinkIcon className="w-3 h-3 ml-2" />
                      </Link>
                    </td>
                  </tr>
                ))}
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
