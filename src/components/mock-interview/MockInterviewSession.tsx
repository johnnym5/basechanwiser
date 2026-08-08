"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { db } from "@/lib/firebase/config";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { uploadMockVideo } from "@/lib/firebase/storage-utils";
import { MockInterviewAttempt, MockInterviewConfig, QuestionTimestamp } from "@/types/mock";
import { AlertCircle, Camera, CheckCircle2, ChevronRight, Loader2, RotateCcw, Square, Timer } from "lucide-react";

export default function MockInterviewSession() {
  const { user, userId, userProfile } = useAuth();
  const [config, setConfig] = useState<MockInterviewConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [questionTimestamps, setQuestionTimestamps] = useState<QuestionTimestamp[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const stopAndSaveRef = useRef<(status?: "completed" | "timeout") => Promise<void>>(async () => {});

  useEffect(() => {
    if (!userId) return;

    const fetchConfig = async () => {
      try {
        const overrideSnap = await getDoc(doc(db, "Users", userId, "overrides", "mock_interview"));
        const defaultSnap = overrideSnap.exists()
          ? null
          : await getDoc(doc(db, "mock_interview_configs", "default"));
        if (overrideSnap.exists()) setConfig(overrideSnap.data() as MockInterviewConfig);
        else if (defaultSnap?.exists()) setConfig(defaultSnap.data() as MockInterviewConfig);
      } finally {
        setLoading(false);
      }
    };

    void fetchConfig();
  }, [userId]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const startTimer = useCallback((duration: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(duration);
    timerRef.current = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          void stopAndSaveRef.current("timeout");
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
  }, []);

  const beginRecorder = useCallback((stream: MediaStream) => {
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
  }, []);

  const startCamera = async () => {
    if (!config) return;
    try {
      const stream = streamRef.current ?? await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraReady(true);
      setError(null);
      beginRecorder(stream);
      startedAtRef.current = Date.now();
      setCurrentIdx(0);
      setQuestionTimestamps([{ questionId: config.questions[0].id, startTime: 0 }]);
      startTimer(config.durationMinutes * 60);
    } catch (cause) {
      console.error("Unable to access interview camera:", cause);
      setError("Camera and microphone permissions are required to record your interview.");
    }
  };

  const restartInterview = () => {
    if (!config || !streamRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current?.state === "recording") {
      // Discard the previous take completely before the replacement recorder starts.
      recorderRef.current.ondataavailable = null;
      recorderRef.current.stop();
    }
    beginRecorder(streamRef.current);
    startedAtRef.current = Date.now();
    setCurrentIdx(0);
    setQuestionTimestamps([{ questionId: config.questions[0].id, startTime: 0 }]);
    startTimer(config.durationMinutes * 60);
  };

  const nextQuestion = () => {
    if (!config || currentIdx >= config.questions.length - 1) return;
    const nextIdx = currentIdx + 1;
    const timestamp = videoRef.current?.currentTime ?? (Date.now() - startedAtRef.current) / 1000;
    setQuestionTimestamps((items) => [...items, { questionId: config.questions[nextIdx].id, startTime: timestamp }]);
    setCurrentIdx(nextIdx);
  };

  const stopAndSave = async (status: "completed" | "timeout" = "completed") => {
    if (!config || !userId || saving || finished) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSaving(true);
    setRecording(false);

    try {
      const recorder = recorderRef.current;
      const videoBlob = await new Promise<Blob>((resolve, reject) => {
        if (!recorder) return reject(new Error("No recording is available."));
        recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" }));
        if (recorder.state === "recording") recorder.stop();
        else reject(new Error("The recorder is not active."));
      });

      const videoUrl = await uploadMockVideo(userId, videoBlob);
      const attempt: MockInterviewAttempt = {
        studentId: userId,
        studentName: userProfile?.displayName || user?.displayName || "Student",
        answers: config.questions.map((question) => ({ questionId: question.id, questionText: question.text })),
        questionTimestamps,
        videoUrl,
        startedAt: serverTimestamp(),
        submittedAt: serverTimestamp(),
        timeTakenSeconds: Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000)),
        status: status === "timeout" ? "timeout" : "pending_review",
      };
      await addDoc(collection(db, "mock_interview_attempts"), attempt);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setFinished(true);
    } catch (cause) {
      console.error("Failed to save interview:", cause);
      setError("We could not save the recording. Please check your connection and try again.");
      setRecording(recorderRef.current?.state === "recording");
    } finally {
      setSaving(false);
    }
  };
  stopAndSaveRef.current = stopAndSave;

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  if (!config) return <div className="p-12 text-center text-gray-500">Mock interview configuration is unavailable.</div>;
  if (finished) return (
    <div className="bg-white dark:bg-slate-800 p-12 rounded-[40px] shadow-xl text-center space-y-6 border border-emerald-100 dark:border-emerald-900/30">
      <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
      <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Session Submitted</h2>
      <p className="text-gray-500 font-bold text-sm">Your video response is ready for counselor review.</p>
      <button onClick={() => { window.location.href = "/dashboard"; }} className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-2xl text-xs uppercase tracking-widest">Return to Dashboard</button>
    </div>
  );

  const currentQuestion = config.questions[currentIdx];
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3"><Timer className="text-rose-500" /><div><p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Time Remaining</p><p className="text-xl font-black dark:text-white">{formatTime(timeLeft)}</p></div></div>
        <p className="text-xs font-black text-blue-500 uppercase tracking-widest">Question {currentIdx + 1} of {config.questions.length}</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[40px] border border-gray-100 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-gray-50 dark:border-slate-700"><span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Question {currentIdx + 1} of {config.questions.length}</span><h2 className="mt-3 text-2xl font-black text-gray-900 dark:text-white tracking-tight">{currentQuestion.text}</h2></div>
        <div className="p-8 space-y-4">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-64 bg-black rounded-lg object-cover" />
          {!cameraReady && <button onClick={() => void startCamera()} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex justify-center gap-2"><Camera size={18} /> Start Camera & Recording</button>}
          {recording && <p className="text-center text-xs font-black uppercase tracking-widest text-rose-500">Recording in progress</p>}
        </div>
        <div className="p-8 bg-gray-50/50 dark:bg-slate-900/50 flex flex-wrap justify-between gap-3 items-center border-t border-gray-50 dark:border-slate-700">
          <button onClick={restartInterview} disabled={!recording || saving} className="px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-700 dark:text-white bg-gray-200 dark:bg-slate-700 disabled:opacity-40 flex gap-2"><RotateCcw size={16} /> Restart</button>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => void stopAndSave()} disabled={!recording || saving} className="px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-emerald-600 disabled:opacity-40 flex gap-2">{saving ? <Loader2 size={16} className="animate-spin" /> : <Square size={16} />} Stop / Save Early</button>
            <button onClick={nextQuestion} disabled={!recording || saving || currentIdx === config.questions.length - 1} className="px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-blue-600 disabled:opacity-40 flex gap-2">Next Question <ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
      {error && <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-rose-700 dark:text-rose-400"><AlertCircle size={20} /><p className="text-xs font-bold">{error}</p></div>}
    </div>
  );
}
