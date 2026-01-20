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

  // Lấy top stories theo thời gian
  getTopStories: (period: 'day' | 'week' | 'month', page = 0, size = 20) =>
    apiClient.get('/stories/top', { params: { period, page, size } }),

  advancedSearch: (params: {
    include?: string[];
    exclude?: string[];
    minChapters?: number;
    status?: string;
    sort?: string;
    page?: number; // Thêm dòng này
    size?: number; // Thêm dòng này
  }) => {
    // Chuyển mảng thành chuỗi phân cách bằng dấu phẩy để Spring Boot dễ nhận diện hoặc để Axios tự xử lý
    return apiClient.get('/stories/advanced-search', {
      params: {
        ...params,
        include: params.include?.join(','),
        exclude: params.exclude?.join(',')
      }
    });
  }
};