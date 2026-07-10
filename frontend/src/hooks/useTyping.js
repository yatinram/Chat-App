import { useCallback, useRef } from 'react';
import socketService from '../services/socketService';
import { SOCKET_EVENTS } from '../constants/socketEvents';

const TYPING_DEBOUNCE_MS = 1000;

/**
 * useTyping — emits typing / stop_typing events with debounce
 */
const useTyping = (receiverId) => {
  const typingTimer = useRef(null);
  const isTyping = useRef(false);

  const onTyping = useCallback(() => {
    if (!isTyping.current) {
      isTyping.current = true;
      socketService.emit(SOCKET_EVENTS.TYPING, { receiverId });
    }

    // Reset debounce timer
    if (typingTimer.current) clearTimeout(typingTimer.current);

    typingTimer.current = setTimeout(() => {
      isTyping.current = false;
      socketService.emit(SOCKET_EVENTS.STOP_TYPING, { receiverId });
    }, TYPING_DEBOUNCE_MS);
  }, [receiverId]);

  const onStopTyping = useCallback(() => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (isTyping.current) {
      isTyping.current = false;
      socketService.emit(SOCKET_EVENTS.STOP_TYPING, { receiverId });
    }
  }, [receiverId]);

  return { onTyping, onStopTyping };
};

export default useTyping;
