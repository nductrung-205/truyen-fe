import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';
import { LoginRequest, RegisterRequest, AuthResponse, UserProfile } from '@/types/auth';

const USER_KEY = '@user';

export const authService = {
  sendRegistrationOtp: async (email: string) => {
    return apiClient.post('/auth/register/send-otp', { email });
  },

  register: (data: RegisterRequest) => {
    return apiClient.post('/auth/register', data);
  },

  login: async (data: LoginRequest) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    if (response.data) {
      // ✅ Chỉ lưu user, không cần token
      await authService.saveUser(response.data);
    }
    return response;
  },

  sendForgotPasswordOtp: async (email: string) => {
    return apiClient.post('/auth/forgot-password/send-otp', { email });
  },

  resetPassword: async (data: { email: string; otp: string; newPassword: string }) => {
    return apiClient.post('/auth/forgot-password/reset', data);
  },

  getCurrentUser: async (userId: number) => {
    return await apiClient.get(`/users/${userId}`);
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem(USER_KEY);
      console.log("Đã xóa dữ liệu user");
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    }
  },

  saveUser: async (user: AuthResponse) => {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  },

  getStoredUser: async (): Promise<UserProfile | null> => {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    const user = await authService.getStoredUser();
    return user !== null;
  },

  getOtpRemainingTime: async (email: string) => {
    return apiClient.get<{ remainingSeconds: number; isValid: boolean }>(
      `/auth/otp-remaining-time`,
      { params: { email } }
    );
  },

  checkIn: async (userId: number) => {
    const response = await apiClient.post(`/users/check-in/${userId}`);
    if (response.data) {
      const currentUser = await authService.getStoredUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...response.data };
        await authService.saveUser(updatedUser);
      }
    }
    return response;
  },
};