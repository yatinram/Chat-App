import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: '@chat_token',
  USER: '@chat_user',
  THEME: '@chat_theme',
  FCM_TOKEN: '@chat_fcm_token',
};

const storageService = {
  // Auth Token (JWT)
  saveToken: async (token) => {
    await AsyncStorage.setItem(KEYS.TOKEN, token);
  },
  getToken: async () => {
    return await AsyncStorage.getItem(KEYS.TOKEN);
  },
  removeToken: async () => {
    await AsyncStorage.removeItem(KEYS.TOKEN);
  },

  // FCM Token (separate from auth token — DO NOT mix with JWT)
  saveFcmToken: async (token) => {
    await AsyncStorage.setItem(KEYS.FCM_TOKEN, token);
  },
  getFcmToken: async () => {
    return await AsyncStorage.getItem(KEYS.FCM_TOKEN);
  },
  removeFcmToken: async () => {
    await AsyncStorage.removeItem(KEYS.FCM_TOKEN);
  },

  // User
  saveUser: async (user) => {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  },
  getUser: async () => {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },
  removeUser: async () => {
    await AsyncStorage.removeItem(KEYS.USER);
  },

  // Theme
  saveTheme: async (theme) => {
    await AsyncStorage.setItem(KEYS.THEME, theme);
  },
  getTheme: async () => {
    return await AsyncStorage.getItem(KEYS.THEME);
  },

  // Clear all
  clearAll: async () => {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },
};

export default storageService;