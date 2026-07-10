import { useEffect, useRef, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import socketService from '../services/socketService';
import webrtcService from '../services/webrtcService';
import { callApi } from '../api/callApi';
import useCallStore from '../store/useCallStore';
import useAuthStore from '../store/useAuthStore';
import { SOCKET_EVENTS } from '../constants/socketEvents';

/**
 * useCallManager — manages WebRTC call lifecycle
 */
const useCallManager = () => {
  const navigation = useNavigation();
  const {
    activeCall,
    setActiveCall,
    setCallActive,
    setCallEnded,
    clearIncomingCall,
    toggleMute: storeMute,
    toggleCamera: storeCamera,
    isMuted,
    isCameraOff,
  } = useCallStore();
  const { user } = useAuthStore();
  const callStartTime = useRef(null);
  const durationTimer = useRef(null);
  const { incrementDuration } = useCallStore();

  // Start call duration timer
  const startTimer = () => {
    callStartTime.current = new Date();
    durationTimer.current = setInterval(() => {
      incrementDuration();
    }, 1000);
  };

  // Stop timer and return duration in seconds
  const stopTimer = () => {
    if (durationTimer.current) {
      clearInterval(durationTimer.current);
      durationTimer.current = null;
    }
    if (callStartTime.current) {
      return Math.round((new Date() - callStartTime.current) / 1000);
    }
    return 0;
  };

  // Initiate outgoing call
  const initiateCall = useCallback(async (targetId, targetName, type = 'voice') => {
    const callId = `call_${Date.now()}`;
    try {
      // Get local media
      await webrtcService.getLocalStream(type === 'video');

      // Notify server
      socketService.emit(SOCKET_EVENTS.CALL_INITIATE, { receiverId: targetId, type, callId }, (res) => {
        if (res?.success) {
          setActiveCall({ callId, targetId, targetName, type, isOutgoing: true });
          navigation.navigate('ActiveCall', { callId, targetId, targetName, type, isOutgoing: true });
        }
      });
    } catch (err) {
      console.error('Failed to initiate call:', err);
    }
  }, [navigation]);

  // Accept incoming call
  const acceptCall = useCallback(async (incomingCall) => {
    const { callId, callerId, callerName, type } = incomingCall;
    clearIncomingCall();
    try {
      await webrtcService.getLocalStream(type === 'video');
      socketService.emit(SOCKET_EVENTS.CALL_ACCEPT, { callerId, callId });
      setActiveCall({ callId, targetId: callerId, targetName: callerName, type, isOutgoing: false });
      navigation.navigate('ActiveCall', { callId, targetId: callerId, targetName: callerName, type, isOutgoing: false });
    } catch (err) {
      console.error('Failed to accept call:', err);
    }
  }, [navigation]);

  // Reject incoming call
  const rejectCall = useCallback((incomingCall) => {
    const { callId, callerId } = incomingCall;
    socketService.emit(SOCKET_EVENTS.CALL_REJECT, { callerId, callId });
    clearIncomingCall();
    // Record missed call
    callApi.createCallRecord({
      receiverId: user.id,
      type: incomingCall.type,
      status: 'rejected',
    }).catch(() => {});
  }, [user]);

  // End active call
  const endCall = useCallback(async () => {
    const duration = stopTimer();
    if (activeCall) {
      socketService.emit(SOCKET_EVENTS.CALL_END, {
        targetId: activeCall.targetId,
        callId: activeCall.callId,
      });
      // Save call record
      callApi.createCallRecord({
        receiverId: activeCall.targetId,
        type: activeCall.type,
        status: 'answered',
        startTime: callStartTime.current?.toISOString(),
        endTime: new Date().toISOString(),
      }).catch(() => {});
    }
    webrtcService.endCall();
    setCallEnded();
    navigation.goBack();
  }, [activeCall, navigation]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    webrtcService.toggleMute(!isMuted);
    storeMute();
  }, [isMuted]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    webrtcService.toggleCamera(!isCameraOff);
    storeCamera();
  }, [isCameraOff]);

  // Switch camera
  const switchCamera = useCallback(() => {
    webrtcService.switchCamera();
  }, []);

  return {
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    switchCamera,
    startTimer,
  };
};

export default useCallManager;
