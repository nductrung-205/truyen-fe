import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';
import { LoginRequest, RegisterRequest, AuthResponse, UserProfile } from '@/types/auth';

const AUTH_TOKEN_KEY = '@auth_token';
const USER_KEY = '@user';

export const authService = {
  // Đăng ký
  register: (data: RegisterRequest) => apiClient.post('/auth/register', data),

  // Đăng nhập
  login: async (data: LoginRequest) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    
    // Save user info to AsyncStorage
    if (response.data) {
      await authService.saveUser(response.data);
    }
    
    return response;
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: (userId: number) => apiClient.get(`/auth/me/${userId}`),

  // Đăng xuất
  logout: async () => {
    try {
      await AsyncStorage.removeItem('@user'); // Key bạn dùng để lưu thông tin user
      await AsyncStorage.removeItem('@auth_token'); // Xóa token nếu có
      console.log("Đã xóa dữ liệu user trong Storage");
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    }
  },
  
  // Lưu user vào storage
  saveUser: async (user: AuthResponse) => {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  },

  // Lấy user từ storage
  getStoredUser: async (): Promise<UserProfile | null> => {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  },

  // Check xem đã đăng nhập chưa
  isAuthenticated: async (): Promise<boolean> => {
    const user = await authService.getStoredUser();
    return user !== null;
  },
};