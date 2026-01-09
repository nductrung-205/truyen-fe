import { apiClient } from './api';

export const chapterService = {
  // Lấy danh sách chapter của 1 truyện
  getChapters: (storyId: number) =>
    apiClient.get(`/stories/${storyId}/chapters`),
  
  // Lấy nội dung chapter cụ thể (tự động tăng view)
  getChapterContent: (storyId: number, chapterNumber: number) =>
    apiClient.get(`/stories/${storyId}/chapters/${chapterNumber}`),
};