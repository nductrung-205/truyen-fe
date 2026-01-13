import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  READING_HISTORY: '@reading_history',
  FAVORITES: '@favorites',
  READING_PROGRESS: '@reading_progress',
};

export interface ReadingHistoryItem {
  storyId: number;
  storyTitle: string;
  thumbnailUrl: string;
  authorName: string;
  lastReadChapter: number;
  lastReadAt: string;
  chapterId?: number; // ID duy nhất cho mỗi entry (storyId + chapterNumber)
}

export interface ReadingProgress {
  storyId: number;
  chapterNumber: number;
  scrollPosition: number;
}

// ============================================
// READING HISTORY (Lịch sử đọc)
// ============================================

export const storageService = {
  // Lấy lịch sử đọc
  async getReadingHistory(): Promise<ReadingHistoryItem[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.READING_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting reading history:', error);
      return [];
    }
  },

  // Thêm/cập nhật lịch sử đọc (LƯU NHIỀU CHƯƠNG)
  async addToReadingHistory(item: ReadingHistoryItem): Promise<void> {
    try {
      const history = await this.getReadingHistory();
      
      // Tìm entry có cùng storyId VÀ chapterNumber
      const existingIndex = history.findIndex(
        h => h.storyId === item.storyId && h.lastReadChapter === item.lastReadChapter
      );
      
      if (existingIndex !== -1) {
        // Nếu đã tồn tại entry này, chỉ cập nhật thời gian đọc
        history[existingIndex].lastReadAt = item.lastReadAt;
        history[existingIndex].storyTitle = item.storyTitle;
        history[existingIndex].thumbnailUrl = item.thumbnailUrl;
        history[existingIndex].authorName = item.authorName;
      } else {
        // Nếu chưa có, thêm entry mới vào đầu
        history.unshift(item);
      }
      
      // Sắp xếp theo thời gian đọc mới nhất
      history.sort((a, b) => 
        new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()
      );
      
      // Giới hạn tổng số entry (ví dụ: 200 entry = ~40 truyện x 5 chương/truyện)
      const limitedHistory = history.slice(0, 200);
      
      await AsyncStorage.setItem(KEYS.READING_HISTORY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Error adding to reading history:', error);
    }
  },

  // Xóa TẤT CẢ các chương của một truyện khỏi lịch sử
  async removeFromReadingHistory(storyId: number): Promise<void> {
    try {
      const history = await this.getReadingHistory();
      const newHistory = history.filter(h => h.storyId !== storyId);
      await AsyncStorage.setItem(KEYS.READING_HISTORY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error removing from reading history:', error);
    }
  },

  // Xóa MỘT chương cụ thể khỏi lịch sử
  async removeChapterFromHistory(storyId: number, chapterNumber: number): Promise<void> {
    try {
      const history = await this.getReadingHistory();
      const newHistory = history.filter(
        h => !(h.storyId === storyId && h.lastReadChapter === chapterNumber)
      );
      await AsyncStorage.setItem(KEYS.READING_HISTORY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error removing chapter from reading history:', error);
    }
  },

  // Xóa toàn bộ lịch sử
  async clearReadingHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.READING_HISTORY);
    } catch (error) {
      console.error('Error clearing reading history:', error);
    }
  },

  // Lấy danh sách các chương đã đọc của một truyện
  async getReadChaptersForStory(storyId: number): Promise<number[]> {
    try {
      const history = await this.getReadingHistory();
      const chapters = history
        .filter(h => h.storyId === storyId)
        .map(h => h.lastReadChapter)
        .sort((a, b) => a - b); // Sắp xếp tăng dần
      
      // Loại bỏ trùng lặp (nếu có)
      return [...new Set(chapters)];
    } catch (error) {
      console.error('Error getting read chapters:', error);
      return [];
    }
  },

  // Lấy chương đọc gần nhất của một truyện
  async getLastReadChapter(storyId: number): Promise<number | null> {
    try {
      const history = await this.getReadingHistory();
      const storyEntries = history
        .filter(h => h.storyId === storyId)
        .sort((a, b) => 
          new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()
        );
      
      return storyEntries.length > 0 ? storyEntries[0].lastReadChapter : null;
    } catch (error) {
      console.error('Error getting last read chapter:', error);
      return null;
    }
  },

  // ============================================
  // FAVORITES (Yêu thích)
  // ============================================

  // Lấy danh sách yêu thích
  async getFavorites(): Promise<number[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  },

  // Thêm vào yêu thích
  async addToFavorites(storyId: number): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      if (!favorites.includes(storyId)) {
        favorites.push(storyId);
        await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites));
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  },

  // Xóa khỏi yêu thích
  async removeFromFavorites(storyId: number): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const newFavorites = favorites.filter(id => id !== storyId);
      await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  },

  // Kiểm tra có trong yêu thích không
  async isFavorite(storyId: number): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.includes(storyId);
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  },

  // ============================================
  // READING PROGRESS (Tiến độ đọc)
  // ============================================

  // Lưu tiến độ đọc
  async saveReadingProgress(progress: ReadingProgress): Promise<void> {
    try {
      const key = `${KEYS.READING_PROGRESS}_${progress.storyId}_${progress.chapterNumber}`;
      await AsyncStorage.setItem(key, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving reading progress:', error);
    }
  },

  // Lấy tiến độ đọc
  async getReadingProgress(storyId: number, chapterNumber: number): Promise<ReadingProgress | null> {
    try {
      const key = `${KEYS.READING_PROGRESS}_${storyId}_${chapterNumber}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting reading progress:', error);
      return null;
    }
  },

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  // Lấy thống kê đọc truyện
  async getReadingStats(): Promise<{
    totalStoriesRead: number;
    totalChaptersRead: number;
    recentStories: ReadingHistoryItem[];
  }> {
    try {
      const history = await this.getReadingHistory();
      
      // Đếm số truyện duy nhất
      const uniqueStories = new Set(history.map(h => h.storyId));
      
      // Lấy 10 entry gần nhất
      const recentStories = history.slice(0, 10);
      
      return {
        totalStoriesRead: uniqueStories.size,
        totalChaptersRead: history.length,
        recentStories,
      };
    } catch (error) {
      console.error('Error getting reading stats:', error);
      return {
        totalStoriesRead: 0,
        totalChaptersRead: 0,
        recentStories: [],
      };
    }
  },
};