import { apiClient } from './api';

export const chapterService = {
  // Lấy danh sách chapter của 1 truyện
  getChapters: (storyId: number) =>
    apiClient.get(`/stories/${storyId}/chapters`),
  
  /**
   * Lấy nội dung chapter cụ thể
   * @param storyId ID của truyện
   * @param chapterNumber Số thứ tự chương
   * @param userId ID của người dùng (tùy chọn) để kiểm tra xem chương đã được mở khóa chưa
   */
  getChapterContent: (storyId: number, chapterNumber: number, userId?: number) =>
    apiClient.get(`/stories/${storyId}/chapters/${chapterNumber}`, {
      params: { userId } // Truyền userId dưới dạng Query Parameter (?userId=...)
    }),

  /**
   * Mở khóa chương bằng Xu
   * @param storyId ID của truyện
   * @param chapterId ID thực tế của chương (ID trong database)
   * @param userId ID người dùng thực hiện mua
   */
  unlockChapter: (storyId: number, chapterId: number, userId: number) =>
    apiClient.post(`/stories/${storyId}/chapters/${chapterId}/unlock`, null, {
      params: { userId }
    }),
};