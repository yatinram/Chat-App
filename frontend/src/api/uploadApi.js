import axiosInstance from './axiosInstance';
import { API_URL } from '../constants/api';
import storageService from '../services/storageService';

export const uploadApi = {
  uploadMedia: async (fileObj) => {
    // fileObj: { uri, name, type }
    const formData = new FormData();
    formData.append('media', {
      uri: fileObj.uri,
      name: fileObj.name || 'upload',
      type: fileObj.type || 'application/octet-stream',
    });

    const token = await storageService.getToken();

    const { data } = await axiosInstance.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
      timeout: 60000, // 60s for uploads
    });

    return data;
  },
};
