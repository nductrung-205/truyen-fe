// Export tất cả types để import dễ dàng
export * from './story';
export * from './chapter';
export * from './category';
export * from './author';

// Có thể thêm các types chung khác
export interface ApiError {
  message: string;
  statusCode: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}