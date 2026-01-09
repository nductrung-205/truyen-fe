import { apiClient } from './api';

export const storyService = {
  // Lấy tất cả truyện (có phân trang)
  getAllStories: (page = 0, size = 20, sortBy = 'createdAt') =>
    apiClient.get('/stories', { params: { page, size, sortBy } }),
  
  // Lấy truyện hot (xem nhiều nhất)
  getHotStories: () => apiClient.get('/stories/hot'),
  
  // Lấy chi tiết truyện
  getStoryDetail: (id: number) => apiClient.get(`/stories/${id}`),
  
  // Tìm kiếm truyện theo tên
  searchStories: (keyword: string) =>
    apiClient.get('/stories/search', { params: { keyword } }),
  
  // Lọc truyện theo thể loại
  getStoriesByCategory: (slug: string) =>
    apiClient.get(`/stories/category/${slug}`),
};