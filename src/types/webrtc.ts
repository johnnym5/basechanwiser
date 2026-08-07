export interface WebRTCCall {
  id: string;
  callerId: string;
  calleeId: string;
  callerName: string;
  status: 'ringing' | 'connected' | 'ended' | 'rejected';
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  createdAt: any;
}

export interface IceCandidate {
  candidate: string;
  sdpMid: string;
  sdpMLineIndex: number;
}
