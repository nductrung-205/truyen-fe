export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username?: string;
  email: string;
  password: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface AuthResponse {
  id: number;
  username: string;
  email: string;
  avatarUrl: string;
  role: string;
  message?: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatarUrl: string;
  role: string;
}