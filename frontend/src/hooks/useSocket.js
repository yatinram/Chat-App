import { useEffect, useRef } from 'react';
import socketService from '../services/socketService';
import useChatStore from '../store/useChatStore';
import useAuthStore from '../store/useAuthStore';
import useCallStore from '../store/useCallStore';
import { SOCKET_EVENTS } from '../constants/socketEvents';

/**
 * useSocket — sets up all socket event listeners for the chat session.
 * Call this once in the ChatScreen or App root after authentication.
 */
const useSocket = () => {
  const { user } = useAuthStore();
  const { addMessage, updateMessage, deleteMessageLocally, updateMessageStatus } = useChatStore();
  const { updateOtherUserStatus } = useAuthStore();
  const { setIncomingCall } = useCallStore();
  const listenersAttached = useRef(false);

  useEffect(() => {
    if (!user || listenersAttached.current) return;
    listenersAttached.current = true;

    // ── Messaging Events ──────────────────────────────────

    // New message received
    const handleReceiveMessage = (message) => {
      addMessage(message);
    };

    // Edit notification
    const handleMessageEdit = ({ messageId, content }) => {
      updateMessage(messageId, { content, isEdited: true });
    };

    // Delete notification
    const handleMessageDelete = ({ messageId, scope }) => {
      deleteMessageLocally(messageId, scope, user.id);
    };

    // Reaction update
    const handleMessageReact = ({ messageId, reactions }) => {
      updateMessage(messageId, { reactions });
    };

    // Message seen update
    const handleMessageSeen = ({ messageId }) => {
      updateMessageStatus(messageId, 'seen');
    };

    // ── Presence Events ───────────────────────────────────
    const handleUserStatus = ({ userId, isOnline, lastSeen }) => {
      // Update the other user's online status
      updateOtherUserStatus(isOnline, lastSeen);
    };

    // ── Call Events ───────────────────────────────────────
    const handleCallIncoming = (data) => {
      setIncomingCall(data);
    };

    // Attach listeners
    socketService.on(SOCKET_EVENTS.RECEIVE_MESSAGE, handleReceiveMessage);
    socketService.on(SOCKET_EVENTS.MESSAGE_EDIT, handleMessageEdit);
    socketService.on(SOCKET_EVENTS.MESSAGE_DELETE, handleMessageDelete);
    socketService.on(SOCKET_EVENTS.MESSAGE_REACT, handleMessageReact);
    socketService.on(SOCKET_EVENTS.MESSAGE_SEEN, handleMessageSeen);
    socketService.on(SOCKET_EVENTS.USER_STATUS, handleUserStatus);
    socketService.on(SOCKET_EVENTS.CALL_INCOMING, handleCallIncoming);

    return () => {
      // Cleanup on unmount
      socketService.off(SOCKET_EVENTS.RECEIVE_MESSAGE, handleReceiveMessage);
      socketService.off(SOCKET_EVENTS.MESSAGE_EDIT, handleMessageEdit);
      socketService.off(SOCKET_EVENTS.MESSAGE_DELETE, handleMessageDelete);
      socketService.off(SOCKET_EVENTS.MESSAGE_REACT, handleMessageReact);
      socketService.off(SOCKET_EVENTS.MESSAGE_SEEN, handleMessageSeen);
      socketService.off(SOCKET_EVENTS.USER_STATUS, handleUserStatus);
      socketService.off(SOCKET_EVENTS.CALL_INCOMING, handleCallIncoming);
      listenersAttached.current = false;
    };
  }, [user]);
};

export default useSocket;
