import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';
import { LoginRequest, RegisterRequest, AuthResponse, UserProfile } from '@/types/auth';

const AUTH_TOKEN_KEY = '@auth_token';
const USER_KEY = '@user';

export const authService = {
  // ============ ĐĂNG KÝ (2 BƯỚC) ============

  // Bước 1: Gửi OTP để đăng ký tài khoản mới
  sendRegistrationOtp: async (email: string) => {
    return apiClient.post('/auth/register/send-otp', { email });
  },

  // Bước 2: Hoàn tất đăng ký (Xác thực OTP + Password)
  register: (data: RegisterRequest) => {
    return apiClient.post('/auth/register', data);
  },

  // ============ ĐĂNG NHẬP ============

  login: async (data: LoginRequest) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    if (response.data) {
      await authService.saveUser(response.data);
    }
    return response;
  },

  // ============ QUÊN MẬT KHẨU (2 BƯỚC) ============

  // Bước 1: Gửi OTP khôi phục mật khẩu
  sendForgotPasswordOtp: async (email: string) => {
    return apiClient.post('/auth/forgot-password/send-otp', { email });
  },

  // Bước 2: Xác thực OTP và đặt lại mật khẩu mới
  resetPassword: async (data: { email: string; otp: string; newPassword: string }) => {
    return apiClient.post('/auth/forgot-password/reset', data);
  },

  // ============ THÔNG TIN NGƯỜI DÙNG ============

  // Lấy thông tin user hiện tại từ Server
  getCurrentUser: (userId: number) => apiClient.get(`/auth/me/${userId}`),

  // Đăng xuất
  logout: async () => {
    try {
      await AsyncStorage.multiRemove([USER_KEY, AUTH_TOKEN_KEY]);
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

  // Kiểm tra trạng thái đăng nhập
  isAuthenticated: async (): Promise<boolean> => {
    const user = await authService.getStoredUser();
    return user !== null;
  },

  // ============ TIỆN ÍCH ============

  // Kiểm tra thời gian còn lại của OTP (Sử dụng email làm param)
  getOtpRemainingTime: async (email: string) => {
    return apiClient.get<{ remainingSeconds: number; isValid: boolean }>(
      `/auth/otp-remaining-time`, 
      { params: { email } } // Truyền ?email=...
    );
  },
};