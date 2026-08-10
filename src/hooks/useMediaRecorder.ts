import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useMediaRecorder: Enterprise-grade media capture hook.
 * Optimized for bandwidth (720p @ 1.5Mbps) and real-time audio visualization.
 */
export function useMediaRecorder() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0); // Real-time volume level (0-100)

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const cleanupAudio = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    setVolume(0);
  }, []);

  const getPermissions = useCallback(async () => {
    try {
      // Bandwidth Optimization: Strictly request 720p ideal resolution
      const userStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 24 } // Cinematic/bandwidth efficient
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
      });

      setStream(userStream);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = userStream;
      }

      // Initialize Real-time Mic Visualizer logic
      cleanupAudio();
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioCtx();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(userStream);
      source.connect(analyser);
      analyser.fftSize = 256;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      analyserRef.current = analyser;
      audioContextRef.current = audioContext;

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Map average (0-255) to a visible percentage (0-100) with a sensitivity curve
        const level = Math.min(100, Math.round((average / 128) * 100));
        setVolume(level);
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();

      return userStream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      return null;
    }
  }, [cleanupAudio]);

  const startRecording = useCallback(async (options?: { lowBandwidth?: boolean }) => {
    try {
      let currentStream = stream;
      if (!currentStream) {
        currentStream = await getPermissions();
      }
      if (!currentStream) return false;

      // Bandwidth Optimization: Throttle bitrate to 1.5Mbps (or 0.25Mbps for low-bandwidth mode)
      // Fallback mimeTypes for cross-browser support (Chrome/Edge vs Safari)
      const mimeTypes = ['video/webm;codecs=vp8,opus', 'video/mp4', 'video/quicktime'];
      const selectedMime = mimeTypes.find(m => MediaRecorder.isTypeSupported(m));

      const mediaRecorder = new MediaRecorder(currentStream, {
        mimeType: selectedMime,
        videoBitsPerSecond: options?.lowBandwidth ? 250000 : 1500000, // strictly enforced 1.5Mbps
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        setRecordedChunks(chunks);
      };

      mediaRecorder.start(1000); // Capture data every second for resilience
      setRecorder(mediaRecorder);
      setIsRecording(true);
      return true;
    } catch (err) {
      console.error("Recording initialization failed:", err);
      return false;
    }
  }, [stream, getPermissions]);

  const stopRecording = useCallback(() => {
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    cleanupAudio();
    setIsRecording(false);
    setStream(null);
  }, [recorder, stream, cleanupAudio]);

  const getBlob = useCallback(() => {
    if (recordedChunks.length === 0) return null;
    return new Blob(recordedChunks, { type: recorder?.mimeType || 'video/webm' });
  }, [recordedChunks, recorder]);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return {
    stream,
    isRecording,
    volume,
    getPermissions,
    startRecording,
    stopRecording,
    getBlob,
    videoPreviewRef,
    recordedChunks
  };
}
