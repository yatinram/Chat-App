import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../constants/api';

export const callApi = {
  createCallRecord: async (payload) => {
    const { data } = await axiosInstance.post(ENDPOINTS.CALLS, payload);
    return data;
  },

  getCallHistory: async () => {
    const { data } = await axiosInstance.get(ENDPOINTS.CALL_HISTORY);
    return data;
  },
};
