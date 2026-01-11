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

  // Thêm/cập nhật lịch sử đọc
  async addToReadingHistory(item: ReadingHistoryItem): Promise<void> {
    try {
      const history = await this.getReadingHistory();
      
      // Xóa item cũ nếu đã tồn tại
      const filteredHistory = history.filter(h => h.storyId !== item.storyId);
      
      // Thêm item mới vào đầu
      const newHistory = [item, ...filteredHistory];
      
      // Giới hạn 50 item
      const limitedHistory = newHistory.slice(0, 50);
      
      await AsyncStorage.setItem(KEYS.READING_HISTORY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Error adding to reading history:', error);
    }
  },

  // Xóa một item khỏi lịch sử
  async removeFromReadingHistory(storyId: number): Promise<void> {
    try {
      const history = await this.getReadingHistory();
      const newHistory = history.filter(h => h.storyId !== storyId);
      await AsyncStorage.setItem(KEYS.READING_HISTORY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error removing from reading history:', error);
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
      const key = `${KEYS.READING_PROGRESS}_${progress.storyId}`;
      await AsyncStorage.setItem(key, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving reading progress:', error);
    }
  },

  // Lấy tiến độ đọc
  async getReadingProgress(storyId: number): Promise<ReadingProgress | null> {
    try {
      const key = `${KEYS.READING_PROGRESS}_${storyId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting reading progress:', error);
      return null;
    }
  },
};