import { apiClient } from './api';

export const reviewService = {
  // Lấy danh sách đánh giá của một truyện
  getReviews: (storyId: number) => apiClient.get(`/reviews/${storyId}`),

  // Gửi đánh giá mới cho một truyện
  postReview: (storyId: number, reviewData: { rating: number; content: string }) =>
    apiClient.post(`/reviews/${storyId}`, reviewData),

  getMyReviews: (username: string) => apiClient.get(`/reviews/user/${username}`),
};