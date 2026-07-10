import axios from 'axios';
import { API_URL } from '../constants/api';
import storageService from '../services/storageService';

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor — attach JWT token automatically
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await storageService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor — handle 401 globally
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired — clear storage
      await storageService.clearAll();
    }
    return Promise.reject(error);
  },
);


export default axiosInstance;
