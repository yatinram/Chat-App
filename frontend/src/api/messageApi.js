import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../constants/api';

export const messageApi = {
  getMessages: async (userId, cursor = null, limit = 30) => {
    const params = { limit };
    if (cursor) params.cursor = cursor;
    const { data } = await axiosInstance.get(ENDPOINTS.MESSAGES(userId), { params });
    return data;
  },

  editMessage: async (messageId, content) => {
    const { data } = await axiosInstance.put(ENDPOINTS.EDIT_MESSAGE(messageId), { content });
    return data;
  },

  deleteMessage: async (messageId, scope = 'me') => {
    const { data } = await axiosInstance.delete(ENDPOINTS.DELETE_MESSAGE(messageId), {
      params: { scope },
    });
    return data;
  },

  deleteFullChat: async (userId) => {
    const { data } = await axiosInstance.delete(ENDPOINTS.DELETE_CHAT(userId));
    return data;
  },

  searchMessages: async (q, userId) => {
    const { data } = await axiosInstance.get(ENDPOINTS.SEARCH_MESSAGES, {
      params: { q, userId },
    });
    return data;
  },
};
