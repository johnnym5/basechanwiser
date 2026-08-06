"use client";

import { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth/auth-context';
import { sanitizeInput } from '@/utils/sanitize';
import { Save, CheckCircle, GraduationCap, Building, MapPin, History, HelpCircle, DollarSign, Briefcase, Loader2 } from 'lucide-react';

export default function InterviewPackForm() {
  const { userId, userProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    intendedUniversity: '',
    universityCity: '',
    courseOfStudy: '',
    academicHistory: '',
    studyGapReasons: '',
    fundingSource: '',
    postStudyPlans: ''
  });

  // Load existing data if available
  useEffect(() => {
    if (userProfile?.interviewPack) {
      setFormData({
        intendedUniversity: userProfile.interviewPack.intendedUniversity || '',
        universityCity: userProfile.interviewPack.universityCity || '',
        courseOfStudy: userProfile.interviewPack.courseOfStudy || '',
        academicHistory: userProfile.interviewPack.academicHistory || '',
        studyGapReasons: userProfile.interviewPack.studyGapReasons || '',
        fundingSource: userProfile.interviewPack.fundingSource || '',
        postStudyPlans: userProfile.interviewPack.postStudyPlans || ''
      });
    }
  }, [userProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);

    try {
      // Sanitize all inputs before saving
      const sanitizedData = {
        intendedUniversity: sanitizeInput(formData.intendedUniversity, 100),
        universityCity: sanitizeInput(formData.universityCity, 100),
        courseOfStudy: sanitizeInput(formData.courseOfStudy, 150),
        academicHistory: sanitizeInput(formData.academicHistory, 500),
        studyGapReasons: sanitizeInput(formData.studyGapReasons, 500),
        fundingSource: sanitizeInput(formData.fundingSource, 300),
        postStudyPlans: sanitizeInput(formData.postStudyPlans, 500),
      };

      await updateDoc(doc(db, 'Users', userId), {
        interviewPack: sanitizedData,
        updatedAt: serverTimestamp()
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving pack:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyles = "w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white mt-1 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600 font-medium text-sm";
  const labelStyles = "text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-1";

  return (
    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-400">
           <GraduationCap size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">My Interview Pack</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Student Application Context for AI & Counselor Review
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className={labelStyles}><Building size={14}/> Intended University</label>
            <input type="text" name="intendedUniversity" value={formData.intendedUniversity} onChange={handleChange} placeholder="e.g. University of Manchester" className={inputStyles} />
          </div>
          <div className="space-y-1">
            <label className={labelStyles}><MapPin size={14}/> University City / Location</label>
            <input type="text" name="universityCity" value={formData.universityCity} onChange={handleChange} placeholder="e.g. Manchester, UK" className={inputStyles} />
          </div>
        </div>

        <div className="space-y-1">
          <label className={labelStyles}><GraduationCap size={14}/> Exact Course of Study</label>
          <input type="text" name="courseOfStudy" value={formData.courseOfStudy} onChange={handleChange} placeholder="e.g. MSc Data Science" className={inputStyles} />
        </div>

        <div className="space-y-1">
          <label className={labelStyles}><History size={14}/> Previous Academic History</label>
          <textarea name="academicHistory" value={formData.academicHistory} onChange={handleChange} rows={3} placeholder="Briefly describe your previous degree(s) and graduation year..." className={inputStyles} />
        </div>

        <div className="space-y-1">
          <label className={labelStyles}><HelpCircle size={14}/> Study Gap Explanation (If applicable)</label>
          <textarea name="studyGapReasons" value={formData.studyGapReasons} onChange={handleChange} rows={2} placeholder="Explain any gap between your last degree and now..." className={inputStyles} />
        </div>

        <div className="space-y-1">
          <label className={labelStyles}><DollarSign size={14}/> Funding Source</label>
          <textarea name="fundingSource" value={formData.fundingSource} onChange={handleChange} rows={2} placeholder="Who is paying your tuition and living expenses?" className={inputStyles} />
        </div>

        <div className="space-y-1">
          <label className={labelStyles}><Briefcase size={14}/> Post-Study Career Plans</label>
          <textarea name="postStudyPlans" value={formData.postStudyPlans} onChange={handleChange} rows={3} placeholder="What job will you return to your home country to do?" className={inputStyles} />
        </div>

        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full flex justify-center items-center gap-3 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg ${
              success
              ? 'bg-emerald-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 active:scale-95'
            }`}
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : success ? <CheckCircle size={20}/> : <Save size={20}/>}
            {isSaving ? 'Saving Profile...' : success ? 'Saved Successfully' : 'Save Interview Pack'}
          </button>
        </div>
      </div>
    </div>
  );
}
