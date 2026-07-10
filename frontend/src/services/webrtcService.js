import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
} from 'react-native-webrtc';
import socketService from './socketService';
import { SOCKET_EVENTS } from '../constants/socketEvents';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

let peerConnection = null;
let localStream = null;

const webrtcService = {
  /**
   * Get user media (camera + mic or mic only)
   */
  getLocalStream: async (isVideo = false) => {
    const constraints = {
      audio: true,
      video: isVideo
        ? {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        : false,
    };

    try {
      localStream = await mediaDevices.getUserMedia(constraints);
      return localStream;
    } catch (err) {
      console.error('Failed to get local stream:', err);
      throw err;
    }
  },

  /**
   * Create RTCPeerConnection and attach local stream
   */
  createPeerConnection: (onRemoteStream, onIceCandidate) => {
    peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        onRemoteStream && onRemoteStream(event.streams[0]);
      }
    };

    // ICE candidate handler — send to other peer via socket
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate && onIceCandidate(event.candidate);
      }
    };

    return peerConnection;
  },

  /**
   * Create SDP offer (caller side)
   */
  createOffer: async (targetId) => {
    if (!peerConnection) return;

    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await peerConnection.setLocalDescription(offer);

    socketService.emit(SOCKET_EVENTS.CALL_WEBRTC_SIGNAL, {
      targetId,
      signal: { type: 'offer', sdp: offer.sdp },
    });

    return offer;
  },

  /**
   * Create SDP answer (receiver side)
   */
  createAnswer: async (targetId, offerSdp) => {
    if (!peerConnection) return;

    await peerConnection.setRemoteDescription(
      new RTCSessionDescription({ type: 'offer', sdp: offerSdp }),
    );

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socketService.emit(SOCKET_EVENTS.CALL_WEBRTC_SIGNAL, {
      targetId,
      signal: { type: 'answer', sdp: answer.sdp },
    });

    return answer;
  },

  /**
   * Handle incoming SDP answer (caller side)
   */
  handleAnswer: async (answerSdp) => {
    if (!peerConnection) return;
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription({ type: 'answer', sdp: answerSdp }),
    );
  },

  /**
   * Add ICE candidate received from remote
   */
  addIceCandidate: async (candidate) => {
    if (!peerConnection) return;
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('Failed to add ICE candidate:', err);
    }
  },

  /**
   * Toggle microphone mute
   */
  toggleMute: (isMuted) => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  },

  /**
   * Toggle camera on/off
   */
  toggleCamera: (isCameraOff) => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOff;
      });
    }
  },

  /**
   * Flip between front/rear camera
   */
  switchCamera: () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track._switchCamera && track._switchCamera();
      });
    }
  },

  /**
   * End the call — close PC and release streams
   */
  endCall: () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      localStream = null;
    }
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
  },

  getLocalStreamInstance: () => localStream,
  getPeerConnection: () => peerConnection,
};

export default webrtcService;
