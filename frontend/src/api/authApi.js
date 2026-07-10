import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../constants/api';

export const authApi = {
  login: async (username, password) => {
    const { data } = await axiosInstance.post(ENDPOINTS.LOGIN, { username, password });
    return data;
  },

  getMe: async () => {
    const { data } = await axiosInstance.get(ENDPOINTS.ME);
    return data;
  },

  getOtherUser: async () => {
    const { data } = await axiosInstance.get(ENDPOINTS.OTHER_USER);
    return data;
  },

  updateFcmToken: async (fcmToken) => {
    const { data } = await axiosInstance.post(ENDPOINTS.FCM_TOKEN, { fcmToken });
    return data;
  },
};
