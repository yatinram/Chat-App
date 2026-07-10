import { create } from 'zustand';
import { messageApi } from '../api/messageApi';

const useChatStore = create((set, get) => ({
  messages: [],
  hasMore: true,
  nextCursor: null,
  isLoading: false,
  isLoadingMore: false,
  isSending: false,
  replyTo: null, // message being replied to
  error: null,

  // Load initial messages
  loadMessages: async (userId) => {
    set({ isLoading: true, error: null, messages: [], hasMore: true, nextCursor: null });
    try {
      const res = await messageApi.getMessages(userId);
      if (res.success) {
        set({
          messages: res.messages,
          hasMore: res.hasMore,
          nextCursor: res.nextCursor,
          isLoading: false,
        });
      } else {
        set({ isLoading: false, error: res.message || 'Failed to load messages' });
      }
    } catch (err) {
      set({ isLoading: false, error: 'Failed to load messages' });
    }
  },

  // Load older messages (pagination)
  loadMoreMessages: async (userId) => {
    const { hasMore, nextCursor, isLoadingMore } = get();
    if (!hasMore || isLoadingMore) return;

    set({ isLoadingMore: true });
    try {
      const res = await messageApi.getMessages(userId, nextCursor);
      if (res.success) {
        set((state) => ({
          messages: [...res.messages, ...state.messages],
          hasMore: res.hasMore,
          nextCursor: res.nextCursor,
          isLoadingMore: false,
        }));
      }
    } catch (err) {
      set({ isLoadingMore: false });
    }
  },

  // Add a new incoming/outgoing message
  addMessage: (message) => {
    set((state) => {
      // Prevent duplicate messages
      const exists = state.messages.some((m) => m.id === message.id);
      if (exists) return state;
      return { messages: [...state.messages, message] };
    });
  },

  // Update a message (edit, status, reactions)
  updateMessage: (messageId, updates) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, ...updates } : m,
      ),
    }));
  },

  // Mark message as deleted
  deleteMessageLocally: (messageId, scope, currentUserId) => {
    set((state) => {
      if (scope === 'both') {
        return {
          messages: state.messages.map((m) =>
            m.id === messageId ? { ...m, isDeleted: true, content: null, mediaUrl: null } : m
          ),
        };
      } else {
        // scope === 'me' - remove completely from messages list
        return {
          messages: state.messages.filter((m) => m.id !== messageId),
        };
      }
    });
  },

  // Update message status (sent→delivered→seen)
  updateMessageStatus: (messageId, status) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, status } : m,
      ),
    }));
  },

  // Set reply target
  setReplyTo: (message) => set({ replyTo: message }),
  clearReplyTo: () => set({ replyTo: null }),

  // Clear chat
  clearMessages: () =>
    set({ messages: [], hasMore: true, nextCursor: null, replyTo: null }),

  clearError: () => set({ error: null }),
}));

export default useChatStore;
