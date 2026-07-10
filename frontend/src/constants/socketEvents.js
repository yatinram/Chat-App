/**
 * Socket.io Event Name Constants
 */
export const SOCKET_EVENTS = {
  // Messaging
  SEND_MESSAGE: 'send_message',
  RECEIVE_MESSAGE: 'receive_message',
  TYPING: 'typing',
  STOP_TYPING: 'stop_typing',
  MESSAGE_SEEN: 'message_seen',
  MESSAGE_EDIT: 'message_edit',
  MESSAGE_DELETE: 'message_delete',
  MESSAGE_REACT: 'message_react',

  // User Presence
  USER_STATUS: 'user_status',

  // WebRTC Calls
  CALL_INITIATE: 'call_initiate',
  CALL_INCOMING: 'call_incoming',
  CALL_ACCEPT: 'call_accept',
  CALL_ACCEPTED: 'call_accepted',
  CALL_REJECT: 'call_reject',
  CALL_REJECTED: 'call_rejected',
  CALL_WEBRTC_SIGNAL: 'call_webrtc_signal',
  CALL_END: 'call_end',
  CALL_ENDED: 'call_ended',

  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
};
