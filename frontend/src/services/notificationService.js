import { Platform } from 'react-native';
import { authApi } from '../api/authApi';
import storageService from './storageService';

// Fallback Mock FCM Token if Firebase is not yet configured with google-services.json
const MOCK_FCM_TOKEN = 'mock_fcm_token_yatin_naiya_chat_app_2026';

const notificationService = {
  /**
   * Request push notification permission and get token
   */
  initNotifications: async (isAuthenticated) => {
    try {
      console.log('🔔 Initializing notification service...');

      // Dynamic import to prevent crash if native config is not loaded yet
      let messaging;
      try {
        const firebaseMessaging = require('@react-native-firebase/messaging').default;
        messaging = firebaseMessaging();
      } catch (e) {
        console.log('ℹ️ Firebase Messaging module not linked or configured. Using mock notifications.');
      }

      let token = MOCK_FCM_TOKEN;

      if (messaging) {
        // Request permissions (especially required for iOS and Android 13+)
        const authStatus = await messaging.requestPermission();
        const enabled =
          authStatus === 1 || // AUTHORIZED
          authStatus === 2;   // PROVISIONAL

        if (enabled) {
          console.log('✅ Notification permission granted.');
          try {
            token = await messaging.getToken();
            console.log('🔑 FCM Device Token:', token);
          } catch (tokenErr) {
            console.warn('⚠️ Could not fetch real FCM token, using fallback:', tokenErr.message);
          }
        } else {
          console.log('❌ Notification permission denied.');
        }
      }

      // Save FCM token in AsyncStorage (separate key from auth JWT token)
      await storageService.saveFcmToken(token);

      // If user is authenticated, sync with server
      if (isAuthenticated && token) {
        await notificationService.syncTokenWithServer(token);
      }

      // Setup listeners if messaging is active
      if (messaging) {
        notificationService.setupNotificationListeners(messaging);
      }

      return token;
    } catch (err) {
      console.error('❌ Failed to initialize notifications:', err);
      return MOCK_FCM_TOKEN;
    }
  },

  /**
   * Send the current FCM token to the backend
   */
  syncTokenWithServer: async (token) => {
    try {
      const activeToken = token || (await storageService.getFcmToken());
      if (!activeToken) return;

      console.log('📡 Syncing FCM token with backend...');
      await authApi.updateFcmToken(activeToken);
      console.log('✅ FCM token updated successfully on server.');
    } catch (err) {
      console.error('❌ Failed to sync FCM token with server:', err.message);
    }
  },

  /**
   * Foreground and Background event listeners
   */
  setupNotificationListeners: (messagingInstance) => {
    // 1. Foreground message handler
    const unsubscribeForeground = messagingInstance.onMessage(async (remoteMessage) => {
      console.log('📩 Foreground notification received:', remoteMessage);
      // Custom handling (e.g. show inside-app banner or trigger alerts)
    });

    // 2. Token refresh handler
    const unsubscribeTokenRefresh = messagingInstance.onTokenRefresh(async (newToken) => {
      console.log('🔑 FCM Token refreshed:', newToken);
      await notificationService.syncTokenWithServer(newToken);
    });

    return () => {
      unsubscribeForeground();
      unsubscribeTokenRefresh();
    };
  },
};

export default notificationService;