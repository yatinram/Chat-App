/**
 * API Endpoint Constants
 * For Android Emulator: use 10.0.2.2 instead of localhost
 * For Physical Device: use your machine's local IP e.g. 192.168.x.x
 */

export const BASE_URL = 'https://chat-app-p54m.onrender.com';

export const API_URL = `${BASE_URL}/api`;

export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  FCM_TOKEN: '/auth/fcm-token',
  ME: '/auth/me',
  OTHER_USER: '/auth/other-user',

  // Messages
  MESSAGES: (userId) => `/messages/${userId}`,
  EDIT_MESSAGE: (messageId) => `/messages/${messageId}`,
  DELETE_MESSAGE: (messageId) => `/messages/${messageId}`,
  DELETE_CHAT: (userId) => `/messages/chat/${userId}`,
  SEARCH_MESSAGES: '/messages/search',

  // Calls
  CALLS: '/calls',
  CALL_HISTORY: '/calls/history',

  // Upload
  UPLOAD: '/upload',
};

export const SOCKET_URL = BASE_URL;
