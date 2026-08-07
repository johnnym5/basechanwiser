import { useState, useRef, useCallback } from 'react';

export function useMediaRecorder() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  const startRecording = useCallback(async (options?: { lowBandwidth?: boolean }) => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setStream(userStream);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = userStream;
      }

      const mediaRecorder = new MediaRecorder(userStream, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: options?.lowBandwidth ? 250000 : 2500000,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        setRecordedChunks(chunks);
      };

      mediaRecorder.start();
      setRecorder(mediaRecorder);
      setIsRecording(true);
      return true;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      return false;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recorder) {
      recorder.stop();
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setStream(null);
  }, [recorder, stream]);

  const getBlob = useCallback(() => {
    if (recordedChunks.length === 0) return null;
    return new Blob(recordedChunks, { type: 'video/webm' });
  }, [recordedChunks]);

  return {
    stream,
    isRecording,
    startRecording,
    stopRecording,
    getBlob,
    videoPreviewRef,
    recordedChunks
  };
}
