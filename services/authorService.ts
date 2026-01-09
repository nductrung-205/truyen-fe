import { apiClient } from './api';

export const authorService = {
  // Lấy danh sách tác giả
  getAllAuthors: () => apiClient.get('/authors'),
  
  // Lấy chi tiết tác giả và danh sách truyện của tác giả
  getAuthorById: (id: number) => apiClient.get(`/authors/${id}`),
};