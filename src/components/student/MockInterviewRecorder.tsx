"use client";

import React, { useEffect, useRef, useState } from "react";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth/auth-context";
import { Camera, StopCircle, UploadCloud } from "lucide-react";

export const QUESTIONS = [
  "Please introduce yourself and state your full name and date of birth.",
  "Why have you chosen to study in the UK rather than your home country?",
  "Why did you choose this specific university and course?",
  "How will you fund your studies and living expenses in the UK?",
  "What are your career plans immediately after graduating?"
];

export default function MockInterviewRecorder() {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Please allow camera and microphone access to begin.");

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (isRecording && timeLeft === 0) {
      if (currentQuestionIndex < QUESTIONS.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setTimeLeft(60);
      } else {
        stopRecording();
      }
    }
    return () => clearTimeout(timer);
  }, [isRecording, timeLeft, currentQuestionIndex]);

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
      }
      setHasPermission(true);
      setStatusMessage("Ready to record. Click Start to begin your interview.");
      setErrorMessage(null);
    } catch (err) {
      console.error("Camera/Mic permission denied:", err);
      setErrorMessage("Please enable camera and microphone permissions to proceed.");
      alert("Please enable camera and microphone permissions to proceed.");
    }
  };

  const startRecording = () => {
    if (!videoRef.current?.srcObject) {
      setErrorMessage("Camera stream is not available. Please refresh and allow permissions.");
      return;
    }

    const stream = videoRef.current.srcObject as MediaStream;
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = uploadVideo;
    recorder.start();

    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setCurrentQuestionIndex(0);
    setTimeLeft(60);
    setStatusMessage("Recording in progress. Answer the current question clearly.");
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);

    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach((track) => track.stop());

    setStatusMessage("Preparing your video for upload...");
  };

  const uploadVideo = async () => {
    if (!user) {
      setErrorMessage("You must be signed in to upload the interview.");
      return;
    }

    const blob = new Blob(chunksRef.current, { type: "video/webm" });
    const videoFileRef = storageRef(storage, `mock_interviews/${user.uid}_interview.webm`);
    const uploadTask = uploadBytesResumable(videoFileRef, blob);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      },
      (error) => {
        console.error("Upload failed:", error);
        setErrorMessage("Upload failed. Please try again.");
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await updateDoc(doc(db, "Users", user.uid), {
            "mockInterview.videoUrl": downloadURL,
            "mockInterview.status": "Submitted",
            "mockInterview.submittedAt": serverTimestamp(),
            "mockInterview.counselorNotes": "",
            "mockInterview.score": null,
          });
          setStatusMessage("Interview submitted successfully!");
          alert("Interview submitted successfully!");
        } catch (err) {
          console.error("Failed to save interview metadata:", err);
          setErrorMessage("Interview uploaded, but we could not save the submission record.");
        }
      }
    );
  };

  return (
    <div className="flex flex-col items-center bg-slate-900 p-6 rounded-xl border border-slate-800">
      <video ref={videoRef} autoPlay playsInline muted className="w-full max-w-2xl bg-black rounded-lg mb-4 aspect-video object-cover" />

      {!hasPermission ? (
        <button
          onClick={requestPermissions}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg flex items-center gap-2"
        >
          <Camera className="w-5 h-5" /> Enable Camera & Microphone
        </button>
      ) : (
        <div className="w-full max-w-2xl text-center">
          {isRecording ? (
            <>
              <h3 className="text-xl font-bold text-white mb-2">Question {currentQuestionIndex + 1} of {QUESTIONS.length}</h3>
              <p className="text-indigo-400 text-lg mb-4 min-h-[4rem]">{QUESTIONS[currentQuestionIndex]}</p>

              <div className="flex justify-between items-center bg-slate-800 p-4 rounded-lg">
                <span className="text-amber-500 font-mono text-xl">00:{timeLeft.toString().padStart(2, "0")}</span>
                <button
                  onClick={stopRecording}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <StopCircle size={20} /> Finish Early
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={startRecording}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg w-full font-bold"
            >
              Start Mock Interview
            </button>
          )}
        </div>
      )}

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="w-full max-w-2xl mt-4">
          <p className="text-white mb-2 flex items-center gap-2"><UploadCloud className="w-4 h-4" /> Uploading Video...</p>
          <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {statusMessage && <p className="text-sm text-slate-300 mt-4">{statusMessage}</p>}
      {errorMessage && <p className="text-sm text-rose-400 mt-2">{errorMessage}</p>}
    </div>
  );
}
