import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import {
  RTCView,
} from 'react-native-webrtc';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Colors from '../../constants/colors';
import Avatar from '../../components/common/Avatar';
import webrtcService from '../../services/webrtcService';
import socketService from '../../services/socketService';
import { SOCKET_EVENTS } from '../../constants/socketEvents';
import useCallStore from '../../store/useCallStore';
import { callApi } from '../../api/callApi';

/**
 * ActiveCallScreen — WebRTC voice/video call UI
 */
const ActiveCallScreen = ({ navigation, route }) => {
  const {
    callId,
    targetId,
    targetName,
    type = 'voice',
    isOutgoing = true,
  } = route?.params || {};

  const isVideo = type === 'video';

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);

  const timerRef = useRef(null);
  const callStartRef = useRef(null);

  // ── Setup WebRTC ──────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      try {
        // Get local media
        const stream = await webrtcService.getLocalStream(isVideo);
        if (mounted) setLocalStream(stream);

        // Create peer connection
        webrtcService.createPeerConnection(
          (remStream) => {
            if (mounted) {
              setRemoteStream(remStream);
              setIsConnecting(false);
              startTimer();
            }
          },
          (candidate) => {
            // Send ICE candidate to peer
            socketService.emit(SOCKET_EVENTS.CALL_WEBRTC_SIGNAL, {
              targetId,
              signal: { type: 'candidate', candidate },
            });
          },
        );

        // If outgoing: create offer; if incoming: wait for offer
        if (isOutgoing) {
          await webrtcService.createOffer(targetId);
        }
      } catch (err) {
        console.error('WebRTC setup error:', err);
        handleEndCall();
      }
    };

    setup();

    // WebRTC signal handler (offer/answer/ICE)
    const handleSignal = async ({ senderId, signal }) => {
      try {
        if (signal.type === 'offer') {
          await webrtcService.createAnswer(senderId, signal.sdp);
        } else if (signal.type === 'answer') {
          await webrtcService.handleAnswer(signal.sdp);
        } else if (signal.type === 'candidate') {
          await webrtcService.addIceCandidate(signal.candidate);
        }
      } catch (err) {
        console.error('WebRTC signal handling error:', err);
      }
    };

    // Call ended by remote
    const handleCallEnded = ({ callId: endedCallId }) => {
      if (endedCallId === callId) {
        cleanup();
        navigation.goBack();
      }
    };

    socketService.on(SOCKET_EVENTS.CALL_WEBRTC_SIGNAL, handleSignal);
    socketService.on(SOCKET_EVENTS.CALL_ENDED, handleCallEnded);

    return () => {
      mounted = false;
      socketService.off(SOCKET_EVENTS.CALL_WEBRTC_SIGNAL, handleSignal);
      socketService.off(SOCKET_EVENTS.CALL_ENDED, handleCallEnded);
    };
  }, []);

  const startTimer = () => {
    callStartRef.current = new Date();
    timerRef.current = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
  };

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    webrtcService.endCall();
  };

  const handleEndCall = async () => {
    const endTime = new Date();
    const duration = callStartRef.current
      ? Math.round((endTime - callStartRef.current) / 1000)
      : 0;

    socketService.emit(SOCKET_EVENTS.CALL_END, { targetId, callId });

    // Save call record
    callApi.createCallRecord({
      receiverId: targetId,
      type,
      status: duration > 0 ? 'answered' : 'missed',
      startTime: callStartRef.current?.toISOString(),
      endTime: endTime.toISOString(),
    }).catch(() => {});

    cleanup();
    navigation.goBack();
  };

  const handleToggleMute = () => {
    webrtcService.toggleMute(isMuted);
    setIsMuted((m) => !m);
  };

  const handleToggleCamera = () => {
    webrtcService.toggleCamera(isCameraOff);
    setIsCameraOff((c) => !c);
  };

  const handleSwitchCamera = () => {
    webrtcService.switchCamera();
  };

  const formatDuration = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Remote video / voice background */}
      {isVideo && remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
        />
      ) : (
        <View style={styles.voiceBg}>
          <View style={styles.voiceGlow} />
          <Avatar name={targetName || ''} size={110} />
          <Text style={styles.voiceName}>{targetName}</Text>
        </View>
      )}

      {/* Local video PiP */}
      {isVideo && localStream && !isCameraOff && (
        <View style={styles.localVideoPip}>
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.localVideo}
            objectFit="cover"
            mirror={true}
          />
        </View>
      )}

      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.topName}>{targetName}</Text>
        <Text style={styles.topStatus}>
          {isConnecting ? 'Connecting...' : formatDuration(callDuration)}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Mute Card */}
        <TouchableOpacity
          style={[styles.controlCard, isMuted && styles.controlCardActive]}
          onPress={handleToggleMute}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isMuted ? 'mic-off-outline' : 'mic-outline'}
            size={24}
            color={isMuted ? '#FF4D67' : '#2D8CFF'}
          />
          <Text style={[styles.controlText, isMuted && styles.controlTextActive]}>
            {isMuted ? 'Muted' : 'Voice message'}
          </Text>
        </TouchableOpacity>

        {/* End Call Card */}
        <TouchableOpacity style={styles.endCallCard} onPress={handleEndCall} activeOpacity={0.8}>
          <View style={styles.iconContainerEnd}>
            <Ionicons name="call-outline" size={24} color="#FF4D67" style={{ transform: [{ rotate: '135deg' }] }} />
          </View>
          <Text style={styles.endCallText}>End call</Text>
        </TouchableOpacity>

        {/* Speaker / Camera Card */}
        {isVideo ? (
          <TouchableOpacity
            style={[styles.controlCard, isCameraOff && styles.controlCardActive]}
            onPress={handleToggleCamera}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isCameraOff ? 'videocam-off-outline' : 'videocam-outline'}
              size={24}
              color={isCameraOff ? '#FF4D67' : '#2D8CFF'}
            />
            <Text style={styles.controlText}>Camera</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.controlCard, !isSpeakerOn && styles.controlCardActive]}
            onPress={() => setIsSpeakerOn((s) => !s)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isSpeakerOn ? 'volume-high-outline' : 'volume-mute-outline'}
              size={24}
              color={isSpeakerOn ? '#2D8CFF' : '#FF4D67'}
            />
            <Text style={styles.controlText}>Speaker</Text>
          </TouchableOpacity>
        )}

        {/* Flip camera (video only) */}
        {isVideo && (
          <TouchableOpacity style={styles.controlCard} onPress={handleSwitchCamera} activeOpacity={0.8}>
            <Ionicons name="camera-reverse-outline" size={24} color="#2D8CFF" />
            <Text style={styles.controlText}>Flip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  remoteVideo: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  voiceBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
    gap: 20,
  },
  voiceGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: Colors.primaryGlow,
  },
  voiceName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  localVideoPip: {
    position: 'absolute',
    top: 100,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  localVideo: { width: '100%', height: '100%' },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 4,
  },
  topName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
  },
  topStatus: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontVariant: ['tabular-nums'],
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  controlCard: {
    width: 110,
    height: 85,
    borderRadius: 12,
    backgroundColor: '#1E2230',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  controlCardActive: {
    backgroundColor: '#2D3245',
    borderColor: 'rgba(45, 140, 255, 0.3)',
  },
  controlText: {
    fontSize: 11.5,
    color: '#8892A4',
    fontWeight: '500',
  },
  controlTextActive: {
    color: '#FF4D67',
  },
  endCallCard: {
    width: 110,
    height: 85,
    borderRadius: 12,
    backgroundColor: '#251215', // dark red tint
    borderWidth: 1,
    borderColor: '#3D1B1F',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  endCallText: {
    color: '#FF4D67',
    fontSize: 11.5,
    fontWeight: '600',
  },
  iconContainerEnd: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 77, 103, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ActiveCallScreen;
