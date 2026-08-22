'use client';

import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * WebRTC Signaling via Supabase Realtime
 * 
 * Flow:
 * 1. Caller creates a channel: `call:{callerId}:{calleeId}`
 * 2. Caller sends 'offer' with SDP
 * 3. Callee joins channel, sends 'answer' with SDP
 * 4. Both exchange ICE candidates via 'ice' messages
 * 5. Connection established — audio/video flows P2P
 */

export interface SignalMessage {
  type: 'offer' | 'answer' | 'ice' | 'hangup' | 'reject';
  from: string;
  payload: any;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export class WebRTCSignaling {
  private channel: RealtimeChannel | null = null;
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private userId: string;
  private peerId: string;
  private onRemoteStream: (stream: MediaStream) => void;
  private onHangup: () => void;
  private onStateChange: (state: RTCPeerConnectionState) => void;

  constructor(params: {
    userId: string;
    peerId: string;
    onRemoteStream: (stream: MediaStream) => void;
    onHangup: () => void;
    onStateChange: (state: RTCPeerConnectionState) => void;
  }) {
    this.userId = params.userId;
    this.peerId = params.peerId;
    this.onRemoteStream = params.onRemoteStream;
    this.onHangup = params.onHangup;
    this.onStateChange = params.onStateChange;
  }

  /**
   * Initialize the signaling channel and PeerConnection
   */
  async init(callType: 'voice' | 'video'): Promise<MediaStream> {
    const supabase = createClient();

    // Get local media
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === 'video',
    });

    // Create peer connection
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add local tracks to PC
    this.localStream.getTracks().forEach(track => {
      this.pc!.addTrack(track, this.localStream!);
    });

    // Handle remote stream
    this.pc.ontrack = (event) => {
      if (event.streams[0]) {
        this.onRemoteStream(event.streams[0]);
      }
    };

    // Handle ICE candidates
    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.channel) {
        this.channel.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'ice', from: this.userId, payload: event.candidate.toJSON() },
        });
      }
    };

    // Handle connection state
    this.pc.onconnectionstatechange = () => {
      this.onStateChange(this.pc!.connectionState);
      if (this.pc!.connectionState === 'disconnected' || this.pc!.connectionState === 'failed') {
        this.onHangup();
      }
    };

    // Join signaling channel
    const channelName = [this.userId, this.peerId].sort().join(':');
    this.channel = supabase.channel(`call:${channelName}`);

    this.channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
      const msg = payload as SignalMessage;
      if (msg.from === this.userId) return; // Ignore own messages

      switch (msg.type) {
        case 'offer':
          await this.handleOffer(msg.payload);
          break;
        case 'answer':
          await this.handleAnswer(msg.payload);
          break;
        case 'ice':
          await this.handleIce(msg.payload);
          break;
        case 'hangup':
        case 'reject':
          this.onHangup();
          break;
      }
    });

    await this.channel.subscribe();

    return this.localStream;
  }

  /**
   * Initiate a call (caller side)
   */
  async call(): Promise<void> {
    if (!this.pc) return;
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    this.channel?.send({
      type: 'broadcast',
      event: 'signal',
      payload: { type: 'offer', from: this.userId, payload: offer },
    });
  }

  /**
   * Handle incoming offer (callee side)
   */
  private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) return;
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    this.channel?.send({
      type: 'broadcast',
      event: 'signal',
      payload: { type: 'answer', from: this.userId, payload: answer },
    });
  }

  /**
   * Handle incoming answer
   */
  private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) return;
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  /**
   * Handle incoming ICE candidate
   */
  private async handleIce(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.pc) return;
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {
      // Ignore ICE errors (non-critical)
    }
  }

  /**
   * Hang up the call
   */
  hangup(): void {
    this.channel?.send({
      type: 'broadcast',
      event: 'signal',
      payload: { type: 'hangup', from: this.userId, payload: null },
    });
    this.cleanup();
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return !audioTrack.enabled; // Returns true if muted
    }
    return false;
  }

  /**
   * Toggle video
   */
  toggleVideo(): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return !videoTrack.enabled; // Returns true if video off
    }
    return false;
  }

  /**
   * Clean up all resources
   */
  cleanup(): void {
    this.localStream?.getTracks().forEach(t => t.stop());
    this.pc?.close();
    this.channel?.unsubscribe();
    this.localStream = null;
    this.pc = null;
    this.channel = null;
  }
}
