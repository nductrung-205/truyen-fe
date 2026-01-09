import { apiClient } from './api';

export const categoryService = {
  // Lấy tất cả thể loại
  getAllCategories: () => apiClient.get('/categories'),
  
  // Lấy chi tiết thể loại
  getCategoryById: (id: number) => apiClient.get(`/categories/${id}`),
};