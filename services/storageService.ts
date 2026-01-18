import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';

const getScopedKey = (baseKey: string, userId?: string | number) => {
  const suffix = userId ? userId.toString() : 'guest';
  return `${baseKey}_${suffix}`;
};

const KEYS = {
  READING_HISTORY: '@reading_history',
  FAVORITES: '@favorites',
  READING_PROGRESS: '@reading_progress',
  LIFETIME_STATS: '@lifetime_stats',
};

export interface LifetimeStats {
  totalChaptersRead: number;
}

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
  async getCurrentUserId(): Promise<string | undefined> {
    const user = await authService.getStoredUser();
    return user?.id?.toString();
  },
  // Lấy lịch sử đọc
  async getReadingHistory(userId?: string): Promise<ReadingHistoryItem[]> {
    try {
      const id = userId || await this.getCurrentUserId();
      const key = getScopedKey(KEYS.READING_HISTORY, id);
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  },

  async getLifetimeStats(userId?: string): Promise<LifetimeStats> {
    try {
      const id = userId || await this.getCurrentUserId();
      const key = getScopedKey(KEYS.LIFETIME_STATS, id);
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : { totalChaptersRead: 0 };
    } catch (error) {
      return { totalChaptersRead: 0 };
    }
  },

  // Thêm/cập nhật lịch sử đọc (LƯU NHIỀU CHƯƠNG)
  async addToReadingHistory(item: ReadingHistoryItem, userId?: string): Promise<void> {
    try {
      const id = userId || await this.getCurrentUserId();
      const history = await this.getReadingHistory(id);

      const existingIndex = history.findIndex(
        h => h.storyId === item.storyId && h.lastReadChapter === item.lastReadChapter
      );

      if (existingIndex !== -1) {
        history[existingIndex].lastReadAt = item.lastReadAt;
      } else {
        history.unshift(item);
        await this.incrementLifetimeChapters(id);
      }

      const limitedHistory = history.slice(0, 200);
      const key = getScopedKey(KEYS.READING_HISTORY, id);
      await AsyncStorage.setItem(key, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Error adding to reading history:', error);
    }
  },

  async incrementLifetimeChapters(userId?: string): Promise<void> {
    try {
      const id = userId || await this.getCurrentUserId();
      const stats = await this.getLifetimeStats(id);
      stats.totalChaptersRead += 1;
      const key = getScopedKey(KEYS.LIFETIME_STATS, id);
      await AsyncStorage.setItem(key, JSON.stringify(stats));
    } catch (error) {
      console.error('Error incrementing stats:', error);
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
  async clearReadingHistory(userId?: string): Promise<void> {
    try {
      const id = userId || await this.getCurrentUserId();
      const key = getScopedKey(KEYS.READING_HISTORY, id);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing history:', error);
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
  async getFavorites(userId?: string): Promise<number[]> {
    try {
      const id = userId || await this.getCurrentUserId();
      const key = getScopedKey(KEYS.FAVORITES, id);
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  },

  // Thêm vào yêu thích
  async addToFavorites(storyId: number, userId?: string): Promise<void> {
    try {
      const id = userId || await this.getCurrentUserId();
      const favorites = await this.getFavorites(id);
      if (!favorites.includes(storyId)) {
        favorites.push(storyId);
        const key = getScopedKey(KEYS.FAVORITES, id);
        await AsyncStorage.setItem(key, JSON.stringify(favorites));
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