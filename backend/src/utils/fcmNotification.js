const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let isFirebaseInitialized = false;

/**
 * Cleans and normalizes the Firebase private key coming from env variables.
 * Supports quoted strings, escaped newlines (\n), and actual newlines.
 */
function getCleanedPrivateKey(rawKey) {
  if (!rawKey) return null;

  let key = rawKey.trim();

  // Remove surrounding single or double quotes if present
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  // Convert any escaped newline characters into actual newlines
  key = key.replace(/\\r\\n/g, '\n');
  key = key.replace(/\\n/g, '\n');
  key = key.replace(/\\r/g, '\n');

  // Normalize CRLF and stray CR line endings
  key = key.replace(/\r\n/g, '\n');
  key = key.replace(/\r/g, '\n');

  return key.trim();
}

function loadFirebaseServiceAccount() {
  const pathFromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const jsonFromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (pathFromEnv) {
    const resolved = path.isAbsolute(pathFromEnv)
      ? pathFromEnv
      : path.resolve(process.cwd(), pathFromEnv);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Firebase service account file not found at path: ${resolved}`);
    }
    return JSON.parse(fs.readFileSync(resolved, 'utf8'));
  }

  if (jsonFromEnv) {
    return JSON.parse(jsonFromEnv);
  }

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    const privateKey = getCleanedPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    };
  }

  return null;
}

// Initialize Firebase Admin SDK
try {
  const serviceAccount = loadFirebaseServiceAccount();

  if (!serviceAccount) {
    console.warn('⚠️  Firebase credentials missing. Push notifications will be disabled.');
  } else {
    const privateKey = serviceAccount.privateKey;
    const beginMarker = '-----BEGIN PRIVATE KEY-----';
    const endMarker = '-----END PRIVATE KEY-----';

    if (!privateKey || !privateKey.includes(beginMarker) || !privateKey.includes(endMarker)) {
      throw new Error(
        'Firebase private key is invalid. Ensure FIREBASE_PRIVATE_KEY contains the full PEM key or use FIREBASE_SERVICE_ACCOUNT_JSON/PATH.'
      );
    }

    const bodyBetweenMarkers = privateKey
      .split(beginMarker)[1]
      .split(endMarker)[0];

    if (!bodyBetweenMarkers.includes('\n')) {
      throw new Error(
        'Firebase private key appears to be a single line. The \\n sequences were not converted into real newlines. Check your .env formatting.'
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    isFirebaseInitialized = true;
    console.log('✅ Firebase Admin initialized successfully');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
}

/**
 * Send push notification for a new message
 */
const sendMessageNotification = async (fcmToken, senderName, messageText, payload = {}) => {
  if (!isFirebaseInitialized || !fcmToken) return;

  const message = {
    token: fcmToken,
    notification: {
      title: senderName,
      body: messageText,
    },
    data: {
      type: 'message',
      click_action: 'FLUTTER_NOTIFICATION_CLICK', // standard fallback
      ...payload,
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'chat_messages',
        sound: 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Message notification sent successfully:', response);
  } catch (error) {
    console.error('❌ Error sending message notification:', error);
  }
};

/**
 * Send push notification for an incoming call (high priority, ringing)
 */
const sendCallNotification = async (fcmToken, callerName, callType, callId, payload = {}) => {
  if (!isFirebaseInitialized || !fcmToken) return;

  const message = {
    token: fcmToken,
    // Note: for data-only message (silent notification that wakes up app to show full-screen call ringing UI)
    data: {
      type: 'call',
      callerName: callerName,
      callType: callType, // 'voice' or 'video'
      callId: callId,
      ...payload,
    },
    android: {
      priority: 'high',
      // Include time to live: calls expire quickly (e.g. 30 seconds)
      ttl: 30 * 1000,
    },
    apns: {
      headers: {
        'apns-priority': '10',
        'apns-expiration': `${Math.floor(Date.now() / 1000) + 30}`,
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Call notification sent successfully:', response);
  } catch (error) {
    console.error('❌ Error sending call notification:', error);
  }
};

module.exports = {
  sendMessageNotification,
  sendCallNotification,
};