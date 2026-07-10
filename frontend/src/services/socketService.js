import { io } from 'socket.io-client';
import { SOCKET_URL } from '../constants/api';

let socket = null;

const socketService = {
  /**
   * Connect to Socket.io server with JWT auth token
   */
  connect: (token) => {
    if (!token) {
      console.warn('Socket connect skipped: no auth token provided');
      return null;
    }

    if (socket && socket.connected) {
      return socket;
    }

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
    });

    return socket;
  },

  /**
   * Disconnect from Socket.io server
   */
  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  /**
   * Get the current socket instance
   */
  getSocket: () => socket,

  /**
   * Emit an event to the server
   */
  emit: (event, data, callback) => {
    if (!socket || !socket.connected) {
      console.warn('Socket not connected, cannot emit:', event);
      return;
    }
    if (callback) {
      socket.emit(event, data, callback);
    } else {
      socket.emit(event, data);
    }
  },

  /**
   * Listen for an event from the server
   */
  on: (event, handler) => {
    if (!socket) return;
    socket.on(event, handler);
  },

  /**
   * Remove a specific event listener
   */
  off: (event, handler) => {
    if (!socket) return;
    if (handler) {
      socket.off(event, handler);
    } else {
      socket.off(event);
    }
  },

  /**
   * Check if socket is currently connected
   */
  isConnected: () => {
    return socket && socket.connected;
  },
};

export default socketService;
