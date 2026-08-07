"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { db } from '@/lib/firebase/config';
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  addDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export function useWebRTC(studentId: string | null, isCaller: boolean) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callId, setActiveCallId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'ringing' | 'connected' | 'ended'>('idle');

  const pc = useRef<RTCPeerConnection | null>(null);

  const setupMedia = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);
    return stream;
  }, []);

  const startCall = async (callerId: string, callerName: string) => {
    if (!studentId) return;

    const stream = await setupMedia();
    pc.current = new RTCPeerConnection(servers);

    const remote = new MediaStream();
    setRemoteStream(remote);

    stream.getTracks().forEach((track) => {
      pc.current?.addTrack(track, stream);
    });

    pc.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remote.addTrack(track);
      });
    };

    const callDoc = doc(collection(db, 'calls'));
    const offerCandidates = collection(callDoc, 'callerCandidates');
    const answerCandidates = collection(callDoc, 'calleeCandidates');

    setActiveCallId(callDoc.id);

    pc.current.onicecandidate = (event) => {
      event.candidate && addDoc(offerCandidates, event.candidate.toJSON());
    };

    const offerDescription = await pc.current.createOffer();
    await pc.current.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await setDoc(callDoc, {
      offer,
      status: 'ringing',
      callerId,
      calleeId: studentId,
      callerName,
      createdAt: serverTimestamp()
    });

    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (!pc.current?.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.current?.setRemoteDescription(answerDescription);
        setStatus('connected');
      }
      if (data?.status === 'ended') {
        cleanup();
      }
    });

    onSnapshot(answerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.current?.addIceCandidate(candidate);
        }
      });
    });
  };

  const joinCall = async (incomingCallId: string) => {
    const stream = await setupMedia();
    pc.current = new RTCPeerConnection(servers);

    const remote = new MediaStream();
    setRemoteStream(remote);

    stream.getTracks().forEach((track) => {
      pc.current?.addTrack(track, stream);
    });

    pc.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remote.addTrack(track);
      });
    };

    const callDoc = doc(db, 'calls', incomingCallId);
    const offerCandidates = collection(callDoc, 'callerCandidates');
    const answerCandidates = collection(callDoc, 'calleeCandidates');

    setActiveCallId(incomingCallId);

    pc.current.onicecandidate = (event) => {
      event.candidate && addDoc(answerCandidates, event.candidate.toJSON());
    };

    const callData = (await getDoc(callDoc)).data();

    const offerDescription = callData?.offer;
    await pc.current.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.current.createAnswer();
    await pc.current.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await updateDoc(callDoc, { answer, status: 'connected' });
    setStatus('connected');

    onSnapshot(offerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          let data = change.doc.data();
          pc.current?.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });

    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (data?.status === 'ended') {
        cleanup();
      }
    });
  };

  const endCall = async () => {
    if (callId) {
      await updateDoc(doc(db, 'calls', callId), { status: 'ended' });
    }
    cleanup();
  };

  const cleanup = () => {
    pc.current?.close();
    localStream?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setStatus('ended');
    setActiveCallId(null);
  };

  return {
    localStream,
    remoteStream,
    status,
    callId,
    startCall,
    joinCall,
    endCall
  };
}
