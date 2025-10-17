import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const backend_url = process.env.EXPO_PUBLIC_BACKEND_URL;

export const api = axios.create({
    baseURL: backend_url,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
})

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);