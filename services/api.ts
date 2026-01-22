import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.1.14:8080/api';
const USER_KEY = '@user';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Interceptor: Gửi username thay vì token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      if (userData) {
        const user = JSON.parse(userData);
        // Gửi username qua header
        config.headers['X-User'] = user.username;
      }
    } catch (error) {
      console.error('Error getting user:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);