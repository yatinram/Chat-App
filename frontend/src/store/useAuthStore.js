import { create } from 'zustand';
import { authApi } from '../api/authApi';
import storageService from '../services/storageService';
import socketService from '../services/socketService';
import notificationService from '../services/notificationService';

const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  otherUser: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  // Initialize from persisted storage
  initAuth: async () => {
    try {
      const token = await storageService.getToken();
      if (!token) return;

      // Validate token by calling /me before trusting local storage
      try {
        const meRes = await authApi.getMe();
        if (!meRes.success) {
          await storageService.clearAll();
          return;
        }

        const meUser = meRes.user;
        await storageService.saveUser(meUser);
        set({ token, user: meUser, isAuthenticated: true });

        // Connect socket only after token is validated
        socketService.connect(token);

        // Fetch other user
        const res = await authApi.getOtherUser();
        if (res.success) set({ otherUser: res.user });

        // Initialize and sync push notifications
        notificationService.initNotifications(true).catch(() => { });
      } catch (innerErr) {
        console.error('Auth init error:', innerErr);
        // On 401/429 clear stored auth to avoid retry storms
        const status = innerErr.response?.status;
        if (status === 401 || status === 429) {
          await storageService.clearAll();
          set({ token: null, user: null, isAuthenticated: false });
        }
      }
    } catch (err) {
      console.error('Auth init failed:', err);
    }
  },

  // Login action
  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(username, password);
      if (res.success) {
        const { token, user } = res;
        await storageService.saveToken(token);
        await storageService.saveUser(user);

        // Connect socket with token
        socketService.connect(token);

        // Get the other user
        const otherRes = await authApi.getOtherUser();
        const otherUser = otherRes.success ? otherRes.user : null;

        set({
          token,
          user,
          otherUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Sync push notifications on background
        notificationService.initNotifications(true).catch(() => { });

        return { success: true };
      } else {
        const errMsg = res?.message || 'Login failed';
        set({ isLoading: false, error: errMsg });
        return { success: false, message: errMsg };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  // Logout action
  logout: async () => {
    socketService.disconnect();
    await storageService.clearAll();
    set({
      token: null,
      user: null,
      otherUser: null,
      isAuthenticated: false,
      error: null,
    });
  },

  // Update other user's online status
  updateOtherUserStatus: (isOnline, lastSeen) => {
    set((state) => ({
      otherUser: state.otherUser
        ? { ...state.otherUser, isOnline, lastSeen: lastSeen || state.otherUser.lastSeen }
        : null,
    }));
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
