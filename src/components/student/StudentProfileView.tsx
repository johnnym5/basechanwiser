'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { db } from '@/lib/firebase/config';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  addDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import {
  ArrowLeft, User, ShieldCheck, ShieldAlert, Clock,
  FileText, MessageSquare, Send, CheckCircle2, XCircle,
  Loader2, Video, PlayCircle, ChevronRight, Star
} from 'lucide-react';
import { UserProfile } from '@/types';
import { MockInterviewAttempt, MockInterviewAnswer } from '@/types/mock';
import MockSegmentReviewModal from '@/components/counselor/MockSegmentReviewModal';

interface StudentProfileViewProps {
  studentId: string;
  onBack?: () => void;
  hideHeader?: boolean;
}

export default function StudentProfileView({ studentId, onBack, hideHeader }: StudentProfileViewProps) {
  const { user, userProfile } = useAuth();

  // Data States
  const [student, setStudent] = useState<UserProfile | null>(null);
  const [mocks, setMocks] = useState<MockInterviewAttempt[]>([]);
  const [customQuestions, setCustomQuestions] = useState<any[]>([]);

  // Interaction States
  const [selectedMock, setSelectedMock] = useState<MockInterviewAttempt | null>(null);
  const [adminFeedback, setAdminFeedback] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Segment Review States
  const [segmentReviewOpen, setSegmentReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ answer: MockInterviewAnswer, index: number, mockId: string } | null>(null);

  const isAdmin = userProfile?.role === 'Admin' || userProfile?.role === 'Super Admin' || userProfile?.role === 'Counselor';

  useEffect(() => {
    if (!studentId) return;

    // 1. Fetch Student Details
    const fetchStudent = async () => {
      const docRef = doc(db, 'Users', studentId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setStudent({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
      }
    };
    fetchStudent();

    // 2. Listen to Mock Interviews in Real-time
    const mocksQuery = query(
      collection(db, 'mock_interview_attempts'),
      where('studentId', '==', studentId)
    );

    const unsubscribeMocks = onSnapshot(mocksQuery, (snapshot) => {
      const fetchedMocks = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MockInterviewAttempt));
      // Sort by newest first
      fetchedMocks.sort((a, b) => {
        const timeA = a.submittedAt?.toMillis() || a.startedAt?.toMillis() || 0;
        const timeB = b.submittedAt?.toMillis() || b.startedAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setMocks(fetchedMocks);

      // Update selected mock if it changes
      if (selectedMock) {
        const updated = fetchedMocks.find(m => m.id === selectedMock.id);
        if (updated) setSelectedMock(updated);
      }
    });

    // 3. Listen to Custom Questions assigned to this student
    const questionsQuery = query(
      collection(db, 'Users', studentId, 'custom_questions'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeQuestions = onSnapshot(questionsQuery, (snapshot) => {
      setCustomQuestions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Custom questions listener failed (might not exist yet):", err);
    });

    return () => {
      unsubscribeMocks();
      unsubscribeQuestions();
    };
  }, [studentId]);

  // Handle Mock Evaluation Submission
  const handleReviewMock = async (mockId: string, status: 'ACCEPTED' | 'REJECTED') => {
    if (!isAdmin || !user) return;
    setIsSubmitting(true);
    try {
      const mockRef = doc(db, 'mock_interview_attempts', mockId);
      await updateDoc(mockRef, {
        reviewStatus: status,
        adminFeedback: adminFeedback,
        reviewedBy: user.uid,
        reviewedAt: serverTimestamp(),
        status: 'completed'
      });
      alert(`Mock Interview marked as ${status}`);
    } catch (error) {
      console.error("Error updating mock:", error);
      alert("Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Adding a Custom Question
  const handleAddCustomQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !newQuestionText.trim() || !user) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'Users', studentId, 'custom_questions'), {
        text: newQuestionText,
        addedBy: user.uid,
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      setNewQuestionText('');
      alert("Custom question added to student's queue!");
    } catch (error) {
      console.error("Error adding question:", error);
      alert("Failed to add question.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine overall mock status for the top right badge
  const latestMock = mocks[0];
  const globalMockStatus = latestMock?.status || 'NOT_STARTED';
  const reviewStatus = latestMock?.reviewStatus;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">

      {/* 1. Header Section & Status Badge */}
      {!hideHeader && (
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 shadow-xl shrink-0">
              <span className="text-3xl font-black text-indigo-500">
                {student?.displayName?.charAt(0)?.toUpperCase() || 'S'}
              </span>
            </div>

            <div className="space-y-1">
              {isAdmin && onBack && (
                <button onClick={onBack} className="flex items-center text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider mb-1 transition-all">
                  <ArrowLeft className="w-3 h-3 mr-1" /> Back to Directory
                </button>
              )}
              <h1 className="text-3xl font-black text-white tracking-tight">
                {student?.displayName || 'Scholar Profile'}
              </h1>
              <div className="flex items-center space-x-3 text-xs font-semibold text-slate-400">
                <span className="text-indigo-400">{student?.studentId || 'ID PENDING'}</span>
                <span>•</span>
                <span className="flex items-center"><User className="w-3 h-3 mr-1"/> {student?.email}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Status Badge */}
          <div className="flex flex-col items-end">
            <div className={`flex items-center px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider shadow-lg ${
              reviewStatus === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
              reviewStatus === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
              globalMockStatus === 'pending_review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
              'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {globalMockStatus === 'pending_review' && <Clock className="w-4 h-4 mr-2 animate-pulse" />}
              {reviewStatus === 'ACCEPTED' && <ShieldCheck className="w-4 h-4 mr-2" />}
              {reviewStatus === 'REJECTED' && <ShieldAlert className="w-4 h-4 mr-2" />}
              {(globalMockStatus as string) === 'NOT_STARTED' && <FileText className="w-4 h-4 mr-2" />}

              {reviewStatus === 'ACCEPTED' ? 'Mock Reviewed & Accepted' :
              reviewStatus === 'REJECTED' ? 'Mock Reviewed & Rejected' :
              globalMockStatus === 'pending_review' ? 'Mock Awaiting Review' : 'No Mocks Submitted'}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* 2. Left Column: Submissions List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Submission History</h2>

          {mocks.length === 0 ? (
            <div className="text-sm font-bold text-slate-600 bg-slate-900/30 p-8 rounded-[32px] border border-dashed border-slate-800 text-center">
              No mock interviews detected.
            </div>
          ) : (
            <div className="space-y-3">
              {mocks.map(mock => {
                const mReviewStatus = mock.reviewStatus;
                return (
                  <button
                    key={mock.id}
                    onClick={() => {
                      setSelectedMock(mock);
                      setAdminFeedback(mock.adminFeedback || '');
                    }}
                    className={`w-full text-left p-5 rounded-[28px] border transition-all ${selectedMock?.id === mock.id ? 'bg-indigo-600/10 border-indigo-500/50 ring-4 ring-indigo-500/5' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-white font-black text-xs uppercase tracking-tighter truncate pr-2">{mock.setId || 'Assessment Session'}</h3>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase border ${
                        mReviewStatus === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        mReviewStatus === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {mReviewStatus || (mock.status === 'pending_review' ? 'PENDING' : mock.status.toUpperCase())}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <span>{mock.submittedAt ? new Date(mock.submittedAt.toDate()).toLocaleDateString() : 'Active Session'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Right Column: Detailed View & Evaluation Form */}
        <div className="lg:col-span-2 space-y-6">
          {selectedMock ? (
            <div className="bg-slate-900 rounded-[40px] border border-slate-800 p-8 shadow-xl space-y-8">

              {/* Transcript/Submission Area */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <h2 className="text-xl font-black text-white uppercase tracking-tighter">Session Transmission Audit</h2>
                   <div className="flex gap-2">
                      {selectedMock.videoUrl && (
                        <a href={selectedMock.videoUrl} target="_blank" className="p-2 bg-slate-800 rounded-xl text-indigo-400 hover:text-white transition-all"><Video size={18} /></a>
                      )}
                   </div>
                </div>

                <div className="bg-slate-950 rounded-[32px] p-8 border border-slate-800 text-sm text-slate-300 max-h-[400px] overflow-y-auto space-y-6 scrollbar-hide">
                  {selectedMock.answers && selectedMock.answers.length > 0 ? (
                    selectedMock.answers.map((answer, idx) => (
                      <div key={idx} className="space-y-2 group">
                        <div className="flex items-center gap-3">
                           <span className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-black text-indigo-500">Q{idx + 1}</span>
                           <p className="font-black text-white uppercase tracking-tighter text-xs">{answer.questionText}</p>
                        </div>
                        <div className="pl-11 border-l border-slate-800 space-y-3">
                           {answer.feedback && (
                             <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                <div className="flex items-center justify-between mb-1">
                                   <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Sectional Feedback</p>
                                   {answer.stars && (
                                     <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                          <Star key={i} size={8} fill={answer.stars! > i ? 'currentColor' : 'none'} className={answer.stars! > i ? 'text-yellow-400' : 'text-slate-700'} />
                                        ))}
                                     </div>
                                   )}
                                </div>
                                <p className="text-emerald-200/80 italic text-xs">{answer.feedback}</p>
                             </div>
                           )}
                           {answer.videoUrl && (
                             <button
                               onClick={() => {
                                 setReviewTarget({ answer, index: idx, mockId: selectedMock.id! });
                                 setSegmentReviewOpen(true);
                               }}
                               className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-blue-500 hover:text-white transition-all"
                             >
                                <PlayCircle size={14} /> Play Answer Segment
                             </button>
                           )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 opacity-30 text-center">
                       <FileText size={40} className="mb-4" />
                       <p className="text-xs font-black uppercase tracking-widest">No segmented data found in this transmission.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Evaluation Area */}
              <div className="space-y-6 pt-8 border-t border-slate-800">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
                  <MessageSquare className="w-4 h-4 mr-3 text-indigo-500" />
                  {isAdmin ? 'Operational Evaluation Notes' : 'Counselor Feedback & Guidance'}
                </h3>

                {isAdmin ? (
                  <div className="space-y-4">
                    <textarea
                      value={adminFeedback}
                      onChange={(e) => setAdminFeedback(e.target.value)}
                      placeholder="Write your overall review, feedback, or required corrections here..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-[32px] p-8 text-sm font-medium leading-relaxed text-white focus:ring-2 focus:ring-indigo-500 outline-none h-40 transition-all"
                    />
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleReviewMock(selectedMock.id!, 'ACCEPTED')}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[24px] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Accept Submission
                      </button>
                      <button
                        onClick={() => handleReviewMock(selectedMock.id!, 'REJECTED')}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-[24px] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-rose-500/20 disabled:opacity-50 active:scale-95"
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Reject Submission
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`p-8 rounded-[32px] border-2 ${selectedMock.reviewStatus === 'ACCEPTED' ? 'bg-emerald-900/10 border-emerald-500/30 text-emerald-200' : selectedMock.reviewStatus === 'REJECTED' ? 'bg-rose-900/10 border-rose-500/30 text-rose-200' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                     {selectedMock.adminFeedback ? (
                       <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed">{selectedMock.adminFeedback}</p>
                     ) : (
                       <div className="flex items-center gap-3 italic opacity-60">
                          <Clock size={16} />
                          <p className="text-xs font-bold uppercase tracking-widest">Awaiting Counselor Assessment...</p>
                       </div>
                     )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-900/30 border border-slate-800/50 rounded-[40px] border-dashed space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-600"><PlayCircle size={32} /></div>
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Select a transmission from the history to begin audit.</p>
            </div>
          )}

          {/* 4. Custom Question Assignment (Staff Only) */}
          {isAdmin && (
            <div className="bg-slate-900 rounded-[40px] border border-slate-800 p-8 shadow-xl space-y-6">
              <div className="space-y-1">
                 <h3 className="text-sm font-black text-white uppercase tracking-tighter flex items-center">
                   Assign Custom Compliance Question
                 </h3>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Directly injected into scholar's assessment queue</p>
              </div>

              <form onSubmit={handleAddCustomQuestion} className="flex gap-4">
                <input
                  type="text"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="e.g., Please explain your studies justification in detail..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm font-medium text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!newQuestionText.trim() || isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-indigo-500/20"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Assign
                </button>
              </form>

              {/* List of Custom Questions */}
              {customQuestions.length > 0 && (
                <div className="pt-6 border-t border-slate-800 space-y-4">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Queue Audit ({customQuestions.length})</p>
                   <div className="grid grid-cols-1 gap-2">
                      {customQuestions.map(q => (
                        <div key={q.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center group hover:border-indigo-500/30 transition-all">
                           <p className="text-xs text-slate-300 font-bold leading-none">{q.text}</p>
                           <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase border ${
                             q.status === 'answered'
                               ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                               : 'bg-slate-800 text-slate-500 border-slate-700'
                           }`}>
                              {q.status}
                           </span>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      {/* 5. Sectional Review Modal */}
      {reviewTarget && (
        <MockSegmentReviewModal
          isOpen={segmentReviewOpen}
          onClose={() => {
            setSegmentReviewOpen(false);
            setReviewTarget(null);
          }}
          mockId={reviewTarget.mockId}
          answerIndex={reviewTarget.index}
          answer={reviewTarget.answer}
          onSuccess={() => {
            // Data will refresh via onSnapshot listener on the parent
          }}
        />
      )}

    </div>
  );
}
