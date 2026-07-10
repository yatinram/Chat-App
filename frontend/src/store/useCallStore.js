import { create } from 'zustand';

const useCallStore = create((set) => ({
  // Incoming call state
  incomingCall: null, // { callerId, callerName, type, callId }
  
  // Active call state
  activeCall: null,   // { callId, targetId, targetName, type, isOutgoing }
  callStatus: 'idle', // 'idle' | 'ringing' | 'connecting' | 'active' | 'ended'
  callDuration: 0,    // seconds
  
  // Media controls
  isMuted: false,
  isCameraOff: false,
  isSpeakerOn: true,

  // Set incoming call
  setIncomingCall: (call) => set({ incomingCall: call, callStatus: 'ringing' }),
  clearIncomingCall: () => set({ incomingCall: null }),

  // Set active call
  setActiveCall: (call) => set({ activeCall: call, callStatus: 'connecting' }),
  setCallActive: () => set({ callStatus: 'active' }),
  setCallEnded: () =>
    set({
      activeCall: null,
      incomingCall: null,
      callStatus: 'idle',
      callDuration: 0,
      isMuted: false,
      isCameraOff: false,
    }),

  // Media toggles
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleCamera: () => set((state) => ({ isCameraOff: !state.isCameraOff })),
  toggleSpeaker: () => set((state) => ({ isSpeakerOn: !state.isSpeakerOn })),

  // Increment call timer
  incrementDuration: () => set((state) => ({ callDuration: state.callDuration + 1 })),
}));

export default useCallStore;
